import { createHash } from "node:crypto";
function canonical(v) {
  if (v === null || typeof v === "string" || typeof v === "boolean") return JSON.stringify(v);
  if (typeof v === "number" && Number.isFinite(v)) return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  throw new Error("Expected JSON data");
}
export function reviewFingerprint(bundle) {
  return createHash("sha256").update(canonical(bundle)).digest("hex");
}
function checkObject(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    throw new Error("Unsupported review field");
}
function nonempty(v) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= 20000;
}
function unique(rows, key) {
  if (
    !Array.isArray(rows) ||
    rows.some((r) => !r || !nonempty(r[key])) ||
    new Set(rows.map((r) => r[key])).size !== rows.length
  )
    throw new Error("Missing or duplicate source identity");
}
function initial(bundle) {
  if (
    bundle.version !== 1 ||
    bundle.kind !== "movies-import-candidate" ||
    !nonempty(bundle.projectId) ||
    bundle.executionAllowed !== false
  )
    throw new Error("Invalid import candidate");
  unique(bundle.shots, "key");
  unique(bundle.references, "id");
  unique(bundle.takes, "id");
  for (const s of bundle.shots)
    if (!["plan", "manifest"].includes(s.source) || s.key !== `${s.source}:${s.record?.id}`)
      throw new Error("Invalid source shot identity");
  return {
    version: 1,
    kind: "film-review",
    projectId: bundle.projectId,
    sourceFingerprint: reviewFingerprint(bundle),
    revision: 0,
    executionAllowed: false,
    shotLinks: [],
    references: [],
    takes: [],
    history: [],
  };
}
export function createReview(bundle) {
  return initial(bundle);
}
const sha = (v) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
function reduce(bundle, state, command) {
  checkObject(command, ["projectId", "sourceFingerprint", "expectedRevision", "action"]);
  if (
    command.projectId !== state.projectId ||
    command.sourceFingerprint !== state.sourceFingerprint ||
    command.expectedRevision !== state.revision
  )
    throw new Error("Foreign project, changed source or stale review revision");
  const a = command.action;
  if (!a || !nonempty(a.reason)) throw new Error("An explicit review reason is required");
  const next = structuredClone(state);
  const shot = (key) => {
    const s = bundle.shots.find((s) => s.key === key);
    if (!s) throw new Error("Unknown source shot");
    return s;
  };
  if (a.type === "unlink-shot") {
    checkObject(a, ["type", "planShotKey", "reason"]);
    if (shot(a.planShotKey).source !== "plan") throw new Error("Expected plan shot");
    next.shotLinks = next.shotLinks.filter((l) => l.planShotKey !== a.planShotKey);
    next.takes = next.takes.filter((t) => t.shotKey !== a.planShotKey);
  } else if (a.type === "clear-reference") {
    checkObject(a, ["type", "shotKey", "referenceId", "reason"]);
    shot(a.shotKey);
    if (!bundle.references.some((r) => r.id === a.referenceId))
      throw new Error("Unknown reference");
    next.references = next.references.filter(
      (r) => !(r.shotKey === a.shotKey && r.referenceId === a.referenceId),
    );
  } else if (a.type === "clear-take") {
    checkObject(a, ["type", "shotKey", "reason"]);
    shot(a.shotKey);
    next.takes = next.takes.filter((t) => t.shotKey !== a.shotKey);
  } else if (a.type === "link-shot") {
    checkObject(a, ["type", "planShotKey", "legacyShotKey", "reason"]);
    if (shot(a.planShotKey).source !== "plan" || shot(a.legacyShotKey).source !== "manifest")
      throw new Error("Crosswalk requires plan and legacy source shots");
    if (
      next.shotLinks.some(
        (l) => l.legacyShotKey === a.legacyShotKey && l.planShotKey !== a.planShotKey,
      )
    )
      throw new Error("Ambiguous crosswalk");
    const previous = next.shotLinks.find((l) => l.planShotKey === a.planShotKey);
    if (previous && previous.legacyShotKey !== a.legacyShotKey)
      next.takes = next.takes.filter((t) => t.shotKey !== a.planShotKey);
    next.shotLinks = next.shotLinks.filter((l) => l.planShotKey !== a.planShotKey);
    next.shotLinks.push({ planShotKey: a.planShotKey, legacyShotKey: a.legacyShotKey });
  } else if (a.type === "assign-reference") {
    checkObject(a, ["type", "shotKey", "referenceId", "role", "expectedMediaSha256", "reason"]);
    shot(a.shotKey);
    const ref = bundle.references.find((r) => r.id === a.referenceId);
    if (
      !nonempty(a.role) ||
      !ref ||
      ref.media?.state !== "verified" ||
      ref.record?.role !== a.role ||
      !sha(a.expectedMediaSha256) ||
      ref.record.sha256 !== a.expectedMediaSha256 ||
      ref.media.observedSha256 !== a.expectedMediaSha256
    )
      throw new Error("Reference role or verified media hash mismatch");
    next.references = next.references.filter(
      (r) => !(r.shotKey === a.shotKey && r.referenceId === a.referenceId),
    );
    next.references.push({
      shotKey: a.shotKey,
      referenceId: a.referenceId,
      role: a.role,
      sha256: a.expectedMediaSha256,
    });
  } else if (a.type === "select-take") {
    checkObject(a, ["type", "shotKey", "takeId", "expectedMediaSha256", "reason"]);
    const target = shot(a.shotKey);
    const legacy =
      target.source === "manifest"
        ? target
        : shot(next.shotLinks.find((l) => l.planShotKey === a.shotKey)?.legacyShotKey);
    const take = bundle.takes.find((t) => t.id === a.takeId);
    if (
      !take ||
      take.record?.archived === true ||
      !["verified", "observed-unverified"].includes(take.media?.state) ||
      take.record.shotId !== legacy.record.id ||
      !sha(a.expectedMediaSha256) ||
      take.media.observedSha256 !== a.expectedMediaSha256
    )
      throw new Error("Take source shot or available media hash mismatch");
    next.takes = next.takes.filter((t) => t.shotKey !== a.shotKey);
    next.takes.push({
      shotKey: a.shotKey,
      takeId: a.takeId,
      sha256: a.expectedMediaSha256,
      status: "candidate",
    });
  } else throw new Error("Unsupported review operation");
  next.revision++;
  next.history.push(structuredClone(command));
  return next;
}
/** Replays local review history to reject edited state fields. This is not reviewer authentication. */
export function restoreReview(bundle, state) {
  let verified = initial(bundle);
  if (!Array.isArray(state.history) || state.history.length > 10000)
    throw new Error("Invalid review history");
  for (const event of state.history) verified = reduce(bundle, verified, event);
  if (canonical(verified) !== canonical(state))
    throw new Error("Review state or source fingerprint changed");
  return verified;
}

export function applyReview(bundle, state, command) {
  if (Array.isArray(state.history) && state.history.length >= 10000)
    throw new Error("Review history capacity reached; no new transition");
  return reduce(bundle, restoreReview(bundle, state), command);
}
