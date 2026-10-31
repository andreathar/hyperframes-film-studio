import { mkdir, realpath, writeFile } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep, join, dirname, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { openPinnedDirectory } from "./pinned-directory.mjs";
import { restoreJobs } from "./jobs.mjs";
import { restoreReview, reviewFingerprint } from "./review.mjs";
import { verifyJobMedia } from "./job-store.mjs";
const blocked =
  "Producer release, current live schema, quote/upload scope and final request review are required; this candidate is not executable.";
const reserved = new Set([
  "model",
  "prompt",
  "poll",
  "rationale",
  "skillname",
  "skillversion",
  "tasktraceid",
  "quiet",
  "q",
  "help",
  "h",
  "version",
  "v",
  "image",
  "input",
  "video",
  "audio",
  "tailimage",
  "elements",
  "auth",
  "authorization",
  "token",
  "secret",
  "password",
]);
const norm = (s) => s.replace(/[_-]/g, "").toLowerCase();
function shape(v, keys) {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).some((k) => !keys.includes(k))
  )
    throw new Error("Unsupported handoff field");
}
function relativePath(v) {
  if (
    typeof v !== "string" ||
    v.length > 4096 ||
    /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}\\:]/u.test(v) ||
    v.split("/").some((s) => !s || s === "." || s === "..")
  )
    throw new Error("Expected literal relative film/media path");
}
function inside(root, path) {
  const r = relative(root, path);
  return r && !isAbsolute(r) && r.split(sep)[0] !== "..";
}
function context(review, shotKey) {
  return {
    references: review.references
      .filter((r) => r.shotKey === shotKey)
      .sort((a, b) => (a.referenceId < b.referenceId ? -1 : a.referenceId > b.referenceId ? 1 : 0)),
    link: review.shotLinks.find((l) => l.planShotKey === shotKey) ?? null,
  };
}
function producerDigest(payload) {
  // Use the producer's JSON rules exactly, including Unicode key ordering and float formatting.
  const script =
    'import hashlib,json,sys; value=json.load(sys.stdin); print(hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(",",":"),allow_nan=False).encode()).hexdigest())';
  try {
    const result = execFileSync("python3", ["-I", "-c", script], {
      input: JSON.stringify(payload),
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 4096,
    }).trim();
    if (!/^[a-f0-9]{64}$/.test(result)) throw new Error("Invalid digest");
    return result;
  } catch {
    throw new Error("Python 3 standard library is required for the canonical producer fingerprint");
  }
}
export async function createKlingHandoff({
  bundle,
  state,
  review,
  jobId,
  expectedRevision,
  requestFingerprint,
  settings,
  workspace,
  film,
}) {
  const ledger = restoreJobs(bundle, state),
    currentReview = restoreReview(bundle, review);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== ledger.revision)
    throw new Error("Stale handoff job revision");
  if (typeof jobId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/.test(jobId))
    throw new Error("Unsafe producer job identifier");
  const job = ledger.jobs.find((j) => j.id === jobId);
  if (
    !job ||
    job.state !== "prepared" ||
    job.request.route !== "kling-cli" ||
    job.request.output.kind !== "video" ||
    job.requestFingerprint !== requestFingerprint
  )
    throw new Error("Expected matching prepared Kling video job");
  if (
    reviewFingerprint(context(currentReview, job.request.shotKey)) !==
    reviewFingerprint(context(job.review, job.request.shotKey))
  )
    throw new Error("Prepared shot review references or mapping changed");
  shape(settings, ["tool", "args", "inputSlots", "shotContract"]);
  if (!["text_to_video", "image_to_video", "omni_ref_video"].includes(settings.tool))
    throw new Error("Unsupported Kling handoff tool");
  const args = settings.args;
  if (!args || typeof args !== "object" || Array.isArray(args) || Object.keys(args).length > 64)
    throw new Error("Explicit native argument object required");
  const normalized = {};
  for (const [key, value] of Object.entries(args)) {
    if (
      !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(key) ||
      typeof value !== "string" ||
      !value.trim() ||
      value.length > 20000
    )
      throw new Error("Native argument names/values must be explicit strings");
    const canonical = norm(key);
    if (reserved.has(canonical) || Object.hasOwn(normalized, canonical))
      throw new Error("Reserved or duplicate native argument alias");
    normalized[canonical] = value;
  }
  const intent = job.request.output,
    ratio = /^([1-9][0-9]{0,4}):([1-9][0-9]{0,4})$/.exec(normalized.aspectratio ?? "");
  if (
    !ratio ||
    Number(ratio[1]) * intent.height !== Number(ratio[2]) * intent.width ||
    normalized.resolution !== `${Math.min(intent.width, intent.height)}p` ||
    normalized.imagecount !== "1" ||
    !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(normalized.duration ?? "") ||
    Number(normalized.duration) * intent.fps !== intent.durationFrames
  )
    throw new Error(
      "Native duration, ratio, resolution or result count differs from prepared output",
    );
  const slots = settings.inputSlots;
  if (!slots || typeof slots !== "object" || Array.isArray(slots) || Object.keys(slots).length > 16)
    throw new Error("Explicit input slot mapping required");
  const slotEntries = Object.entries(slots);
  if (
    slotEntries.some(
      ([slot, id]) => !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(slot) || typeof id !== "string",
    )
  )
    throw new Error("Invalid provider input slot");
  if (
    (settings.tool === "text_to_video" && slotEntries.length) ||
    (settings.tool === "image_to_video" && !slotEntries.length)
  )
    throw new Error("Input mapping does not match handoff tool");
  if (
    new Set(slotEntries.map(([, id]) => id)).size !== job.references.length ||
    job.references.some((r) => !slotEntries.some(([, id]) => id === r.referenceId))
  )
    throw new Error("Every prepared reference must be mapped explicitly");
  relativePath(film);
  const root = await realpath(workspace),
    filmRoot = await realpath(resolve(root, film));
  if (!inside(root, filmRoot))
    throw new Error("Film directory must remain inside the canonical workspace");
  const inputs = {},
    nativeInputs = {},
    bindings = [];
  for (const [slot, id] of slotEntries) {
    const assigned = job.references.find((r) => r.referenceId === id),
      source = bundle.references.find((r) => r.id === id);
    if (
      !assigned ||
      !source ||
      source.record.archived === true ||
      source.media?.state !== "verified"
    )
      throw new Error("Unavailable prepared reference");
    relativePath(source.media.path);
    if (!source.media.path.startsWith(film + "/"))
      throw new Error("Shared/outside-film references need a separate producer route");
    const path = source.media.path.slice(film.length + 1),
      proof = await verifyJobMedia(filmRoot, path, assigned.sha256);
    inputs[slot] = path;
    nativeInputs[slot] = { sha256: proof.sha256 };
    bindings.push({
      slot,
      referenceId: id,
      role: assigned.role,
      workspacePath: source.media.path,
      filmPath: path,
      sha256: proof.sha256,
    });
  }
  if (settings.shotContract !== undefined) {
    if (
      !settings.shotContract ||
      typeof settings.shotContract !== "object" ||
      Array.isArray(settings.shotContract) ||
      settings.shotContract.version !== 1
    )
      throw new Error("Expected explicit shotContract version 1");
    reviewFingerprint(settings.shotContract);
  }
  const spec = {
    job: job.id,
    tool: settings.tool,
    model: job.request.model,
    prompt: job.request.prompt,
    args: structuredClone(args),
    images: [],
    inputs,
    auth: null,
    note: "Candidate exported from local film review; no producer release granted.",
    referenceDurationSeconds: null,
    submissionBlocked: blocked,
    inputFacts: {},
    ...(settings.shotContract !== undefined
      ? { shotContract: structuredClone(settings.shotContract) }
      : {}),
  };
  const native = {
    tool: spec.tool,
    model: spec.model,
    prompt: spec.prompt,
    args: normalized,
    images: [],
    inputs: nativeInputs,
    referenceDurationSeconds: null,
    inputFacts: {},
    ...(spec.shotContract ? { shotContract: spec.shotContract } : {}),
  };
  return {
    spec: [spec],
    receipt: {
      version: 1,
      kind: "film-kling-handoff",
      projectId: ledger.projectId,
      sourceFingerprint: ledger.sourceFingerprint,
      jobId: job.id,
      jobRevision: ledger.revision,
      jobRequestFingerprint: job.requestFingerprint,
      settingsFingerprint: reviewFingerprint(settings),
      producerPayloadSha256: producerDigest(native),
      reviewRevision: currentReview.revision,
      reviewFingerprint: reviewFingerprint(currentReview),
      film,
      shot: structuredClone(job.shot),
      outputIntent: structuredClone(intent),
      bindings,
      executionAllowed: false,
      providerCapabilitiesVerified: false,
      nativeFpsVerified: false,
      blockingReason: blocked,
    },
  };
}
export async function writeKlingHandoff(packet, output, workspace) {
  const root = await realpath(workspace),
    target = resolve(output),
    parent = await realpath(dirname(target)),
    actual = join(parent, basename(target));
  if (actual === root || inside(root, actual) || inside(actual, root))
    throw new Error("Handoff output must be separate from the canonical workspace");
  if (
    packet.receipt?.executionAllowed !== false ||
    packet.spec?.length !== 1 ||
    packet.spec[0].auth !== null ||
    !packet.spec[0].submissionBlocked
  )
    throw new Error("Only blocked candidate packets can be exported");
  if (process.platform !== "linux")
    throw new Error("Verified export requires Linux descriptor paths");
  const parentPin = await openPinnedDirectory(parent);
  try {
    const pinnedParent = parentPin.pinned;
    const openedParent = await realpath(pinnedParent);
    const destination = join(openedParent, basename(target));
    if (destination === root || inside(root, destination) || inside(destination, root))
      throw new Error("Opened output parent overlaps canonical workspace");
    const pinnedTarget = join(pinnedParent, basename(target));
    await mkdir(pinnedTarget, { mode: 0o700 });
    const directoryPin = await openPinnedDirectory(pinnedTarget);
    try {
      const pinned = directoryPin.pinned;
      const opened = await realpath(pinned);
      if (opened === root || inside(root, opened) || inside(opened, root))
        throw new Error("Opened output overlaps canonical workspace");
      // Callers must keep trusted directory ancestors stable. FDs pin inodes, not names.
      const assertLocation = async () => {
        const current = await realpath(pinned);
        if (
          current !== actual ||
          current === root ||
          inside(root, current) ||
          inside(current, root)
        )
          throw new Error("Output directory relocated or overlaps canonical workspace");
      };
      await assertLocation();
      // Partial evidence is retained on I/O failure; existing destinations are never reused.
      await writeFile(
        join(pinned, "runner-spec.json"),
        JSON.stringify(packet.spec, null, 2) + "\n",
        { flag: "wx", mode: 0o600 },
      );
      await assertLocation();
      await writeFile(
        join(pinned, "handoff.json"),
        JSON.stringify(packet.receipt, null, 2) + "\n",
        { flag: "wx", mode: 0o600 },
      );
      await assertLocation();
    } finally {
      await directoryPin.handle.close();
    }
  } finally {
    await parentPin.handle.close();
  }
  return actual;
}
