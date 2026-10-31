import { open, mkdir, realpath, rename, unlink } from "node:fs/promises";
import { constants } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { join, resolve, relative, isAbsolute, sep } from "node:path";
import { createJobs, restoreJobs, applyJob } from "./jobs.mjs";
const stateLimit = 32 * 1024 * 1024;
export async function readJobJson(path, limit = stateLimit) {
  const proof = await fileDigest(path, limit, true);
  return JSON.parse(proof.bytes.toString("utf8"));
}
async function confined(root, path) {
  if (
    typeof path !== "string" ||
    path.includes("\\") ||
    path.includes(":") ||
    path.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw new Error("Expected confined relative path");
  const actual = await realpath(resolve(root, path)),
    rel = relative(root, actual);
  if (!rel || isAbsolute(rel) || rel.split(sep)[0] === "..")
    throw new Error("Job evidence escapes workspace");
  return actual;
}
async function fileDigest(path, limit, collect = false, root, copyTo) {
  const handle = await open(
    path,
    constants.O_RDONLY | constants.O_NONBLOCK | (constants.O_NOFOLLOW ?? 0),
  );
  let copy;
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > limit)
      throw new Error("Job evidence size or type is unsupported");
    if (root) {
      // The opened descriptor pins the file even if its leaf or ancestors were swapped.
      const opened = await realpath(`/proc/self/fd/${handle.fd}`),
        rel = relative(root, opened);
      if (!rel || isAbsolute(rel) || rel.split(sep)[0] === "..")
        throw new Error("Opened job evidence escapes workspace");
    }
    if (copyTo) copy = await open(copyTo, "wx", 0o600);
    const hash = createHash("sha256"),
      chunks = [];
    let size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      size += chunk.length;
      if (size > limit) throw new Error("Job evidence exceeds size limit");
      hash.update(chunk);
      if (copy) await copy.writeFile(chunk);
      if (collect) chunks.push(chunk);
    }
    if (size === 0) throw new Error("Empty job evidence");
    return { sha256: hash.digest("hex"), bytes: collect ? Buffer.concat(chunks) : null };
  } finally {
    try {
      if (copy) await copy.close();
    } finally {
      await handle.close();
    }
  }
}
/** Current local bytes only. A receipt remains a supplied observation, not provider authentication. */
export async function inspectJobReceipt(workspace, receiptPath) {
  if (!workspace) throw new Error("Observation requires an explicit workspace");
  if (process.platform !== "linux")
    throw new Error("Verified receipt inspection requires Linux descriptor paths");
  const root = await realpath(workspace),
    file = await confined(root, receiptPath),
    proof = await fileDigest(file, 1024 * 1024, true, root);
  const receipt = JSON.parse(proof.bytes.toString("utf8"));
  if (!receipt || !Array.isArray(receipt.outputs) || receipt.outputs.length > 16)
    throw new Error("Invalid receipt outputs");
  for (const output of receipt.outputs) {
    const actual = await confined(root, output.path),
      digest = await fileDigest(actual, 2 * 1024 * 1024 * 1024, false, root);
    if (digest.sha256 !== output.sha256) throw new Error("Candidate output hash mismatch");
  }
  return { receipt, evidence: { path: receiptPath, sha256: proof.sha256 } };
}
async function publish(store, state) {
  const bytes = JSON.stringify(state, null, 2) + "\n";
  if (Buffer.byteLength(bytes) > stateLimit) throw new Error("Job state exceeds 32 MiB");
  const temp = join(store, `.state-${randomUUID()}.tmp`);
  let file;
  try {
    file = await open(temp, "wx", 0o600);
    await file.writeFile(bytes);
    await file.sync();
    await file.close();
    file = null;
    await rename(temp, join(store, "state.json"));
    const directory = await open(store, "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } finally {
    if (file) await file.close();
    await unlink(temp).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
}
async function withWriter(store, fn) {
  let lock;
  try {
    lock = await open(join(store, ".write.lock"), "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "Job store has another writer or an abandoned lock; inspect its owner before recovery",
      );
    throw error;
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid }) + "\n");
    return await fn();
  } finally {
    await lock.close();
    await unlink(join(store, ".write.lock"));
  }
}
export async function initializeJobStore(bundle, store) {
  const state = createJobs(bundle);
  await mkdir(store, { mode: 0o700 });
  return withWriter(store, async () => {
    await publish(store, state);
    return state;
  });
}
export async function readJobStore(bundle, store) {
  return restoreJobs(bundle, await readJobJson(join(store, "state.json")));
}
export async function updateJobStore(bundle, store, command, { workspace } = {}) {
  return withWriter(store, async () => {
    const state = await readJobStore(bundle, store);
    if (command.expectedRevision !== state.revision) throw new Error("Stale job revision");
    let action = command.action;
    if (action?.type === "observe") {
      if (Object.keys(action).some((k) => !["type", "receiptPath", "reason"].includes(k)))
        throw new Error("Observation requires a local receipt path");
      action = {
        type: "observe",
        ...(await inspectJobReceipt(workspace, action.receiptPath)),
        reason: action.reason,
      };
    }
    const next = applyJob(bundle, state, { ...command, action });
    await publish(store, next);
    return next;
  });
}

/** Verify current media against captured intent without copying or granting approval. */
export async function verifyJobMedia(workspace, path, expectedSha256) {
  if (process.platform !== "linux")
    throw new Error("Verified media inspection requires Linux descriptor paths");
  if (typeof expectedSha256 !== "string" || !/^[a-f0-9]{64}$/.test(expectedSha256))
    throw new Error("Expected media hash required");
  const root = await realpath(workspace),
    actual = await confined(root, path),
    proof = await fileDigest(actual, 2 * 1024 * 1024 * 1024, false, root);
  if (proof.sha256 !== expectedSha256) throw new Error("Current reference hash mismatch");
  return { path, sha256: proof.sha256 };
}

/** Copy pinned, hash-checked candidate bytes only into a caller-owned new staging file. */
export async function copyJobMedia(workspace, path, expectedSha256, destination) {
  if (process.platform !== "linux")
    throw new Error("Verified media copy requires Linux descriptor paths");
  if (typeof expectedSha256 !== "string" || !/^[a-f0-9]{64}$/.test(expectedSha256))
    throw new Error("Expected media hash required");
  const root = await realpath(workspace),
    actual = await confined(root, path),
    proof = await fileDigest(actual, 2 * 1024 * 1024 * 1024, false, root, destination);
  if (proof.sha256 !== expectedSha256) throw new Error("Current candidate hash mismatch");
  return { path, sha256: proof.sha256 };
}
