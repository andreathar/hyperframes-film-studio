import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  initializeJobStore,
  readJobStore,
  updateJobStore,
  inspectJobReceipt,
} from "./job-store.mjs";
import { fixture, command, receipt } from "./fixtures/jobs.mjs";
async function sandbox(fn) {
  const root = await mkdtemp(join(tmpdir(), "film-jobs-"));
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
async function prepared(root) {
  const f = fixture(),
    store = join(root, "store"),
    s = await initializeJobStore(f.bundle, store);
  const state = await updateJobStore(
    f.bundle,
    store,
    command(s, {
      type: "prepare",
      request: f.request,
      review: f.review,
      reason: "Prepare synthetic candidate",
    }),
  );
  return { ...f, store, state };
}
test("store refuses existing directories and persists replayable updates across reloads", () =>
  sandbox(async (root) => {
    const f = await prepared(root);
    assert.equal((await readJobStore(f.bundle, f.store)).revision, 1);
    const before = await readFile(join(f.store, "state.json"), "utf8");
    await assert.rejects(initializeJobStore(f.bundle, f.store));
    await assert.rejects(
      updateJobStore(
        f.bundle,
        f.store,
        command(
          { ...f.state, revision: 0 },
          {
            type: "prepare",
            request: { ...f.request, id: "job-2" },
            review: f.review,
            reason: "Stale",
          },
        ),
      ),
      /revision/i,
    );
    assert.equal(await readFile(join(f.store, "state.json"), "utf8"), before);
  }));
test("another writer lock is preserved and competing revision updates publish only once", () =>
  sandbox(async (root) => {
    const f = await prepared(root),
      lock = join(f.store, ".write.lock");
    await writeFile(lock, "other writer");
    const c = command(f.state, {
      type: "prepare",
      request: { ...f.request, id: "job-2", prompt: "Another action" },
      review: f.review,
      reason: "Another intent",
    });
    await assert.rejects(updateJobStore(f.bundle, f.store, c), /lock|writer/i);
    assert.equal(await readFile(lock, "utf8"), "other writer");
    await rm(lock);
    const results = await Promise.allSettled([
      updateJobStore(f.bundle, f.store, c),
      updateJobStore(f.bundle, f.store, c),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await readJobStore(f.bundle, f.store)).revision, 2);
  }));
test("real local receipt hashes and output bytes survive unknown-to-success persistence", () =>
  sandbox(async (root) => {
    const f = await prepared(root),
      workspace = join(root, "work");
    await mkdir(workspace);
    await writeFile(
      join(workspace, "unknown.json"),
      JSON.stringify({ ...receipt(f.state.jobs[0], "unknown"), externalId: null }),
    );
    let s = await updateJobStore(
      f.bundle,
      f.store,
      command(f.state, {
        type: "observe",
        receiptPath: "unknown.json",
        reason: "Outcome uncertain",
      }),
      { workspace },
    );
    await writeFile(join(workspace, "clip.mp4"), "owned synthetic bytes");
    const sha256 = createHash("sha256").update("owned synthetic bytes").digest("hex");
    const record = {
      ...receipt(s.jobs[0], "reported-succeeded"),
      outputs: [{ path: "clip.mp4", kind: "video", sha256 }],
    };
    const bytes = JSON.stringify(record);
    await writeFile(join(workspace, "done.json"), bytes);
    const inspected = await inspectJobReceipt(workspace, "done.json");
    assert.equal(inspected.evidence.sha256, createHash("sha256").update(bytes).digest("hex"));
    s = await updateJobStore(
      f.bundle,
      f.store,
      command(s, { type: "observe", receiptPath: "done.json", reason: "Inspect returned bytes" }),
      { workspace },
    );
    const restored = await readJobStore(f.bundle, f.store);
    assert.equal(restored.jobs[0].outputs[0].sha256, sha256);
    assert.equal(restored.jobs[0].outputs[0].status, "candidate");
    assert.equal(restored.executionAllowed, false);
    assert.equal(await readFile(join(workspace, "clip.mp4"), "utf8"), "owned synthetic bytes");
  }));
test("changed, missing and escaped result bytes cannot publish a successful observation", () =>
  sandbox(async (root) => {
    const f = await prepared(root),
      workspace = join(root, "work");
    await mkdir(workspace);
    await writeFile(join(root, "outside.mp4"), "outside");
    await symlink(join(root, "outside.mp4"), join(workspace, "escape.mp4"));
    for (const path of [
      "missing.mp4",
      "escape.mp4",
      "../outside.mp4",
      "https://example.invalid/clip.mp4",
    ]) {
      await writeFile(
        join(workspace, "done.json"),
        JSON.stringify({
          ...receipt(f.state.jobs[0], "reported-succeeded"),
          outputs: [{ path, kind: "video", sha256: "a".repeat(64) }],
        }),
      );
      await assert.rejects(
        updateJobStore(
          f.bundle,
          f.store,
          command(f.state, { type: "observe", receiptPath: "done.json", reason: "Should fail" }),
          { workspace },
        ),
      );
    }
    await writeFile(join(workspace, "changed.mp4"), "changed");
    await writeFile(
      join(workspace, "done.json"),
      JSON.stringify({
        ...receipt(f.state.jobs[0], "reported-succeeded"),
        outputs: [{ path: "changed.mp4", kind: "video", sha256: "a".repeat(64) }],
      }),
    );
    await assert.rejects(
      updateJobStore(
        f.bundle,
        f.store,
        command(f.state, { type: "observe", receiptPath: "done.json", reason: "Changed bytes" }),
        { workspace },
      ),
      /hash/i,
    );
    assert.equal((await readJobStore(f.bundle, f.store)).revision, 1);
  }));
test("receipt paths are confined and oversized receipts fail before state mutation", () =>
  sandbox(async (root) => {
    const workspace = join(root, "work");
    await mkdir(workspace);
    await writeFile(join(root, "outside.json"), "{}");
    await symlink(join(root, "outside.json"), join(workspace, "escape.json"));
    for (const p of ["../outside.json", "escape.json", "/absolute.json"])
      await assert.rejects(inspectJobReceipt(workspace, p));
    await writeFile(join(workspace, "big.json"), " ".repeat(1024 * 1024 + 1));
    await assert.rejects(inspectJobReceipt(workspace, "big.json"), /size|MiB|large/i);
  }));
test("edited ledger state fails replay without being overwritten", () =>
  sandbox(async (root) => {
    const f = await prepared(root),
      file = join(f.store, "state.json"),
      state = JSON.parse(await readFile(file, "utf8"));
    state.executionAllowed = true;
    const changed = JSON.stringify(state);
    await writeFile(file, changed);
    await assert.rejects(readJobStore(f.bundle, f.store));
    assert.equal(await readFile(file, "utf8"), changed);
  }));
test("CLI initializes, prepares and shows durable jobs and refuses missing revisions or unknown flags", () =>
  sandbox(async (root) => {
    const f = fixture(),
      store = join(root, "cli-store"),
      input = join(root, "import.json"),
      review = join(root, "review.json"),
      request = join(root, "request.json");
    await writeFile(input, JSON.stringify(f.bundle));
    await writeFile(review, JSON.stringify(f.review));
    await writeFile(request, JSON.stringify(f.request));
    const cli = new URL("./jobs-cli.mjs", import.meta.url).pathname;
    const run = (args) =>
      spawnSync(process.execPath, [cli, "--import", input, "--store", store, ...args], {
        encoding: "utf8",
      });
    let p = run(["--operation", "init"]);
    assert.equal(p.status, 0, p.stderr);
    assert.equal(JSON.parse(p.stdout).revision, 0);
    p = run([
      "--operation",
      "prepare",
      "--review",
      review,
      "--request",
      request,
      "--reason",
      "Prepare",
    ]);
    assert.notEqual(p.status, 0);
    p = run([
      "--operation",
      "prepare",
      "--review",
      review,
      "--request",
      request,
      "--expected-revision",
      "0",
      "--reason",
      "Prepare",
    ]);
    assert.equal(p.status, 0, p.stderr);
    assert.equal(JSON.parse(p.stdout).jobs[0].state, "prepared");
    p = run([]);
    assert.equal(p.status, 0, p.stderr);
    assert.equal(JSON.parse(p.stdout).revision, 1);
    p = run(["--submit"]);
    assert.notEqual(p.status, 0);
  }));

test("FIFO receipts and JSON inputs fail promptly without abandoning the writer lock", () =>
  sandbox(async (root) => {
    const f = await prepared(root),
      fifo = join(root, "receipt.json");
    assert.equal(spawnSync("mkfifo", [fifo]).status, 0);
    const cli = new URL("./jobs-cli.mjs", import.meta.url).pathname,
      input = join(root, "import.json");
    await writeFile(input, JSON.stringify(f.bundle));
    const p = spawnSync(
      process.execPath,
      [
        cli,
        "--import",
        input,
        "--store",
        f.store,
        "--operation",
        "observe",
        "--workspace",
        root,
        "--receipt",
        "receipt.json",
        "--expected-revision",
        "1",
        "--reason",
        "Reject special file",
      ],
      { encoding: "utf8", timeout: 1200 },
    );
    assert.equal(p.error, undefined, "FIFO receipt blocked instead of being rejected");
    assert.notEqual(p.status, 0);
    await assert.rejects(readFile(join(f.store, ".write.lock")), (e) => e.code === "ENOENT");
    assert.equal((await readJobStore(f.bundle, f.store)).revision, 1);
    const q = spawnSync(process.execPath, [cli, "--import", fifo, "--store", f.store], {
      encoding: "utf8",
      timeout: 1200,
    });
    assert.equal(q.error, undefined, "FIFO JSON input blocked instead of being rejected");
    assert.notEqual(q.status, 0);
  }));
for (const mode of ["leaf", "parent"])
  test(`opened descriptor rejects a ${mode} symlink replacement after path validation`, () =>
    sandbox(async (root) => {
      const workspace = join(root, "work"),
        outside = join(root, "outside");
      await mkdir(workspace);
      await mkdir(outside);
      const sub = join(workspace, "sub");
      await mkdir(sub);
      await writeFile(join(sub, "clip.mp4"), "inside");
      await writeFile(join(outside, "clip.mp4"), "outside");
      await writeFile(
        join(workspace, "done.json"),
        JSON.stringify({
          outputs: [
            { path: "sub/clip.mp4", sha256: createHash("sha256").update("outside").digest("hex") },
          ],
        }),
      );
      const script = String.raw`
 import fs from 'node:fs/promises';
 import {syncBuiltinESMExports} from 'node:module';
 import assert from 'node:assert/strict';
 import {join} from 'node:path';
 const [workspace,outside,mode,moduleUrl]=process.argv.slice(1);
 const original=fs.realpath;let swapped=false;
 fs.realpath=async(path,...rest)=>{
  const actual=await original(path,...rest);
  if(!swapped && String(path)===join(workspace,'sub','clip.mp4')) {
   swapped=true;
   if(mode==='leaf') {await fs.unlink(actual);await fs.symlink(join(outside,'clip.mp4'),actual);}
   else {await fs.rename(join(workspace,'sub'),join(workspace,'old-sub'));await fs.symlink(outside,join(workspace,'sub'));}
  }
  return actual;
 };
 syncBuiltinESMExports();
 const {inspectJobReceipt}=await import(moduleUrl);
 await assert.rejects(inspectJobReceipt(workspace,'done.json'));
 assert.equal(swapped,true,'Race fixture did not reach the checked/open boundary');
 `;
      const p = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          script,
          workspace,
          outside,
          mode,
          new URL("./job-store.mjs", import.meta.url).href,
        ],
        { encoding: "utf8", timeout: 2000 },
      );
      assert.equal(p.status, 0, p.stderr);
    }));

