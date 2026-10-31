import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fixture, command } from "./fixtures/jobs.mjs";
import { createReview, applyReview } from "./review.mjs";
import { createJobs, applyJob } from "./jobs.mjs";
import { initializeJobStore, updateJobStore } from "./job-store.mjs";
import { createKlingHandoff, writeKlingHandoff } from "./kling-handoff.mjs";
async function sandbox(fn) {
  const root = await mkdtemp(join(tmpdir(), "kling-handoff-"));
  try {
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
async function setup(root, refs = true) {
  const f = fixture(),
    workspace = join(root, "workspace"),
    film = "projects/film";
  await mkdir(join(workspace, film, "refs"), { recursive: true });
  const bytes = "Synthetic reference bytes",
    sha256 = createHash("sha256").update(bytes).digest("hex");
  await writeFile(join(workspace, film, "refs/frame.png"), bytes);
  f.bundle.references[0].record.sha256 = sha256;
  f.bundle.references[0].media = {
    state: "verified",
    path: film + "/refs/frame.png",
    observedSha256: sha256,
  };
  f.review = createReview(f.bundle);
  if (refs)
    f.review = applyReview(
      f.bundle,
      f.review,
      command(f.review, {
        type: "assign-reference",
        shotKey: "plan:S1",
        referenceId: "R1",
        role: "identity",
        expectedMediaSha256: sha256,
        reason: "Explicit synthetic input",
      }),
    );
  let state = createJobs(f.bundle);
  state = applyJob(
    f.bundle,
    state,
    command(state, {
      type: "prepare",
      request: f.request,
      review: f.review,
      reason: "Prepare candidate",
    }),
  );
  return {
    ...f,
    state,
    workspace,
    film,
    jobId: "job-1",
    expectedRevision: 1,
    requestFingerprint: state.jobs[0].requestFingerprint,
    settings: {
      tool: refs ? "image_to_video" : "text_to_video",
      args: { duration: "4", aspect_ratio: "16:9", resolution: "1080p", imageCount: "1" },
      inputSlots: refs ? { first_image: "R1" } : {},
    },
  };
}
test("verified reference handoff preserves intent/provenance and remains blocked", () =>
  sandbox(async (root) => {
    const f = await setup(root),
      before = JSON.stringify({ state: f.state, bundle: f.bundle, review: f.review }),
      h = await createKlingHandoff(f);
    assert.equal(h.spec[0].model, "explicit-model-intent");
    assert.equal(h.spec[0].prompt, "A quiet reaction, eye level.");
    assert.equal(h.spec[0].inputs.first_image, "refs/frame.png");
    assert.equal(h.spec[0].auth, null);
    assert.ok(h.spec[0].submissionBlocked);
    assert.equal(h.receipt.executionAllowed, false);
    assert.deepEqual(h.receipt.shot.record.lineIds, ["L1"]);
    assert.equal(h.receipt.bindings[0].role, "identity");
    assert.equal(h.receipt.jobRequestFingerprint, f.requestFingerprint);
    assert.equal(JSON.stringify({ state: f.state, bundle: f.bundle, review: f.review }), before);
    assert.equal(
      await readFile(join(f.workspace, f.film, "refs/frame.png"), "utf8"),
      "Synthetic reference bytes",
    );
  }));
test("producer fingerprint uses the independently specified canonical native payload", () =>
  sandbox(async (root) => {
    const h = await createKlingHandoff(await setup(root, false));
    const native =
      '{"args":{"aspectratio":"16:9","duration":"4","imagecount":"1","resolution":"1080p"},"images":[],"inputFacts":{},"inputs":{},"model":"explicit-model-intent","prompt":"A quiet reaction, eye level.","referenceDurationSeconds":null,"tool":"text_to_video"}';
    assert.equal(
      h.receipt.producerPayloadSha256,
      createHash("sha256").update(native).digest("hex"),
    );
  }));
for (const [name, change] of [
  [
    "stale revision",
    (f) => {
      f.expectedRevision = 0;
    },
  ],
  [
    "wrong fingerprint",
    (f) => {
      f.requestFingerprint = "f".repeat(64);
    },
  ],
  [
    "changed import",
    (f) => {
      f.bundle.documents.changed = { sha256: "a".repeat(64) };
    },
  ],
  [
    "wrong route",
    (f) => {
      f.state.jobs[0].request.route = "higgsfield-manual";
    },
  ],
  [
    "unrecorded reference mapping",
    (f) => {
      f.settings.inputSlots.first_image = "missing";
    },
  ],
  [
    "dropped reference",
    (f) => {
      f.settings.inputSlots = {};
    },
  ],
  [
    "reserved flag",
    (f) => {
      f.settings.args.poll = "3600";
    },
  ],
  [
    "duplicate argument aliases",
    (f) => {
      f.settings.args.aspectRatio = "16:9";
    },
  ],
  [
    "changed duration",
    (f) => {
      f.settings.args.duration = "5";
    },
  ],
  [
    "changed aspect",
    (f) => {
      f.settings.args.aspect_ratio = "1:1";
    },
  ],
  [
    "changed resolution",
    (f) => {
      f.settings.args.resolution = "720p";
    },
  ],
  [
    "multiple results",
    (f) => {
      f.settings.args.imageCount = "2";
    },
  ],
  [
    "implicit argument value",
    (f) => {
      f.settings.args.duration = 4;
    },
  ],
  [
    "unsafe job identifier",
    (f) => {
      f.jobId = "../job-1";
    },
  ],
  [
    "unsupported tool",
    (f) => {
      f.settings.tool = "motion_control";
    },
  ],
  [
    "authorization injection",
    (f) => {
      f.settings.auth = "claimed-approval";
    },
  ],
])
  test(`handoff rejects ${name}`, () =>
    sandbox(async (root) => {
      const f = await setup(root);
      change(f);
      await assert.rejects(createKlingHandoff(f));
    }));
test("changed review reference assignments invalidate a prepared handoff", () =>
  sandbox(async (root) => {
    const f = await setup(root);
    f.review = applyReview(
      f.bundle,
      f.review,
      command(f.review, {
        type: "clear-reference",
        shotKey: "plan:S1",
        referenceId: "R1",
        reason: "Different input plan",
      }),
    );
    await assert.rejects(createKlingHandoff(f), /review|reference/i);
  }));
test("unrelated review changes retain the prepared shot context", () =>
  sandbox(async (root) => {
    const f = await setup(root);
    f.review = applyReview(
      f.bundle,
      f.review,
      command(f.review, {
        type: "assign-reference",
        shotKey: "plan:S2",
        referenceId: "R1",
        role: "identity",
        expectedMediaSha256: f.bundle.references[0].media.observedSha256,
        reason: "Other shot",
      }),
    );
    const h = await createKlingHandoff(f);
    assert.equal(h.receipt.reviewRevision, 2);
  }));
test("changed reference bytes, outside-film references and symlink escapes are refused", () =>
  sandbox(async (root) => {
    const f = await setup(root);
    await writeFile(join(f.workspace, f.film, "refs/frame.png"), "Changed bytes");
    await assert.rejects(createKlingHandoff(f), /hash/i);
    await rm(join(f.workspace, f.film, "refs/frame.png"));
    await writeFile(join(root, "outside.png"), "Synthetic reference bytes");
    await symlink(join(root, "outside.png"), join(f.workspace, f.film, "refs/frame.png"));
    await assert.rejects(createKlingHandoff(f));
    const other = await setup(join(root, "another"));
    other.film = "projects/other";
    await mkdir(join(other.workspace, other.film));
    await assert.rejects(createKlingHandoff(other));
  }));
test("output creates a new isolated packet and preserves existing destinations", () =>
  sandbox(async (root) => {
    const f = await setup(root),
      h = await createKlingHandoff(f),
      out = join(root, "packet");
    await writeKlingHandoff(h, out, f.workspace);
    const before = await readFile(join(out, "runner-spec.json"), "utf8");
    assert.equal(JSON.parse(before)[0].auth, null);
    await assert.rejects(writeKlingHandoff(h, out, f.workspace));
    assert.equal(await readFile(join(out, "runner-spec.json"), "utf8"), before);
    await assert.rejects(writeKlingHandoff(h, join(f.workspace, "packet"), f.workspace));
  }));
test("actual CLI previews without writes and saves a blocked packet only on explicit output", () =>
  sandbox(async (root) => {
    const f = await setup(root),
      store = join(root, "store");
    let s = await initializeJobStore(f.bundle, store);
    await updateJobStore(
      f.bundle,
      store,
      command(s, { type: "prepare", request: f.request, review: f.review, reason: "Prepare" }),
    );
    for (const [name, value] of [
      ["import", f.bundle],
      ["review", f.review],
      ["settings", f.settings],
    ])
      await writeFile(join(root, name + ".json"), JSON.stringify(value));
    const cli = new URL("./kling-handoff-cli.mjs", import.meta.url).pathname,
      args = [
        "--import",
        join(root, "import.json"),
        "--store",
        store,
        "--review",
        join(root, "review.json"),
        "--settings",
        join(root, "settings.json"),
        "--job",
        "job-1",
        "--expected-revision",
        "1",
        "--request-fingerprint",
        f.requestFingerprint,
        "--workspace",
        f.workspace,
        "--film",
        f.film,
      ];
    let p = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
    assert.equal(p.status, 0, p.stderr);
    assert.equal(JSON.parse(p.stdout).receipt.executionAllowed, false);
    const out = join(root, "cli-packet");
    p = spawnSync(process.execPath, [cli, ...args, "--output", out], { encoding: "utf8" });
    assert.equal(p.status, 0, p.stderr);
    assert.equal(JSON.parse(await readFile(join(out, "handoff.json"), "utf8")).jobId, "job-1");
    p = spawnSync(process.execPath, [cli, ...args, "--output", out], { encoding: "utf8" });
    assert.notEqual(p.status, 0);
  }));

test("output parent replacement cannot redirect a packet into the canonical workspace", () =>
  sandbox(async (root) => {
    const workspace = join(root, "canonical"),
      parent = join(root, "exports");
    await mkdir(workspace);
    await mkdir(parent);
    const script = String.raw`
 import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';import assert from 'node:assert/strict';import {join} from 'node:path';
 const [workspace,parent,moduleUrl]=process.argv.slice(1),original=fs.realpath;let swapped=false;
 fs.realpath=async(path,...rest)=>{const result=await original(path,...rest);if(!swapped && String(path)===parent){swapped=true;await fs.rename(parent,parent+'-original');await fs.symlink(workspace,parent);}return result;};syncBuiltinESMExports();
 const {writeKlingHandoff}=await import(moduleUrl);
 const packet={spec:[{auth:null,submissionBlocked:'blocked'}],receipt:{executionAllowed:false}};
 try{await writeKlingHandoff(packet,join(parent,'packet'),workspace);}catch{}
 await assert.rejects(fs.readFile(join(workspace,'packet','runner-spec.json')),e=>e.code==='ENOENT');assert.equal(swapped,true);
 `;
    const p = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        script,
        workspace,
        parent,
        new URL("./kling-handoff.mjs", import.meta.url).href,
      ],
      { encoding: "utf8", timeout: 3000 },
    );
    assert.equal(p.status, 0, p.stderr);
  }));

