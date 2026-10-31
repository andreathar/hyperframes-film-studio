import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createInspectorServer } from "./inspector-server.mjs";
import { initializeJobStore, readJobStore } from "./job-store.mjs";
import { fixture, receipt } from "./fixtures/jobs.mjs";
import { launchStudioChrome } from "../../packages/studio/tests/e2e/chrome-executable.mjs";
const out = resolve(process.argv[2] ?? ".film-workspace/inspector-jobs-browser");
await mkdir(out, { recursive: true });
const root = await mkdtemp(join(tmpdir(), "film-job-browser-"));
const f = fixture(),
  jobStore = join(root, "jobs"),
  resultsWorkspace = join(root, "results");
await initializeJobStore(f.bundle, jobStore);
await mkdir(resultsWorkspace);
const server = createInspectorServer({
  bundle: f.bundle,
  state: f.review,
  jobStore,
  resultsWorkspace,
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
let browser;
try {
  ({ browser } = await launchStudioChrome());
  const page = await browser.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.waitForSelector("#job-id");
  await page.keyboard.press("Tab");
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Skip to shot/);
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "detail");
  await page.$eval("#job-create", (n) => (n.open = true));
  for (const [id, value] of [
    ["job-id", "browser-job"],
    ["job-model", "model intent"],
    ["job-prompt", "Uma pausa — século a século."],
    ["job-reason", "Compare reaction only"],
  ])
    await page.type("#" + id, value);
  await page.click("#job-create button[type=submit]");
  await page.waitForSelector('[data-job-id="browser-job"]');
  assert.equal(await page.$eval("#job-revision", (n) => n.textContent), "Saved jobs · revision 1");
  assert.equal(
    (await readJobStore(f.bundle, jobStore)).jobs[0].request.prompt,
    "Uma pausa — século a século.",
  );
  // A second tab advances the review; the pending form must fail without erasing its draft.
  await page.evaluate(async () => {
    const v = await fetch("/api/view").then((r) => r.json());
    const r = await fetch("/api/propose", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Film-CSRF": v.csrf },
      body: JSON.stringify({
        projectId: v.projectId,
        sourceFingerprint: v.review.sourceFingerprint,
        expectedRevision: v.review.revision,
        action: {
          type: "clear-reference",
          shotKey: "plan:S1",
          referenceId: "R1",
          reason: "Concurrent browser check",
        },
      }),
    });
    if (!r.ok) throw new Error(await r.text());
  });
  await page.$eval("#job-create", (n) => (n.open = true));
  for (const [id, value] of [
    ["job-id", "stale-draft"],
    ["job-model", "manual"],
    ["job-prompt", "Keep this draft."],
    ["job-reason", "Stale review check"],
  ])
    await page.type("#" + id, value);
  await page.click("#job-create button[type=submit]");
  await page.waitForFunction(() => !document.getElementById("error").hidden);
  assert.match(await page.$eval("#error", (n) => n.textContent), /review changed/i);
  assert.equal(await page.$eval("#job-prompt", (n) => n.value), "Keep this draft.");
  assert.equal((await readJobStore(f.bundle, jobStore)).revision, 1);
  await page
    .locator("button")
    .filter((n) => n.textContent === "Reload session")
    .click();
  await page.waitForFunction(
    () => document.getElementById("revision").textContent === "Review revision 2",
  );
  // Record a saved receipt through the actual form; output bytes stay local and candidate-only.
  const state = await readJobStore(f.bundle, jobStore),
    job = state.jobs[0],
    bytes = "synthetic clip bytes";
  const saved = {
    ...receipt(job, "reported-succeeded"),
    outputs: [
      { path: "clip.mp4", kind: "video", sha256: createHash("sha256").update(bytes).digest("hex") },
    ],
  };
  await writeFile(join(resultsWorkspace, "clip.mp4"), bytes);
  await writeFile(
    join(resultsWorkspace, "result.json"),
    JSON.stringify({ ...saved, jobId: "wrong-job" }),
  );
  await page.$eval("[data-job-id] details", (n) => (n.open = true));
  await page.type("#job-receipt-0", "result.json");
  await page.type("#job-receipt-reason-0", "Reconcile owned output");
  await page.click("[data-job-id] button[type=submit]");
  await page.waitForFunction(() => !document.getElementById("error").hidden);
  assert.match(await page.$eval("#error", (n) => n.textContent), /different selected job/);
  assert.equal(await page.$eval("#job-receipt-0", (n) => n.value), "result.json");
  await writeFile(join(resultsWorkspace, "result.json"), JSON.stringify(saved));
  await page.click("[data-job-id] button[type=submit]");
  await page.waitForFunction(
    () => document.getElementById("job-revision").textContent === "Saved jobs · revision 2",
  );
  assert.match(await page.$eval("[data-job-id]", (n) => n.textContent), /Reported succeeded/);
  assert.equal(await page.$("[data-job-id] form"), null);
  await page.click('[data-key="plan:S2"]');
  assert.equal(await page.$("[data-job-id]"), null);
  await page.click('[data-key="plan:S1"]');
  await page.reload();
  await page.waitForSelector('[data-job-id="browser-job"]');
  await page.$eval("#job-create", (n) => (n.open = true));
  await page.$eval("#job-revision", (n) => n.scrollIntoView());
  const overflow = () => document.documentElement.scrollWidth > innerWidth;
  assert.equal(await page.evaluate(overflow), false);
  await page.$eval("#detail", (n) => n.blur());
  await page.screenshot({ path: join(out, "desktop.png"), fullPage: true });
  await (
    await page.$("section:has(#job-revision)")
  ).screenshot({ path: join(out, "jobs-desktop.png") });
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.waitForSelector("#job-id");
  await page.$eval("#job-create", (n) => (n.open = true));
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  assert.equal(await page.evaluate(overflow), false);
  await page.screenshot({ path: join(out, "mobile.png"), fullPage: true });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await page.screenshot({ path: join(out, "mobile-dark.png"), fullPage: true });
  await (
    await page.$("section:has(#job-revision)")
  ).screenshot({ path: join(out, "jobs-mobile-dark.png") });
  assert.deepEqual(errors, []);
  const current = await readJobStore(f.bundle, jobStore);
  assert.equal(current.executionAllowed, false);
  assert.equal(current.jobs[0].outputs[0].status, "candidate");
  await writeFile(
    join(out, "result.json"),
    JSON.stringify(
      {
        passed: true,
        keyboard: true,
        prepare: true,
        staleReviewPreservesDraft: true,
        wrongJobPreservesDraft: true,
        receipt: true,
        reload: true,
        shotFilter: true,
        desktop: [1440, 1000],
        mobile: [390, 844],
        horizontalOverflow: false,
        pageErrors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Inspector jobs browser acceptance passed:", out);
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await rm(root, { recursive: true, force: true });
}
