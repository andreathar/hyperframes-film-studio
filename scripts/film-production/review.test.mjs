import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createReview, applyReview, reviewFingerprint } from "./review.mjs";
function fixture() {
  return {
    version: 1,
    kind: "movies-import-candidate",
    projectId: "film",
    executionAllowed: false,
    documents: {},
    shots: [
      { key: "plan:S1", source: "plan", record: { id: "S1" } },
      { key: "plan:S2", source: "plan", record: { id: "S2" } },
      { key: "manifest:OLD1", source: "manifest", record: { id: "OLD1" } },
      { key: "manifest:OLD2", source: "manifest", record: { id: "OLD2" } },
    ],
    references: [
      {
        id: "R1",
        record: { role: "identity", sha256: "a".repeat(64) },
        media: { state: "verified", observedSha256: "a".repeat(64) },
      },
    ],
    takes: [
      {
        id: "T1",
        record: { shotId: "OLD1", status: "accepted" },
        approval: "not-imported",
        media: { state: "observed-unverified", observedSha256: "b".repeat(64) },
      },
    ],
    diagnostics: [],
  };
}
function command(state, action) {
  return {
    projectId: state.projectId,
    sourceFingerprint: state.sourceFingerprint,
    expectedRevision: state.revision,
    action,
  };
}
const mapping = {
  type: "link-shot",
  planShotKey: "plan:S1",
  legacyShotKey: "manifest:OLD1",
  reason: "Explicit coverage crosswalk",
};
const selection = {
  type: "select-take",
  shotKey: "plan:S1",
  takeId: "T1",
  expectedMediaSha256: "b".repeat(64),
  reason: "Compare as candidate",
};
test("initial review grants no authority and does not inherit accepted take declarations", () => {
  const b = fixture(),
    r = createReview(b);
  assert.equal(r.executionAllowed, false);
  assert.equal(r.revision, 0);
  assert.deepEqual(r.takes, []);
  assert.deepEqual(r.shotLinks, []);
  assert.equal(b.takes[0].record.status, "accepted");
  assert.equal(r.sourceFingerprint, reviewFingerprint(b));
});
test("explicit mapping permits compatible candidate selection without changing inputs", () => {
  const b = fixture(),
    before = JSON.stringify(b),
    r = createReview(b),
    one = applyReview(b, r, command(r, mapping)),
    two = applyReview(b, one, command(one, selection));
  assert.equal(two.revision, 2);
  assert.deepEqual(r.shotLinks, []);
  assert.equal(two.takes[0].takeId, "T1");
  assert.equal(two.takes[0].status, "candidate");
  assert.equal(two.executionAllowed, false);
  assert.equal(JSON.stringify(b), before);
  assert.equal(two.history.length, 2);
});
test("changing a crosswalk invalidates the previous candidate selection", () => {
  const b = fixture();
  let s = createReview(b);
  s = applyReview(b, s, command(s, mapping));
  s = applyReview(b, s, command(s, selection));
  s = applyReview(b, s, command(s, { ...mapping, legacyShotKey: "manifest:OLD2" }));
  assert.deepEqual(s.takes, []);
});
test("verified reference assignment preserves declared role and hash", () => {
  const b = fixture(),
    r = createReview(b),
    s = applyReview(
      b,
      r,
      command(r, {
        type: "assign-reference",
        shotKey: "plan:S1",
        referenceId: "R1",
        role: "identity",
        expectedMediaSha256: "a".repeat(64),
        reason: "Compare identity",
      }),
    );
  assert.equal(s.references[0].role, "identity");
  assert.equal(s.references[0].sha256, "a".repeat(64));
});
for (const [name, change] of [
  [
    "foreign project",
    (b, r, c) => {
      c.projectId = "other";
    },
  ],
  [
    "stale revision",
    (b, r, c) => {
      c.expectedRevision = 2;
    },
  ],
  [
    "changed import",
    (b) => {
      b.documents.new = "changed";
    },
  ],
  [
    "foreign shot",
    (b, r, c) => {
      c.action.planShotKey = "plan:other";
    },
  ],
  [
    "unknown operation",
    (b, r, c) => {
      c.action = { type: "approve", reason: "not allowed" };
    },
  ],
  [
    "unsupported authority field",
    (b, r, c) => {
      c.action.approved = true;
    },
  ],
])
  test(`rejects ${name}`, () => {
    const b = fixture(),
      r = createReview(b),
      c = command(r, { ...mapping });
    change(b, r, c);
    assert.throws(() => applyReview(b, r, c));
  });
test("unmapped or mismatched take cannot be selected", () => {
  const b = fixture(),
    r = createReview(b);
  assert.throws(() => applyReview(b, r, command(r, selection)));
  assert.throws(() => applyReview(b, r, command(r, { ...selection, shotKey: "manifest:OLD2" })));
});
test("one-to-one crosswalk rejects an ambiguous legacy assignment", () => {
  const b = fixture();
  let s = createReview(b);
  s = applyReview(b, s, command(s, mapping));
  assert.throws(() => applyReview(b, s, command(s, { ...mapping, planShotKey: "plan:S2" })));
});
for (const mediaState of ["archived", "missing", "hash-mismatch"])
  test(`cannot select ${mediaState} media`, () => {
    const b = fixture();
    b.takes[0].media.state = mediaState;
    const r = createReview(b);
    assert.throws(() => applyReview(b, r, command(r, { ...selection, shotKey: "manifest:OLD1" })));
  });
