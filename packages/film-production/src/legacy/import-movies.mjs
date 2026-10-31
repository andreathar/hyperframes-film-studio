import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  readFile,
  writeFile,
  realpath,
  stat,
  lstat,
  mkdir,
  mkdtemp,
  rename,
  rm,
  rmdir,
} from "node:fs/promises";
import { resolve, relative, isAbsolute, sep, join, dirname, basename } from "node:path";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function digest(path) {
  const h = createHash("sha256");
  for await (const chunk of createReadStream(path)) h.update(chunk);
  return h.digest("hex");
}
function localPath(root, path) {
  if (
    typeof path !== "string" ||
    !path ||
    path.includes("\\") ||
    path.includes(":") ||
    path.startsWith("/") ||
    path.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw new Error("Source path must be relative without escape");
  return resolve(root, path);
}
async function ownedPath(root, path) {
  const actual = await realpath(localPath(root, path));
  const rel = relative(root, actual);
  if (!rel || isAbsolute(rel) || rel.split(sep)[0] === "..")
    throw new Error("Source escapes outside workspace");
  if (!(await stat(actual)).isFile()) throw new Error("Source is not a regular file");
  return actual;
}
function records(value, label) {
  if (
    !Array.isArray(value) ||
    value.some(
      (v) =>
        !v || typeof v !== "object" || Array.isArray(v) || typeof v.id !== "string" || !v.id.trim(),
    )
  )
    throw new Error(`${label}: expected records with IDs`);
  return value;
}
function childPath(root, path) {
  const full = localPath(root, path);
  return relative(root, full).split(sep).join("/");
}

/** Read-only import candidate. Source declarations are evidence, never executable approval. */
export async function inspectMovies(workspace) {
  const root = await realpath(resolve(workspace));
  let selectedRoot;
  const documents = {},
    diagnostics = [];
  const note = (code, subject, message, severity = "warning") =>
    diagnostics.push({ code, subject, message, severity });
  async function document(name, path, json = true, optional = false) {
    try {
      const actual = await ownedPath(root, path);
      if (selectedRoot) {
        const rel = relative(selectedRoot, actual);
        if (!rel || isAbsolute(rel) || rel.split(sep)[0] === "..")
          throw new Error("Source document escapes selected project");
      }
      if ((await stat(actual)).size > 8 * 1024 * 1024)
        throw new Error("Source document exceeds 8 MiB");
      const bytes = await readFile(actual),
        text = bytes.toString("utf8");
      const d = { path, sha256: hash(bytes), text };
      if (json) d.value = JSON.parse(text);
      documents[name] = d;
      return d.value;
    } catch (e) {
      if (optional && e.code === "ENOENT") {
        note("MISSING_DOCUMENT", name, "Optional source document is missing");
        return undefined;
      }
      throw e;
    }
  }
  const w = await document("workspace", "workspace.json");
  if (!w || !Array.isArray(w.projects) || typeof w.activeFilm !== "string")
    throw new Error("Invalid workspace project selection");
  const selected = w.projects.filter((p) => p.id === w.activeFilm);
  if (selected.length !== 1) throw new Error("Active film must resolve to exactly one project");
  const p = selected[0];
  const projectRoot = localPath(root, p.root);
  selectedRoot = await realpath(projectRoot);
  for (const path of [p.manifest, p.productionPlan, p.tasks]) {
    const relativePath = relative(projectRoot, localPath(root, path));
    if (!relativePath || isAbsolute(relativePath) || relativePath.split(sep)[0] === "..")
      throw new Error("Source document belongs to another project");
    const actual = await realpath(localPath(root, path));
    const actualProject = await realpath(projectRoot);
    const actualRelative = relative(actualProject, actual);
    if (!actualRelative || isAbsolute(actualRelative) || actualRelative.split(sep)[0] === "..")
      throw new Error("Source document escapes project");
  }
  const manifest = await document("manifest", p.manifest);
  const plan = await document("plan", p.productionPlan);
  await document("board", p.tasks);
  await document("approvals", childPath(root, `${p.root}/00_brief/approvals.json`));
  await document("script", childPath(root, `${p.root}/01_script/script-en.md`), false, true);
  await document(
    "dialogue",
    childPath(root, `${p.root}/01_script/dialogue-lines.csv`),
    false,
    true,
  );
  if (!manifest || !plan) throw new Error("Missing production documents");
  const planShots = records(plan.shots, "plan shots"),
    legacyShots = records(manifest.shots, "manifest shots"),
    refs = records(plan.references, "references"),
    takes = records(manifest.takes, "takes");
  function unique(rows, label) {
    const ids = new Set();
    for (const r of rows) {
      if (ids.has(r.id))
        note(
          "DUPLICATE_ID",
          `${label}:${r.id}`,
          "Duplicate source ID; resolve before mapping",
          "error",
        );
      ids.add(r.id);
    }
    return ids;
  }
  const planIds = unique(planShots, "plan"),
    legacyIds = unique(legacyShots, "manifest"),
    refIds = unique(refs, "reference"),
    takeIds = unique(takes, "take");
  const shots = [
    ...planShots.map((record) => ({ key: `plan:${record.id}`, source: "plan", record })),
    ...legacyShots.map((record) => ({ key: `manifest:${record.id}`, source: "manifest", record })),
  ];
  for (const s of planShots) {
    if (s.referenceIds !== undefined && !Array.isArray(s.referenceIds))
      throw new Error("referenceIds must be an array");
    for (const id of s.referenceIds ?? [])
      if (!refIds.has(id))
        note("UNKNOWN_REFERENCE", `plan:${s.id}`, `Unknown reference ${id}`, "error");
    if (!legacyIds.has(s.id))
      note("UNMAPPED_SHOT", `plan:${s.id}`, "No same-ID legacy shot; explicit mapping required");
    else
      note(
        "SHOT_MAPPING_REQUIRED",
        `plan:${s.id}`,
        "Same ID exists in both sources; equivalence not assumed",
      );
  }
  for (const s of legacyShots) {
    if (s.takeIds !== undefined && !Array.isArray(s.takeIds))
      throw new Error("takeIds must be an array");
    for (const id of [...(s.takeIds ?? []), ...(s.acceptedTakeId ? [s.acceptedTakeId] : [])]) {
      if (!takeIds.has(id)) note("UNKNOWN_TAKE", `manifest:${s.id}`, `Unknown take ${id}`, "error");
      else if (takes.find((t) => t.id === id).shotId !== s.id)
        note(
          "TAKE_SHOT_CONFLICT",
          `manifest:${s.id}`,
          `Take ${id} belongs to another source shot`,
          "error",
        );
    }
  }
  async function media(record, path, subject) {
    if (record.archived === true) return { state: "archived" };
    try {
      const actual = await ownedPath(root, path);
      const observedSha256 = await digest(actual);
      if (
        record.sha256 !== undefined &&
        (!/^[a-f0-9]{64}$/.test(record.sha256) || record.sha256 !== observedSha256)
      ) {
        note("HASH_MISMATCH", subject, "Media bytes differ from declared source hash", "error");
        return { path, state: "hash-mismatch", observedSha256 };
      }
      return { path, state: record.sha256 ? "verified" : "observed-unverified", observedSha256 };
    } catch (e) {
      const missing = e.code === "ENOENT";
      note(
        missing ? "MISSING_MEDIA" : "INVALID_MEDIA",
        subject,
        missing
          ? "Source media is absent; nothing restored"
          : "Media path is invalid or outside workspace",
        missing ? "warning" : "error",
      );
      return {
        path: typeof path === "string" ? path : null,
        state: missing ? "missing" : "invalid",
      };
    }
  }
  const references = [];
  for (const record of refs)
    references.push({
      id: record.id,
      record,
      media: await media(record, record.path, `reference:${record.id}`),
    });
  const importedTakes = [];
  for (const record of takes) {
    if (!legacyIds.has(record.shotId) && !planIds.has(record.shotId))
      note(
        "UNMAPPED_TAKE",
        `take:${record.id}`,
        "Take has no matching source shot; explicit mapping required",
      );
    let path;
    try {
      path = childPath(root, `${p.root}/${record.path}`);
    } catch {
      path = null;
    }
    importedTakes.push({
      id: record.id,
      record,
      approval: "not-imported",
      media: await media(record, path, `take:${record.id}`),
    });
  }
  return {
    version: 1,
    kind: "movies-import-candidate",
    projectId: p.id,
    sourceAuthority: "external",
    executionAllowed: false,
    documents,
    shots,
    references,
    takes: importedTakes,
    diagnostics,
  };
}

/** Snapshot evidence into a new directory only, after a fresh content/readiness inspection. */
export async function saveImport(workspace, bundle, outputPath) {
  const output = resolve(outputPath);
  try {
    await lstat(output);
    throw new Error("Output already exists");
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const fresh = await inspectMovies(workspace);
  if (JSON.stringify(fresh) !== JSON.stringify(bundle))
    throw new Error("Source changed; inspect again before saving");
  await mkdir(dirname(output), { recursive: true });
  const stage = await mkdtemp(join(dirname(output), `.${basename(output)}-import-`));
  let reserved = false;
  try {
    await writeFile(join(stage, "import.json"), JSON.stringify(bundle, null, 2) + "\n");
    await writeFile(
      join(stage, "report.json"),
      JSON.stringify({ ...importReport(bundle), mode: "snapshot" }, null, 2) + "\n",
    );
    await mkdir(output);
    reserved = true;
    await rename(stage, output);
    reserved = false;
  } catch (e) {
    await rm(stage, { recursive: true, force: true });
    if (reserved) await rmdir(output).catch(() => {});
    throw e;
  }
  return { ...importReport(bundle), mode: "snapshot" };
}
export function importReport(bundle) {
  return {
    mode: "dry-run",
    projectId: bundle.projectId,
    executionAllowed: false,
    counts: {
      shots: bundle.shots.length,
      references: bundle.references.length,
      takes: bundle.takes.length,
    },
    diagnostics: bundle.diagnostics,
    sourceHashes: Object.fromEntries(
      Object.entries(bundle.documents).map(([k, d]) => [k, d.sha256]),
    ),
  };
}
