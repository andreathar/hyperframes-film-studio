import { createReview, restoreReview, reviewFingerprint } from "./review.mjs";
const routes = ["kling-cli", "higgsfield-manual", "comfyui-manual", "local-manual"];
const states = ["unknown", "reported-running", "reported-failed", "reported-succeeded"];
const hash = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const text = (v) => typeof v === "string" && v.trim().length > 0 && v.length <= 20000;
function shape(v, keys) {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).some((k) => !keys.includes(k))
  )
    throw new Error("Unsupported job field");
}
function path(v) {
  if (
    !text(v) ||
    v.includes("\\") ||
    v.includes(":") ||
    v.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw new Error("Expected confined relative path");
}
function output(v) {
  shape(v, ["kind", "width", "height", "fps", "durationFrames"]);
  if (
    !["image", "video"].includes(v.kind) ||
    !Number.isInteger(v.width) ||
    v.width < 1 ||
    v.width > 16384 ||
    !Number.isInteger(v.height) ||
    v.height < 1 ||
    v.height > 16384
  )
    throw new Error("Invalid output specification");
  if (v.kind === "video") {
    if (
      !Number.isInteger(v.fps) ||
      v.fps < 1 ||
      v.fps > 120 ||
      !Number.isInteger(v.durationFrames) ||
      v.durationFrames < 1 ||
      v.durationFrames > v.fps * 3600
    )
      throw new Error("Invalid output timing");
  } else if (v.fps !== undefined || v.durationFrames !== undefined)
    throw new Error("Image output cannot carry video timing");
}
export function createJobs(bundle) {
  const review = createReview(bundle);
  return {
    version: 1,
    kind: "film-jobs",
    projectId: review.projectId,
    sourceFingerprint: review.sourceFingerprint,
    revision: 0,
    executionAllowed: false,
    jobs: [],
    history: [],
  };
}
function reduce(bundle, state, command) {
  shape(command, ["projectId", "sourceFingerprint", "expectedRevision", "action"]);
  if (
    command.projectId !== state.projectId ||
    command.sourceFingerprint !== state.sourceFingerprint ||
    command.expectedRevision !== state.revision
  )
    throw new Error("Foreign project, changed source or stale job revision");
  const a = command.action;
  if (!a || !text(a.reason)) throw new Error("An explicit job reason is required");
  const next = structuredClone(state);
  if (a.type === "prepare") {
    shape(a, ["type", "request", "review", "reason"]);
    const request = a.request;
    shape(request, ["id", "shotKey", "route", "model", "prompt", "output"]);
    if (
      !text(request.id) ||
      request.id.length > 200 ||
      !routes.includes(request.route) ||
      !text(request.model) ||
      !text(request.prompt)
    )
      throw new Error("Invalid request intent or unsupported route");
    output(request.output);
    const review = restoreReview(bundle, a.review),
      shot = bundle.shots.find((s) => s.key === request.shotKey);
    if (!shot) throw new Error("Unknown job shot");
    const references = review.references
      .filter((r) => r.shotKey === request.shotKey)
      .map((r) => {
        const source = bundle.references.find((ref) => ref.id === r.referenceId);
        if (
          !source ||
          source.record.archived === true ||
          source.media?.state !== "verified" ||
          source.record.role !== r.role ||
          source.record.sha256 !== r.sha256 ||
          source.media.observedSha256 !== r.sha256
        )
          throw new Error("Reference unavailable or changed");
        return { referenceId: r.referenceId, role: r.role, sha256: r.sha256 };
      })
      .sort((a, b) => (a.referenceId < b.referenceId ? -1 : a.referenceId > b.referenceId ? 1 : 0));
    const effectiveReferences = [
      ...new Set(references.map((r) => JSON.stringify([r.role, r.sha256]))),
    ].sort();
    const requestFingerprint = reviewFingerprint({
      route: request.route,
      model: request.model,
      prompt: request.prompt,
      output: request.output,
      references: effectiveReferences,
    });
    if (next.jobs.some((j) => j.id === request.id || j.requestFingerprint === requestFingerprint))
      throw new Error("Duplicate job identity or request intent; retries are not supported");
    next.jobs.push({
      id: request.id,
      request: structuredClone(request),
      requestFingerprint,
      review: structuredClone(review),
      shot: structuredClone(shot),
      references,
      state: "prepared",
      externalId: null,
      outputs: [],
      observations: [],
    });
  } else if (a.type === "observe") {
    shape(a, ["type", "receipt", "evidence", "reason"]);
    const r = a.receipt;
    shape(r, [
      "version",
      "projectId",
      "jobId",
      "requestFingerprint",
      "route",
      "externalId",
      "status",
      "outputs",
    ]);
    const job = next.jobs.find((j) => j.id === r.jobId);
    if (
      r.version !== 1 ||
      r.projectId !== state.projectId ||
      !job ||
      r.requestFingerprint !== job.requestFingerprint ||
      r.route !== job.request.route ||
      !states.includes(r.status)
    )
      throw new Error("Receipt project, job, request, route or status mismatch");
    if (["reported-succeeded", "reported-failed"].includes(job.state))
      throw new Error("Terminal job cannot transition");
    if (r.externalId !== null && (!text(r.externalId) || r.externalId.length > 500))
      throw new Error("Invalid external identity");
    if (r.status !== "unknown" && !text(r.externalId))
      throw new Error("External identity required");
    if (job.externalId && r.externalId !== job.externalId)
      throw new Error("External identity cannot change or disappear");
    if (
      r.externalId &&
      next.jobs.some(
        (j) => j.id !== job.id && j.request.route === r.route && j.externalId === r.externalId,
      )
    )
      throw new Error("External identity already belongs to another job");
    shape(a.evidence, ["path", "sha256"]);
    path(a.evidence.path);
    if (!hash(a.evidence.sha256)) throw new Error("Receipt evidence hash required");
    if (
      !Array.isArray(r.outputs) ||
      r.outputs.length > 16 ||
      (r.status === "reported-succeeded" ? r.outputs.length === 0 : r.outputs.length !== 0)
    )
      throw new Error("Receipt outputs do not match reported status");
    const paths = new Set();
    for (const o of r.outputs) {
      shape(o, ["path", "kind", "sha256"]);
      path(o.path);
      if (paths.has(o.path) || o.kind !== job.request.output.kind || !hash(o.sha256))
        throw new Error("Invalid or duplicate candidate output");
      paths.add(o.path);
    }
    job.state = r.status;
    job.externalId = r.externalId;
    job.outputs = r.outputs.map((o) => ({ ...o, status: "candidate" }));
    job.observations.push({
      receipt: structuredClone(r),
      evidence: structuredClone(a.evidence),
      reason: a.reason,
    });
  } else throw new Error("Unsupported job operation");
  next.revision++;
  next.history.push(structuredClone(command));
  return next;
}
/** Replay detects inconsistent edits, not the identity or truth of an external observer. */
export function restoreJobs(bundle, state) {
  let verified = createJobs(bundle);
  if (!state || !Array.isArray(state.history) || state.history.length > 10000)
    throw new Error("Invalid job history");
  for (const event of state.history) verified = reduce(bundle, verified, event);
  if (reviewFingerprint(verified) !== reviewFingerprint(state))
    throw new Error("Job state, history or source changed");
  return verified;
}
export function applyJob(bundle, state, command) {
  if (state.history?.length >= 10000) throw new Error("Job history capacity reached");
  return reduce(bundle, restoreJobs(bundle, state), command);
}