test("reference role change or byte hash mismatch is refused", () => {
  const b = fixture(),
    r = createReview(b);
  const a = {
    type: "assign-reference",
    shotKey: "plan:S1",
    referenceId: "R1",
    role: "composition",
    expectedMediaSha256: "a".repeat(64),
    reason: "Test",
  };
  assert.throws(() => applyReview(b, r, command(r, a)));
  a.role = "identity";
  a.expectedMediaSha256 = "c".repeat(64);
  assert.throws(() => applyReview(b, r, command(r, a)));
});
test("CLI previews by default and exclusively saves a new review file", async () => {
  const root = await mkdtemp(join(tmpdir(), "film-review-"));
  try {
    const path = join(root, "import.json"),
      out = join(root, "review.json");
    await writeFile(path, JSON.stringify(fixture()));
    const cli = new URL("./review-cli.mjs", import.meta.url).pathname;
    const run = (args) =>
      spawnSync(process.execPath, [cli, "--import", path, ...args], { encoding: "utf8" });
    let p = run([]);
    assert.equal(p.status, 0, p.stderr);
    assert.equal(JSON.parse(p.stdout).executionAllowed, false);
    p = run(["--output", out]);
    assert.equal(p.status, 0, p.stderr);
    const before = await readFile(out, "utf8");
    p = run(["--output", out]);
    assert.notEqual(p.status, 0);
    assert.equal(await readFile(out, "utf8"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("edited review fields cannot bypass history replay", () => {
  const b = fixture(),
    r = createReview(b);
  r.takes.push({ takeId: "T1", status: "accepted" });
  assert.throws(() => applyReview(b, r, command(r, mapping)));
});
test("CLI restores equivalent state regardless of JSON key order", async () => {
  const root = await mkdtemp(join(tmpdir(), "review-restore-"));
  try {
    const b = fixture(),
      state = createReview(b);
    const importPath = join(root, "import.json"),
      statePath = join(root, "state.json");
    await writeFile(importPath, JSON.stringify(b));
    await writeFile(statePath, JSON.stringify(Object.fromEntries(Object.entries(state).reverse())));
    const p = spawnSync(
      process.execPath,
      [
        new URL("./review-cli.mjs", import.meta.url).pathname,
        "--import",
        importPath,
        "--state",
        statePath,
      ],
      { encoding: "utf8" },
    );
    assert.equal(p.status, 0, p.stderr);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("explicit removal clears assignments and unlinking removes dependent take selection", () => {
  const b = fixture();
  let s = createReview(b);
  s = applyReview(b, s, command(s, mapping));
  s = applyReview(b, s, command(s, selection));
  s = applyReview(
    b,
    s,
    command(s, {
      type: "assign-reference",
      shotKey: "plan:S1",
      referenceId: "R1",
      role: "identity",
      expectedMediaSha256: "a".repeat(64),
      reason: "Compare",
    }),
  );
  s = applyReview(
    b,
    s,
    command(s, {
      type: "clear-reference",
      shotKey: "plan:S1",
      referenceId: "R1",
      reason: "Wrong role context",
    }),
  );
  assert.deepEqual(s.references, []);
  s = applyReview(
    b,
    s,
    command(s, { type: "clear-take", shotKey: "plan:S1", reason: "Needs another candidate" }),
  );
  assert.deepEqual(s.takes, []);
  s = applyReview(b, s, command(s, selection));
  s = applyReview(
    b,
    s,
    command(s, { type: "unlink-shot", planShotKey: "plan:S1", reason: "Coverage mismatch" }),
  );
  assert.deepEqual(s.shotLinks, []);
  assert.deepEqual(s.takes, []);
  assert.equal(s.executionAllowed, false);
});

for (const role of [null, "", " "])
  test(
    "reference assignment requires an explicit nonempty source and action role " +
      JSON.stringify(role),
    () => {
      const b = fixture();
      if (role === null) delete b.references[0].record.role;
      else b.references[0].record.role = role;
      const r = createReview(b);
      const action = {
        type: "assign-reference",
        shotKey: "plan:S1",
        referenceId: "R1",
        expectedMediaSha256: "a".repeat(64),
        reason: "Compare",
      };
      if (role !== null) action.role = role;
      assert.throws(() => applyReview(b, r, command(r, action)));
    },
  );
test("assigned reference state survives JSON save and history replay", () => {
  const b = fixture(),
    r = createReview(b),
    s = applyReview(
      b,
      r,
      command(r, {
        type: "assign-reference",
        shotKey: "plan:S1",
        referenceId: "R1",
        role: "identity",
        expectedMediaSha256: "a".repeat(64),
        reason: "Compare",
      }),
    );
  const restored = JSON.parse(JSON.stringify(s));
  assert.doesNotThrow(() => applyReview(b, restored, command(restored, mapping)));
});
