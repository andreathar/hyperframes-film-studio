import { open, realpath, mkdir, mkdtemp, writeFile, rename, rm, lstat } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, relative, isAbsolute, sep, join, dirname, basename, extname } from "node:path";
import { restoreReview, reviewFingerprint } from "./review.mjs";
import { validateManifest } from "./manifest.mjs";
import { prepareProject } from "./prepare.mjs";
import { copyJobMedia } from "./job-store.mjs";
function shape(value, fields) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !fields.includes(k))
  )
    throw new Error("Unsupported placement field");
}
const inside = (root, path) => {
  const rel = relative(root, path);
  return rel && !isAbsolute(rel) && rel.split(sep)[0] !== "..";
};
export function compilePlacement(bundle, suppliedReview, plan) {
  const review = restoreReview(bundle, suppliedReview);
  shape(plan, [
    "version",
    "project",
    "sourceFingerprint",
    "reviewFingerprint",
    "expectedReviewRevision",
    "reason",
    "edit",
  ]);
  if (
    plan.version !== 1 ||
    plan.project?.id !== bundle.projectId ||
    plan.sourceFingerprint !== review.sourceFingerprint ||
    plan.expectedReviewRevision !== review.revision ||
    plan.reviewFingerprint !== reviewFingerprint(review)
  )
    throw new Error("Placement project, source or saved review changed");
  if (typeof plan.reason !== "string" || !plan.reason.trim() || plan.reason.length > 20000)
    throw new Error("Explicit placement reason required");
  shape(plan.edit, ["durationFrames", "clips"]);
  if (!Array.isArray(plan.edit.clips) || !plan.edit.clips.length || plan.edit.clips.length > 10000)
    throw new Error("Expected bounded explicit placement clips");
  const shots = [],
    takes = [],
    assets = [],
    clips = [],
    clipSources = [],
    diagnostics = [];
  for (const clip of plan.edit.clips) {
    shape(clip, [
      "id",
      "shotKey",
      "takeId",
      "kind",
      "track",
      "startFrame",
      "durationFrames",
      "sourceInFrame",
      "rate",
      "volume",
    ]);
    const selected = review.takes.find((t) => t.shotKey === clip.shotKey),
      source = bundle.shots.find((s) => s.key === clip.shotKey),
      take = bundle.takes.find((t) => t.id === clip.takeId);
    if (
      !selected ||
      !source ||
      !take ||
      selected.takeId !== clip.takeId ||
      selected.sha256 !== take.media?.observedSha256 ||
      take.record.archived === true ||
      !["verified", "observed-unverified"].includes(take.media?.state)
    )
      throw new Error("Clip must name the current selected available candidate take and shot");
    let shot = shots.find((s) => s.key === clip.shotKey);
    if (!shot) {
      shot = {
        id: `shot-${shots.length + 1}`,
        key: source.key,
        record: structuredClone(source.record),
      };
      shots.push(shot);
      for (const field of [
        "intention",
        "action",
        "framingRestriction",
        "segments",
        "camera",
        "acting",
        "dialogue",
        "lighting",
        "continuity",
      ]) {
        if (
          source.record[field] !== undefined &&
          (!["camera", "acting", "dialogue", "lighting", "continuity"].includes(field) ||
            typeof source.record[field] !== "string" ||
            !source.record[field].trim())
        )
          diagnostics.push({
            code: "SOURCE_DIRECTION_RETAINED",
            shotKey: source.key,
            field,
            message:
              "Retained in placement provenance; not projected into the preparation direction fields.",
          });
      }
    }
    let mapped = takes.find((t) => t.takeId === clip.takeId);
    if (!mapped) {
      mapped = {
        id: `take-${takes.length + 1}`,
        assetId: `asset-${takes.length + 1}`,
        takeId: take.id,
        sourceShotId: take.record.shotId,
        path: take.media.path,
        sha256: selected.sha256,
      };
      takes.push(mapped);
      assets.push({
        id: mapped.assetId,
        path: mapped.path,
        kind: clip.kind,
        sha256: mapped.sha256,
      });
    } else if (clip.kind === "video") assets.find((a) => a.id === mapped.assetId).kind = "video";
    const { shotKey, takeId, ...timing } = clip;
    clips.push({ ...timing, shotId: shot.id, takeId: mapped.id, assetId: mapped.assetId });
    clipSources.push({ id: clip.id, shotKey, takeId, sha256: selected.sha256 });
  }
  const manifest = {
    version: 1,
    project: structuredClone(plan.project),
    assets,
    shots: shots.map((s) => ({
      id: s.id,
      title:
        typeof s.record.title === "string" && s.record.title.trim() ? s.record.title : s.record.id,
      ...(s.record.lineIds !== undefined ? { lineIds: structuredClone(s.record.lineIds) } : {}),
      direction: Object.fromEntries(
        ["camera", "acting", "dialogue", "lighting", "continuity"]
          .filter((k) => typeof s.record[k] === "string" && s.record[k].trim())
          .map((k) => [k, s.record[k]]),
      ),
    })),
    edit: { durationFrames: plan.edit.durationFrames, clips },
    notes: plan.reason,
  };
  validateManifest(manifest);
  return {
    manifest,
    provenance: {
      version: 1,
      kind: "film-placement-candidate",
      projectId: bundle.projectId,
      sourceFingerprint: review.sourceFingerprint,
      reviewFingerprint: reviewFingerprint(review),
      reviewRevision: review.revision,
      planFingerprint: reviewFingerprint(plan),
      reason: plan.reason,
      shots,
      takes,
      clips: clipSources,
      diagnostics,
      creativeApproval: "not-inferred",
      executionAllowed: false,
    },
  };
}
export async function preparePlacement({ bundle, review, plan, workspace, output }) {
  const packet = compilePlacement(bundle, review, plan);
  if (process.platform !== "linux")
    throw new Error("Verified placement requires Linux descriptor paths");
  const root = await realpath(workspace),
    target = resolve(output),
    parent = await realpath(dirname(target)),
    actual = join(parent, basename(target));
  if (actual === root || inside(root, actual) || inside(actual, root))
    throw new Error("Placement output must be separate from canonical workspace");
  const flags =
      constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NONBLOCK | constants.O_NOFOLLOW,
    parentHandle = await open(parent, flags);
  try {
    const pinnedParent = `/proc/self/fd/${parentHandle.fd}`,
      pinnedOutput = join(pinnedParent, basename(target));
    const assertParent = async () => {
      if ((await realpath(pinnedParent)) !== parent)
        throw new Error("Placement parent relocated; inspect partial evidence");
    };
    await assertParent();
    try {
      await lstat(pinnedOutput);
      throw new Error("Output already exists; existing timeline edits are preserved");
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    const scratch = await realpath(await mkdtemp(join(pinnedParent, ".film-placement-"))),
      inputs = join(scratch, "inputs"),
      prepared = join(scratch, "composition");
    await mkdir(inputs, { mode: 0o700 });
    const manifest = structuredClone(packet.manifest);
    for (const asset of manifest.assets) {
      const source = packet.provenance.takes.find((t) => t.assetId === asset.id),
        path = asset.id + extname(source.path).toLowerCase();
      await assertParent();
      await copyJobMedia(root, source.path, source.sha256, join(inputs, path));
      asset.path = path;
    }
    const manifestPath = join(inputs, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
    await assertParent();
    const preparation = await prepareProject(manifestPath, prepared);
    await assertParent();
    await writeFile(
      join(prepared, "placement.json"),
      JSON.stringify(packet.provenance, null, 2) + "\n",
      { flag: "wx", mode: 0o600 },
    );
    await assertParent();
    await mkdir(pinnedOutput, { mode: 0o700 });
    await rename(prepared, pinnedOutput);
    await assertParent();
    // Only this operation's private temporary input copies remain after publication.
    await rm(scratch, { recursive: true });
    return {
      version: 1,
      status: "candidate-prepared",
      output: actual,
      provenance: packet.provenance,
      preparation,
    };
  } finally {
    await parentHandle.close();
  }
}
