import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { inspectMovies, saveImport } from "./import-movies.mjs";
const hash = (x) => createHash("sha256").update(x).digest("hex");
async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), "movie-import-"));
  const put = async (p, v) => {
    await mkdir(join(root, p, ".."), { recursive: true });
    await writeFile(join(root, p), typeof v === "string" ? v : JSON.stringify(v));
  };
  const plan = {
    shots: [
      {
        id: "S1",
        title: "Plan speech",
        referenceIds: ["R1"],
        lineIds: ["L1"],
        camera: "Locked",
        action: "Pause",
      },
    ],
    references: [
      {
        id: "R1",
        path: "film/ref.png",
        sha256: hash("image"),
        role: "identity",
        states: { directorApproval: "pending" },
      },
    ],
  };
  const manifest = {
    shots: [{ id: "OLD1", takeIds: ["T1"], acceptedTakeId: "T1" }],
    takes: [
      { id: "T1", shotId: "OLD1", path: "take.mp4", status: "accepted" },
      { id: "OLD", shotId: "retired", path: "retired.mp4", archived: true },
    ],
  };
  await put("workspace.json", {
    activeFilm: "film",
    projects: [
      {
        id: "film",
        root: "film",
        manifest: "film/manifest.json",
        tasks: "film/tasks/board.json",
        productionPlan: "film/plan.json",
      },
    ],
  });
  await put("film/plan.json", plan);
  await put("film/manifest.json", manifest);
  await put("film/tasks/board.json", { tasks: [] });
  await put("film/00_brief/approvals.json", { paidGenerationBatchApproved: true });
  await put("film/01_script/script-en.md", "Exact — words.\n");
  await put("film/01_script/dialogue-lines.csv", 'line_id,text_en\nL1,"Exact, words"\n');
  await put("film/ref.png", "image");
  await put("film/take.mp4", "video");
  try {
    await fn({ root, put, plan, manifest });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
test("preserves separate shot IDs, exact source text and declarations without granting execution", () =>
  fixture(async ({ root }) => {
    const b = await inspectMovies(root);
    assert.equal(b.version, 1);
    assert.equal(b.executionAllowed, false);
    assert.equal(b.sourceAuthority, "external");
    assert.equal(b.documents["script"].text, "Exact — words.\n");
    assert.deepEqual(
      b.shots.map((x) => x.key),
      ["plan:S1", "manifest:OLD1"],
    );
    assert.equal(b.references[0].record.role, "identity");
    assert.equal(b.references[0].media.state, "verified");
    assert.equal(b.takes[0].record.status, "accepted");
    assert.equal(b.takes[0].approval, "not-imported");
    assert.equal(b.takes[1].media.state, "archived");
    assert.ok(b.diagnostics.some((d) => d.code === "UNMAPPED_SHOT"));
    assert.equal(b.documents.approvals.value.paidGenerationBatchApproved, true);
  }));
test("reports missing and hash-changed references instead of restoring or accepting them", () =>
  fixture(async ({ root, put, plan }) => {
    plan.references.push({ id: "R2", path: "film/missing.png", role: "composition" });
    await put("film/plan.json", plan);
    await put("film/ref.png", "changed");
    const b = await inspectMovies(root);
    assert.ok(b.diagnostics.some((d) => d.code === "HASH_MISMATCH"));
    assert.ok(b.diagnostics.some((d) => d.code === "MISSING_MEDIA"));
    assert.equal(b.executionAllowed, false);
    await assert.rejects(access(join(root, "film/missing.png")));
  }));
test("reports duplicate IDs and dangling reference/take links", () =>
  fixture(async ({ root, put, plan, manifest }) => {
    plan.shots.push({ ...plan.shots[0] });
    plan.shots[0].referenceIds = ["unknown"];
    manifest.shots[0].takeIds = ["missing"];
    await put("film/plan.json", plan);
    await put("film/manifest.json", manifest);
    const b = await inspectMovies(root);
    for (const code of ["DUPLICATE_ID", "UNKNOWN_REFERENCE", "UNKNOWN_TAKE"])
      assert.ok(
        b.diagnostics.some((d) => d.code === code),
        code,
      );
  }));
test("refuses workspace source pointers outside the selected root", () =>
  fixture(async ({ root, put }) => {
    await put("workspace.json", {
      activeFilm: "film",
      projects: [
        {
          id: "film",
          root: "../outside",
          manifest: "film/manifest.json",
          tasks: "film/tasks/board.json",
          productionPlan: "film/plan.json",
        },
      ],
    });
    await assert.rejects(inspectMovies(root), /relative|outside|escape/i);
  }));
test("does not follow media symlinks outside the workspace", () =>
  fixture(async ({ root }) => {
    const outside = await mkdtemp(join(tmpdir(), "movie-outside-"));
    try {
      await writeFile(join(outside, "x"), "image");
      await rm(join(root, "film/ref.png"));
      await symlink(join(outside, "x"), join(root, "film/ref.png"));
      const b = await inspectMovies(root);
      assert.ok(b.diagnostics.some((d) => d.code === "INVALID_MEDIA"));
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  }));
test("saves a new snapshot without changing sources and refuses overwrite or stale source documents", () =>
  fixture(async ({ root, put }) => {
    const b = await inspectMovies(root);
    const before = await readFile(join(root, "film/manifest.json"), "utf8");
    const out = join(root, "snapshot");
    await saveImport(root, b, out);
    assert.equal(
      JSON.parse(await readFile(join(out, "import.json"), "utf8")).executionAllowed,
      false,
    );
    assert.equal(await readFile(join(root, "film/manifest.json"), "utf8"), before);
    await assert.rejects(saveImport(root, b, out), /exist/i);
    await put("film/plan.json", { shots: [], references: [] });
    await assert.rejects(saveImport(root, b, join(root, "stale")), /changed|stale/i);
    await assert.rejects(access(join(root, "stale")));
  }));
test("CLI defaults to inspection without creating output", () =>
  fixture(async ({ root }) => {
    const r = spawnSync(
      process.execPath,
      [new URL("./import-cli.mjs", import.meta.url).pathname, "--workspace", root],
      { encoding: "utf8" },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).mode, "dry-run");
    await assert.rejects(access(join(root, "import.json")));
  }));

test("rejects source pointers into a different project inside the workspace", () =>
  fixture(async ({ root, put }) => {
    await put("other/plan.json", { shots: [], references: [] });
    await put("workspace.json", {
      activeFilm: "film",
      projects: [
        {
          id: "film",
          root: "film",
          manifest: "film/manifest.json",
          tasks: "film/tasks/board.json",
          productionPlan: "other/plan.json",
        },
      ],
    });
    await assert.rejects(inspectMovies(root), /project/i);
  }));
test("saved report says snapshot and changed media cannot be saved as fresh evidence", () =>
  fixture(async ({ root, put }) => {
    const b = await inspectMovies(root);
    await saveImport(root, b, join(root, "saved"));
    assert.equal(
      JSON.parse(await readFile(join(root, "saved/report.json"), "utf8")).mode,
      "snapshot",
    );
    await put("film/ref.png", "drift");
    await assert.rejects(saveImport(root, b, join(root, "media-stale")), /changed/i);
  }));

test("project approval documents cannot resolve into a different project", () =>
  fixture(async ({ root, put }) => {
    await put("other/approvals.json", { owner: "other" });
    await rm(join(root, "film/00_brief/approvals.json"));
    await symlink(join(root, "other/approvals.json"), join(root, "film/00_brief/approvals.json"));
    await assert.rejects(inspectMovies(root), /project/i);
  }));

for (const file of ["script-en.md", "dialogue-lines.csv"]) {
  test(`project ${file} cannot resolve into another project`, () =>
    fixture(async ({ root, put }) => {
      await put("other/source", "foreign text");
      await rm(join(root, "film/01_script", file));
      await symlink(join(root, "other/source"), join(root, "film/01_script", file));
      await assert.rejects(inspectMovies(root), /project/i);
    }));
}
test("optional missing script remains a diagnostic rather than an invented replacement", () =>
  fixture(async ({ root }) => {
    await rm(join(root, "film/01_script/script-en.md"));
    const b = await inspectMovies(root);
    assert.ok(b.diagnostics.some((d) => d.code === "MISSING_DOCUMENT" && d.subject === "script"));
    assert.equal(b.documents.script, undefined);
  }));