test("publication failure preserves the old revision and releases the owned lock for retry", () =>
  sandbox(async (root) => {
    const f = await prepared(root),
      input = join(root, "fixture.json");
    await writeFile(
      input,
      JSON.stringify({ bundle: f.bundle, review: f.review, request: f.request }),
    );
    const script = String.raw`
 import fs from 'node:fs/promises';
 import {syncBuiltinESMExports} from 'node:module';
 import assert from 'node:assert/strict';
 import {join} from 'node:path';
 const [store,input,moduleUrl]=process.argv.slice(1), f=JSON.parse(await fs.readFile(input,'utf8'));
 const original=fs.rename;let failed=false;
 fs.rename=async(from,to)=>{if(!failed && to===join(store,'state.json')){failed=true;throw new Error('Synthetic publication failure');}return original(from,to);};syncBuiltinESMExports();
 const {readJobStore,updateJobStore}=await import(moduleUrl),before=await readJobStore(f.bundle,store);
 const c={projectId:before.projectId,sourceFingerprint:before.sourceFingerprint,expectedRevision:1,action:{type:'prepare',request:{...f.request,id:'job-2',prompt:'Another action'},review:f.review,reason:'New intent'}};
 await assert.rejects(updateJobStore(f.bundle,store,c),/publication failure/);
 assert.equal((await readJobStore(f.bundle,store)).revision,1);
 await assert.rejects(fs.readFile(join(store,'.write.lock')),e=>e.code==='ENOENT');
 assert.equal((await updateJobStore(f.bundle,store,c)).revision,2);
 `;
    const p = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        script,
        f.store,
        input,
        new URL("./job-store.mjs", import.meta.url).href,
      ],
      { encoding: "utf8", timeout: 2000 },
    );
    assert.equal(p.status, 0, p.stderr);
  }));
