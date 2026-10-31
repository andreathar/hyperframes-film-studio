import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { Window } from "happy-dom";
import { fixture } from "./fixtures/jobs.mjs";
import { initializeJobStore, readJobStore } from "./job-store.mjs";
import { createInspectorServer } from "./inspector-server.mjs";
async function app(fn, { jobs = true, results = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), "inspector-jobs-")),
    f = fixture(),
    jobStore = join(root, "jobs"),
    resultsWorkspace = join(root, "results");
  await initializeJobStore(f.bundle, jobStore);
  await mkdir(resultsWorkspace);
  const server = createInspectorServer({
    bundle: f.bundle,
    state: f.review,
    jobStore: jobs ? jobStore : undefined,
    resultsWorkspace: results ? resultsWorkspace : undefined,
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn({ ...f, base, root, jobStore, resultsWorkspace });
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    await rm(root, { recursive: true, force: true });
  }
}
const get = async (base, path) => {
  const r = await fetch(base + path);
  assert.equal(r.status, 200);
  return r.json();
};
const post = (base, v, path, body, headers = {}) =>
  fetch(base + path, {
    method: "POST",
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      "X-Film-CSRF": v.csrf,
      ...headers,
    },
    body: JSON.stringify(body),
  });
const prep = (f, v, revision = 0) => ({
  projectId: v.projectId,
  sourceFingerprint: v.review.sourceFingerprint,
  expectedRevision: revision,
  expectedReviewRevision: v.review.revision,
  expectedReviewFingerprint: v.reviewFingerprint,
  request: f.request,
  reason: "Prepare candidate through inspector",
});
test("job controls prepare durable intent and expose only the intended projection", () =>
  app(async (f) => {
    const v = await get(f.base, "/api/view"),
      initial = await get(f.base, "/api/jobs");
    assert.equal(initial.enabled, true);
    assert.equal(initial.revision, 0);
    const r = await post(f.base, v, "/api/jobs/prepare", prep(f, v));
    assert.equal(r.status, 200, await r.clone().text());
    const jobs = await r.json();
    assert.equal(jobs.revision, 1);
    assert.equal(jobs.jobs[0].state, "prepared");
    assert.equal(jobs.jobs[0].shotKey, "plan:S1");
    assert.equal(jobs.jobs[0].referenceCount, 1);
    assert.equal(JSON.stringify(jobs).includes(f.root), false);
    assert.equal(JSON.stringify(jobs).includes('"history"'), false);
    assert.equal(jobs.executionAllowed, false);
    assert.equal((await readJobStore(f.bundle, f.jobStore)).revision, 1);
    assert.equal((await get(f.base, "/api/view")).review.revision, v.review.revision);
    assert.equal((await post(f.base, v, "/api/jobs/prepare", prep(f, v))).status, 409);
  }));
test("job controls reject stale/foreign review context and cross-origin mutation", () =>
  app(async (f) => {
    const v = await get(f.base, "/api/view");
    for (const body of [
      { ...prep(f, v), expectedReviewRevision: 0 },
      { ...prep(f, v), expectedReviewFingerprint: "f".repeat(64) },
      { ...prep(f, v), projectId: "other" },
      { ...prep(f, v), approved: true },
    ])
      assert.notEqual((await post(f.base, v, "/api/jobs/prepare", body)).status, 200);
    for (const h of [
      { Origin: "https://evil.invalid" },
      { "X-Film-CSRF": "" },
      { "Content-Type": "text/plain" },
    ])
      assert.equal((await post(f.base, v, "/api/jobs/prepare", prep(f, v), h)).status, 403);
    assert.equal((await readJobStore(f.bundle, f.jobStore)).revision, 0);
  }));