for (const timing of ["after-directory-check", "during-first-write"])
  test(`export refuses success when its opened directory relocates ${timing}`, () =>
    sandbox(async (root) => {
      const workspace = join(root, "canonical"),
        parent = join(root, "exports");
      await mkdir(workspace);
      await mkdir(parent);
      const script = String.raw`
 import fs from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';import assert from 'node:assert/strict';import {join} from 'node:path';
 const [workspace,parent,timing,moduleUrl]=process.argv.slice(1),realpath=fs.realpath,write=fs.writeFile;let moved=false;
 const move=async()=>{moved=true;await fs.rename(parent,join(workspace,'moved-exports'));};
 if(timing==='after-directory-check') fs.realpath=async(path,...rest)=>{const actual=await realpath(path,...rest);if(!moved && String(path).startsWith('/proc/self/fd/') && actual===join(parent,'packet'))await move();return actual;};
 else fs.writeFile=async(path,...rest)=>{if(!moved && String(path).endsWith('/runner-spec.json'))await move();return write(path,...rest);};
 syncBuiltinESMExports();const {writeKlingHandoff}=await import(moduleUrl);
 await assert.rejects(writeKlingHandoff({spec:[{auth:null,submissionBlocked:'blocked'}],receipt:{executionAllowed:false}},join(parent,'packet'),workspace),/overlap|relocat/i);
 assert.equal(moved,true);await assert.rejects(fs.readFile(join(workspace,'moved-exports','packet','handoff.json')),e=>e.code==='ENOENT');
 if(timing==='after-directory-check')await assert.rejects(fs.readFile(join(workspace,'moved-exports','packet','runner-spec.json')),e=>e.code==='ENOENT');
 `;
      const p = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          script,
          workspace,
          parent,
          timing,
          new URL("./kling-handoff.mjs", import.meta.url).href,
        ],
        { encoding: "utf8", timeout: 3000 },
      );
      assert.equal(p.status, 0, p.stderr);
    }));
