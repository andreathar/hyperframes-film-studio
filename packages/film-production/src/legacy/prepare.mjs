import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  readFile,
  writeFile,
  copyFile,
  stat,
  lstat,
  realpath,
  mkdir,
  mkdtemp,
  rename,
  rm,
  rmdir,
} from "node:fs/promises";
import { dirname, basename, extname, join, relative, resolve, isAbsolute } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateManifest, compositionHtml } from "./manifest.mjs";

const run = promisify(execFile);
const digest = (value) => createHash("sha256").update(value).digest("hex");
async function fileHash(path) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(path)) h.update(chunk);
  return h.digest("hex");
}
async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
function confined(root, path) {
  const rel = relative(root, path);
  return rel !== "" && rel !== ".." && !rel.startsWith("../") && !isAbsolute(rel);
}
async function probe(path) {
  const { stdout } = await run(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=codec_type,duration,width,height",
      "-of",
      "json",
      "--",
      path,
    ],
    { timeout: 30000, maxBuffer: 1024 * 1024 },
  );
  return JSON.parse(stdout);
}

/** Prepare a new directory only. No providers, approval writes or existing edit replacement. */
export async function prepareProject(manifestPath, outputPath) {
  const input = resolve(manifestPath),
    output = resolve(outputPath);
  if (await exists(output))
    throw new Error("Output already exists; choose a new directory to preserve edits");
  if ((await stat(input)).size > 5 * 1024 * 1024) throw new Error("Manifest exceeds 5 MiB");
  const source = await readFile(input, "utf8");
  const m = validateManifest(JSON.parse(source));
  const root = await realpath(dirname(input));
  await mkdir(dirname(output), { recursive: true });
  const stage = await mkdtemp(join(dirname(output), `.${basename(output)}-preparing-`));
  let reserved = false;
  try {
    await mkdir(join(stage, "assets"));
    const assets = [],
      probes = new Map();
    for (const asset of m.assets) {
      const sourcePath = await realpath(resolve(root, asset.path));
      if (!confined(root, sourcePath))
        throw new Error(`Asset ${asset.id}: source escapes outside the manifest directory`);
      if (!(await stat(sourcePath)).isFile())
        throw new Error(`Asset ${asset.id}: source is not a file`);
      const ext = extname(asset.path).toLowerCase();
      if (!/^[.](mp4|mov|webm|mkv|wav|mp3|m4a|ogg|flac)$/.test(ext))
        throw new Error(`Asset ${asset.id}: unsupported file extension`);
      const path = `assets/${asset.id}${ext}`,
        destination = join(stage, path);
      await copyFile(sourcePath, destination);
      if ((await fileHash(destination)) !== asset.sha256)
        throw new Error(`Asset ${asset.id}: source hash changed`);
      const metadata = await probe(destination);
      if (!metadata.streams?.some((s) => s.codec_type === asset.kind))
        throw new Error(`Asset ${asset.id}: media kind does not match actual streams`);
      probes.set(asset.id, metadata);
      assets.push({ ...asset, path });
    }
    for (const clip of m.edit.clips) {
      const metadata = probes.get(clip.assetId);
      const stream = metadata.streams.find((s) => s.codec_type === clip.kind);
      if (!stream) throw new Error(`Clip ${clip.id}: source has no ${clip.kind} stream`);
      // Container length cannot prove coverage of a shorter stream (notably MKV audio).
      // Unknown stream coverage is refused instead of silently truncating dialogue.
      const duration = Number(stream.duration);
      const end = (clip.sourceInFrame + clip.durationFrames * clip.rate) / m.project.fps;
      if (!Number.isFinite(duration) || duration <= 0 || end > duration + 0.5 / m.project.fps)
        throw new Error(`Clip ${clip.id}: source duration cannot cover trim and playback rate`);
    }
    const portable = { ...m, assets },
      html = compositionHtml(portable);
    const receipt = {
      version: 1,
      status: "prepared",
      manifestSha256: digest(source),
      compositionSha256: digest(html),
      frameCount: m.edit.durationFrames,
      fps: m.project.fps,
      assets: assets.map(({ id, path, sha256 }) => ({ id, path, sha256 })),
      approval: "none; preparation is not creative acceptance",
    };
    await writeFile(join(stage, "index.html"), html);
    await writeFile(join(stage, "production.json"), JSON.stringify(portable, null, 2) + "\n");
    await writeFile(join(stage, "preparation.json"), JSON.stringify(receipt, null, 2) + "\n");
    // Exclusive reservation also catches another preparer that won the destination race.
    await mkdir(output);
    reserved = true;
    await rename(stage, output);
    reserved = false;
    return receipt;
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    // rmdir refuses nonempty directories; never erase a concurrent user's files.
    if (reserved) await rmdir(output).catch(() => {});
    throw error;
  }
}
