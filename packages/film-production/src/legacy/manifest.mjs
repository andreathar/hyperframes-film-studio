const ID = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;

function fail(message) {
  throw new Error(message);
}
function object(value, fields, label) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(`${label}: expected object`);
  for (const key of Object.keys(value))
    if (!fields.includes(key)) fail(`${label}: unsupported field ${key}`);
  return value;
}
function text(value, label) {
  if (typeof value !== "string" || !value.trim() || value.length > 20000)
    fail(`${label}: expected nonempty text`);
}
function id(value, label) {
  if (typeof value !== "string" || !ID.test(value) || value === "film-stage")
    fail(`${label}: invalid ID`);
}
function number(value, min, max, label, integer = false) {
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isSafeInteger(value))
  )
    fail(`${label}: invalid number`);
}
function list(value, label, max = 10000) {
  if (!Array.isArray(value) || value.length > max) fail(`${label}: expected bounded array`);
  return value;
}
function unique(items, label) {
  const ids = new Set();
  for (const item of items) {
    id(item.id, label);
    if (ids.has(item.id)) fail(`${label}: duplicate ID ${item.id}`);
    ids.add(item.id);
  }
  return ids;
}

/** Strict preparation input; this format grants no approval or provider authority. */
export function validateManifest(input) {
  const m = object(input, ["version", "project", "assets", "shots", "edit", "notes"], "manifest");
  if (m.version !== 1) fail("Unsupported film manifest version");
  const p = object(m.project, ["id", "title", "fps", "width", "height"], "project");
  id(p.id, "project.id");
  text(p.title, "project.title");
  number(p.fps, 1, 120, "project.fps", true);
  number(p.width, 16, 7680, "project.width", true);
  number(p.height, 16, 4320, "project.height", true);
  if (p.width % 2 || p.height % 2) fail("Canvas dimensions must be even");
  if (m.notes !== undefined) text(m.notes, "notes");
  const assets = list(m.assets, "assets", 1000);
  for (const a of assets) {
    object(a, ["id", "path", "kind", "sha256"], "asset");
    text(a.path, "asset.path");
    if (
      a.path.startsWith("/") ||
      a.path.includes("\\") ||
      a.path.includes(":") ||
      a.path.split("/").some((s) => !s || s === "." || s === "..") ||
      [...a.path].some((character) => character.charCodeAt(0) < 32)
    )
      fail("Asset path must be local and relative without traversal");
    if (!["video", "audio"].includes(a.kind)) fail("Unsupported asset kind");
    if (typeof a.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(a.sha256))
      fail("Asset requires a SHA-256 hash");
  }
  const assetIds = unique(assets, "asset");
  const shots = list(m.shots, "shots");
  for (const s of shots) {
    object(s, ["id", "title", "direction", "lineIds"], "shot");
    text(s.title, "shot.title");
    if (s.direction !== undefined) {
      object(s.direction, ["camera", "acting", "dialogue", "lighting", "continuity"], "direction");
      for (const v of Object.values(s.direction)) text(v, "direction");
    }
    if (s.lineIds !== undefined) for (const line of list(s.lineIds, "lineIds")) id(line, "lineId");
  }
  const shotIds = unique(shots, "shot");
  const edit = object(m.edit, ["durationFrames", "clips"], "edit");
  number(edit.durationFrames, 1, 120 * 3600 * 4, "edit.durationFrames", true);
  const clips = list(edit.clips, "clips");
  for (const c of clips) {
    object(
      c,
      [
        "id",
        "shotId",
        "takeId",
        "assetId",
        "kind",
        "track",
        "startFrame",
        "durationFrames",
        "sourceInFrame",
        "rate",
        "volume",
      ],
      "clip",
    );
    if (!assetIds.has(c.assetId)) fail(`Clip ${c.id}: unknown asset`);
    if (c.shotId !== undefined && !shotIds.has(c.shotId)) fail(`Clip ${c.id}: unknown shot`);
    if (c.takeId !== undefined) id(c.takeId, "takeId");
    if (!["video", "audio"].includes(c.kind)) fail("Unsupported clip kind");
    if (
      c.kind === "video" &&
      (!c.shotId || assets.find((a) => a.id === c.assetId).kind !== "video")
    )
      fail("Picture clip requires a shot and video asset");
    number(c.track, c.kind === "video" ? 0 : 1, c.kind === "video" ? 0 : 64, "clip.track", true);
    number(c.startFrame, 0, edit.durationFrames - 1, "clip.startFrame", true);
    number(c.durationFrames, 1, edit.durationFrames, "clip.durationFrames", true);
    number(c.sourceInFrame, 0, Number.MAX_SAFE_INTEGER, "clip.sourceInFrame", true);
    number(c.rate, 0.1, 10, "clip.rate");
    number(c.volume, 0, 3.98, "clip.volume");
    if (c.kind === "video" && c.volume !== 0)
      fail("Picture audio must be muted; place dialogue on its own audio track");
    if (c.startFrame + c.durationFrames > edit.durationFrames)
      fail(`Clip ${c.id}: exceeds composition duration`);
  }
  unique(clips, "clip");
  for (const track of new Set(clips.map((c) => c.track))) {
    let end = 0;
    for (const c of clips
      .filter((v) => v.track === track)
      .sort((a, b) => a.startFrame - b.startFrame)) {
      if (c.startFrame < end) fail(`Track ${track}: clips overlap`);
      if (track === 0 && c.startFrame !== end) fail("Picture track has a gap");
      end = c.startFrame + c.durationFrames;
    }
    if (track === 0 && end !== edit.durationFrames) fail("Picture does not cover the composition");
  }
  if (!clips.some((c) => c.kind === "video")) fail("At least one picture clip is required");
  return m;
}

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const seconds = (frames, fps) => Number((frames / fps).toFixed(9)).toString();

/** Creates ordinary Hyperframes source. Media runtime owns seeking; no render-time JS. */
export function compositionHtml(input) {
  const m = validateManifest(input),
    p = m.project;
  const clips = m.edit.clips
    .map((c) => {
      const asset = m.assets.find((a) => a.id === c.assetId);
      const attributes = `id="${c.id}" class="clip" src="${escapeHtml(asset.path)}" data-start="${seconds(c.startFrame, p.fps)}" data-duration="${seconds(c.durationFrames, p.fps)}" data-media-start="${seconds(c.sourceInFrame, p.fps)}" data-playback-rate="${c.rate}" data-track-index="${c.track}" data-volume="${c.volume}"`;
      return c.kind === "video"
        ? `    <video ${attributes} muted playsinline width="${p.width}" height="${p.height}" aria-label="${escapeHtml(m.shots.find((s) => s.id === c.shotId).title)}"></video>`
        : `    <audio ${attributes}></audio>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(p.title)}</title>
  <style>
    html, body { margin: 0; width: ${p.width}px; height: ${p.height}px; overflow: hidden; background: #000; }
    #film-stage { position: absolute; inset: 0; background: #000; }
    video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
  </style>
</head>
<body>
  <main id="film-stage" data-composition-id="${p.id}" data-start="0" data-duration="${seconds(m.edit.durationFrames, p.fps)}" data-width="${p.width}" data-height="${p.height}" data-fps="${p.fps}" data-no-timeline>
${clips}
  </main>
</body>
</html>
`;
}
