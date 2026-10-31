import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInspectorServer } from "./inspector-server.mjs";
import { launchStudioChrome } from "../../packages/studio/tests/e2e/chrome-executable.mjs";
const out = resolve(process.argv[2] ?? ".film-workspace/inspector-browser");
await mkdir(out, { recursive: true });
const bundle = {
  version: 1,
  kind: "movies-import-candidate",
  projectId: "inspector-synthetic",
  executionAllowed: false,
  documents: {},
  shots: [
    {
      key: "plan:S1",
      source: "plan",
      record: {
        id: "S1",
        title: "A deliberate pause",
        camera: "Locked camera, eye level",
        action: "Listen before answering",
        lineIds: ["L1"],
      },
    },
    {
      key: "manifest:OLD1",
      source: "manifest",
      record: { id: "OLD1", description: "Legacy speech candidate" },
    },
  ],
  references: [
    {
      id: "R1",
      record: { label: "Synthetic identity reference", role: "identity", sha256: "a".repeat(64) },
      media: { state: "verified", observedSha256: "a".repeat(64) },
    },
  ],
  takes: [
    {
      id: "T1",
      record: { shotId: "OLD1", status: "accepted" },
      approval: "not-imported",
      media: { state: "observed-unverified", observedSha256: "b".repeat(64) },
    },
  ],
  diagnostics: [
    {
      code: "UNMAPPED_SHOT",
      subject: "plan:S1",
      message: "Choose equivalent legacy coverage explicitly",
      severity: "warning",
    },
  ],
};
const server = createInspectorServer({ bundle });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
let browser;
try {
  ({ browser } = await launchStudioChrome());
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.waitForSelector("#mapping-reason");
  await page.screenshot({ path: out + "/desktop.png", fullPage: true });
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement.textContent);
  assert.match(focused, /Skip to shot/);
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "detail");
  await page.select("#mapping-legacy-shot", "manifest:OLD1");
  await page.type("#mapping-reason", "Compare intended coverage");
  await page.click("form:has(#mapping-reason) button[type=submit]");
  await page.waitForFunction(
    () => document.getElementById("revision").textContent === "Review revision 1",
  );
  await page.select("#take-take", "T1");
  await page.type("#take-reason", "Candidate comparison only");
  await page.click("form:has(#take-reason) button[type=submit]");
  await page.waitForFunction(
    () => document.getElementById("revision").textContent === "Review revision 2",
  );
  let saved = await page.evaluate(() => fetch("/api/review").then((r) => r.json()));
  assert.equal(saved.takes[0].status, "candidate");
  assert.equal(saved.executionAllowed, false);
  await page.reload();
  await page.waitForFunction(
    () => document.getElementById("revision").textContent === "Review revision 2",
  );
  await page.type("#clear-take-reason", "Try another take");
  await page.click("form:has(#clear-take-reason) button[type=submit]");
  await page.waitForFunction(
    () => document.getElementById("revision").textContent === "Review revision 3",
  );
  // Another tab advances revision. The first tab must show a recoverable stale-session error.
  await page.evaluate(async () => {
    const v = await fetch("/api/view").then((r) => r.json());
    await fetch("/api/propose", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Film-CSRF": v.csrf },
      body: JSON.stringify({
        projectId: v.projectId,
        sourceFingerprint: v.review.sourceFingerprint,
        expectedRevision: v.review.revision,
        action: { type: "clear-take", shotKey: "plan:S1", reason: "Concurrent test" },
      }),
    });
  });
  await page.select("#mapping-legacy-shot", "manifest:OLD1");
  await page.type("#mapping-reason", "Stale tab test");
  await page.click("form:has(#mapping-reason) button[type=submit]");
  await page.waitForFunction(() => !document.getElementById("error").hidden);
  assert.match(await page.$eval("#error", (e) => e.textContent), /stale|revision/i);
  await page
    .locator("button")
    .filter((b) => b.textContent === "Reload session")
    .click();
  await page.waitForFunction(
    () => document.getElementById("revision").textContent === "Review revision 4",
  );
  const overflow = () => document.documentElement.scrollWidth <= innerWidth;
  assert.equal(await page.evaluate(overflow), true);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.reload();
  await page.waitForSelector("#mapping-reason");
  assert.equal(await page.evaluate(overflow), true);
  await page.screenshot({ path: out + "/mobile.png", fullPage: true });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.screenshot({ path: out + "/mobile-dark.png", fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/result.json",
    JSON.stringify(
      {
        passed: true,
        desktop: [1440, 1000],
        mobile: [390, 844],
        keyboard: true,
        mapping: true,
        candidateSelection: true,
        reload: true,
        removal: true,
        staleRecovery: true,
        horizontalOverflow: false,
        pageErrors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Inspector browser acceptance passed:", out);
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
