import { createReview, applyReview } from "../review.mjs";
export function fixture() {
  const bundle = {
    version: 1,
    kind: "movies-import-candidate",
    projectId: "synthetic-film",
    executionAllowed: false,
    documents: {},
    shots: [
      { key: "plan:S1", source: "plan", record: { id: "S1", camera: "Locked", lineIds: ["L1"] } },
      { key: "plan:S2", source: "plan", record: { id: "S2" } },
    ],
    references: [
      {
        id: "R1",
        record: { role: "identity", sha256: "a".repeat(64) },
        media: { state: "verified", observedSha256: "a".repeat(64) },
      },
    ],
    takes: [],
    diagnostics: [],
  };
  let review = createReview(bundle);
  review = applyReview(bundle, review, {
    projectId: review.projectId,
    sourceFingerprint: review.sourceFingerprint,
    expectedRevision: 0,
    action: {
      type: "assign-reference",
      shotKey: "plan:S1",
      referenceId: "R1",
      role: "identity",
      expectedMediaSha256: "a".repeat(64),
      reason: "Synthetic identity comparison",
    },
  });
  const request = {
    id: "job-1",
    shotKey: "plan:S1",
    route: "kling-cli",
    model: "explicit-model-intent",
    prompt: "A quiet reaction, eye level.",
    output: { kind: "video", width: 1920, height: 1080, fps: 24, durationFrames: 96 },
  };
  return { bundle, review, request };
}
export function command(state, action) {
  return {
    projectId: state.projectId,
    sourceFingerprint: state.sourceFingerprint,
    expectedRevision: state.revision,
    action,
  };
}
export function receipt(job, status = "reported-running") {
  return {
    version: 1,
    projectId: "synthetic-film",
    jobId: job.id,
    requestFingerprint: job.requestFingerprint,
    route: job.request.route,
    externalId: "external-1",
    status,
    outputs: [],
  };
}
export const evidence = { path: "receipts/result.json", sha256: "e".repeat(64) };