test("selected-job receipt binding and current output hashes protect durable observations", () =>
  app(async (f) => {
    const v = await get(f.base, "/api/view");
    await post(f.base, v, "/api/jobs/prepare", prep(f, v));
    const state = await readJobStore(f.bundle, f.jobStore),
      job = state.jobs[0],
      bytes = "owned output bytes",
      sha256 = createHash("sha256").update(bytes).digest("hex");
    await writeFile(join(f.resultsWorkspace, "clip.mp4"), bytes);
    const receipt = {
      version: 1,
      projectId: v.projectId,
      jobId: job.id,
      requestFingerprint: job.requestFingerprint,
      route: job.request.route,
      externalId: "external-1",
      status: "reported-succeeded",
      outputs: [{ path: "clip.mp4", kind: "video", sha256 }],
    };
    await writeFile(join(f.resultsWorkspace, "done.json"), JSON.stringify(receipt));
    const body = {
      projectId: v.projectId,
      sourceFingerprint: v.review.sourceFingerprint,
      expectedRevision: 1,
      jobId: "wrong-job",
      receiptPath: "done.json",
      reason: "Observe",
    };
    assert.notEqual((await post(f.base, v, "/api/jobs/observe", body)).status, 200);
    assert.equal((await readJobStore(f.bundle, f.jobStore)).revision, 1);
    body.jobId = job.id;
    await writeFile(join(f.resultsWorkspace, "clip.mp4"), "drift");
    assert.notEqual((await post(f.base, v, "/api/jobs/observe", body)).status, 200);
    assert.equal((await readJobStore(f.bundle, f.jobStore)).revision, 1);
    await writeFile(join(f.resultsWorkspace, "clip.mp4"), bytes);
    const r = await post(f.base, v, "/api/jobs/observe", body);
    assert.equal(r.status, 200, await r.clone().text());
    const jobs = await r.json();
    assert.equal(jobs.jobs[0].state, "reported-succeeded");
    assert.equal(jobs.jobs[0].outputCount, 1);
    assert.equal(JSON.stringify(jobs).includes("clip.mp4"), false);
    assert.equal(jobs.executionAllowed, false);
  }));
test("unconfigured jobs/results remain explicit read-only states", async () => {
  await app(
    async (f) => {
      const v = await get(f.base, "/api/view"),
        jobs = await get(f.base, "/api/jobs");
      assert.equal(jobs.enabled, false);
      assert.notEqual((await post(f.base, v, "/api/jobs/prepare", prep(f, v))).status, 200);
    },
    { jobs: false },
  );
  await app(
    async (f) => {
      const v = await get(f.base, "/api/view");
      assert.equal((await get(f.base, "/api/jobs")).canObserve, false);
      assert.notEqual(
        (
          await post(f.base, v, "/api/jobs/observe", {
            projectId: v.projectId,
            sourceFingerprint: v.review.sourceFingerprint,
            expectedRevision: 0,
            jobId: "job-1",
            receiptPath: "x.json",
            reason: "Observe",
          })
        ).status,
        200,
      );
    },
    { results: false },
  );
});
test("actual DOM job form prepares through HTTP and persists after inspector reload", () =>
  app(async (f) => {
    const { mountInspector } = await import("../../film-studio/inspector/app.mjs"),
      w = new Window({ url: f.base });
    w.document.write(await (await fetch(f.base)).text());
    const request = (path, opts) =>
      fetch(f.base + path, {
        ...opts,
        headers: { ...opts?.headers, ...(opts?.method === "POST" ? { Origin: f.base } : {}) },
      });
    await mountInspector(w.document, request);
    const $ = (id) => w.document.getElementById(id);
    assert.ok($("job-prompt"));
    $("job-create").open = true;
    for (const [id, value] of [
      ["job-id", "web-job"],
      ["job-model", "explicit-model-intent"],
      ["job-prompt", "A pause."],
      ["job-reason", "Intenção — reação"],
    ])
      $(id).value = value;
    const form = $("job-prompt").closest("form");
    form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    for (let i = 0; i < 100 && !w.document.querySelector('[data-job-id="web-job"]'); i++)
      await new Promise((r) => setTimeout(r, 10));
    assert.ok(w.document.querySelector('[data-job-id="web-job"]'));
    assert.equal((await readJobStore(f.bundle, f.jobStore)).jobs[0].request.prompt, "A pause.");
    assert.equal($("job-revision").textContent, "Saved jobs · revision 1");
    w.close();
  }));
