import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { Window } from "happy-dom";
import { createReview, applyReview, reviewFingerprint } from "./review.mjs";
import { compilePlacement, preparePlacement } from "./placement.mjs";
function fixture(sha256 = "a".repeat(64)) {
  const bundle = {
    version: 1,
    kind: "movies-import-candidate",
    projectId: "synthetic-film",
    executionAllowed: false,
    documents: {},
    shots: [
      {
        key: "plan:S1",
        source: "plan",
        record: {
          id: "S1",
          title: "Synthetic pause",
          camera: "Locked",
          acting: "Listen before answering",
          intention: "Show hesitation",
          lineIds: ["L1"],
        },
      },
      { key: "manifest:OLD1", source: "manifest", record: { id: "OLD1", title: "Legacy source" } },
    ],
    references: [],
    takes: [
      {
        id: "T:original",
        record: { shotId: "OLD1", status: "accepted" },
        media: { state: "observed-unverified", path: "media/take.mp4", observedSha256: sha256 },
      },
    ],
    diagnostics: [],
  };
  let review = createReview(bundle);
  const act = (action) => {
    review = applyReview(bundle, review, {
      projectId: review.projectId,
      sourceFingerprint: review.sourceFingerprint,
      expectedRevision: review.revision,
      action,
    });
  };
  act({
    type: "link-shot",
    planShotKey: "plan:S1",
    legacyShotKey: "manifest:OLD1",
    reason: "Explicit synthetic crosswalk",
  });
  act({
    type: "select-take",
    shotKey: "plan:S1",
    takeId: "T:original",
    expectedMediaSha256: sha256,
    reason: "Candidate only",
  });
  const picture = {
    id: "picture",
    shotKey: "plan:S1",
    takeId: "T:original",
    kind: "video",
    track: 0,
    startFrame: 0,
    durationFrames: 24,
    sourceInFrame: 12,
    rate: 1,
    volume: 0,
  };
  const plan = {
    version: 1,
    project: { id: "synthetic-film", title: "Synthetic exchange", fps: 24, width: 64, height: 64 },
    sourceFingerprint: review.sourceFingerprint,
    reviewFingerprint: reviewFingerprint(review),
    expectedReviewRevision: 2,
    reason: "Explicit test cut",
    edit: {
      durationFrames: 48,
      clips: [
        picture,
        { ...picture, id: "reaction", startFrame: 24, sourceInFrame: 0 },
        {
          ...picture,
          id: "dialogue",
          kind: "audio",
          track: 1,
          durationFrames: 36,
          sourceInFrame: 0,
          volume: 0.8,
        },
      ],
    },
  };
  return { bundle, review, plan };
}
test("explicit placements retain timing, original identities and full direction through safe aliases", () => {
  const f = fixture(),
    before = JSON.stringify(f),
    p = compilePlacement(f.bundle, f.review, f.plan);
  assert.equal(JSON.stringify(f), before);
  assert.equal(p.manifest.edit.clips[0].sourceInFrame, 12);
  assert.equal(p.manifest.edit.clips[2].durationFrames, 36);
  assert.equal(p.manifest.edit.clips[1].startFrame, 24);
  assert.equal(p.manifest.edit.clips[0].takeId, "take-1");
  assert.equal(p.manifest.edit.clips[0].shotId, "shot-1");
  assert.equal(p.manifest.assets.length, 1);
  assert.deepEqual(p.manifest.shots[0].lineIds, ["L1"]);
  assert.equal(p.manifest.shots[0].direction.acting, "Listen before answering");
  assert.equal(p.provenance.shots[0].record.intention, "Show hesitation");
  assert.equal(p.provenance.takes[0].takeId, "T:original");
  assert.equal(p.provenance.clips[0].shotKey, "plan:S1");
  assert.equal(p.provenance.executionAllowed, false);
  assert.equal(p.provenance.creativeApproval, "not-inferred");
  assert.ok(p.provenance.diagnostics.some((d) => d.field === "intention"));
});
for (const [name, change] of [
  [
    "foreign project",
    (f) => {
      f.plan.project.id = "other";
    },
  ],
  [
    "stale review revision",
    (f) => {
      f.plan.expectedReviewRevision = 1;
    },
  ],
  [
    "wrong saved review",
    (f) => {
      f.plan.reviewFingerprint = "f".repeat(64);
    },
  ],
  [
    "changed import",
    (f) => {
      f.bundle.documents.changed = { sha256: "f".repeat(64) };
    },
  ],
  [
    "unselected take",
    (f) => {
      f.plan.edit.clips[0].takeId = "missing";
    },
  ],
  [
    "unselected shot",
    (f) => {
      f.plan.edit.clips[0].shotKey = "manifest:OLD1";
    },
  ],
  [
    "forged selection",
    (f) => {
      f.review.takes[0].status = "accepted";
    },
  ],
  [
    "unsupported effect",
    (f) => {
      f.plan.edit.clips[0].effects = ["blur"];
    },
  ],
  [
    "implicit source trim",
    (f) => {
      delete f.plan.edit.clips[0].sourceInFrame;
    },
  ],
  [
    "picture gap",
    (f) => {
      f.plan.edit.clips[1].startFrame = 25;
    },
  ],
  [
    "fractional frame",
    (f) => {
      f.plan.edit.clips[0].durationFrames = 23.5;
    },
  ],
  [
    "picture audio doubling",
    (f) => {
      f.plan.edit.clips[0].volume = 1;
    },
  ],
  [
    "authority injection",
    (f) => {
      f.plan.approved = true;
    },
  ],
  [
    "line ID rewriting",
    (f) => {
      f.bundle.shots[0].record.lineIds = ["unsafe:line"];
      const events = f.review.history;
      f.review = createReview(f.bundle);
      for (const event of events) {
        f.review = applyReview(f.bundle, f.review, {
          ...event,
          sourceFingerprint: f.review.sourceFingerprint,
          expectedRevision: f.review.revision,
        });
      }
      f.plan.sourceFingerprint = f.review.sourceFingerprint;
      f.plan.reviewFingerprint = reviewFingerprint(f.review);
      f.plan.expectedReviewRevision = f.review.revision;
    },
  ],
])
  test(`placement rejects ${name}`, () => {
    const f = fixture();
    change(f);
    assert.throws(
      () => compilePlacement(f.bundle, f.review, f.plan),
      name === "line ID rewriting" ? /lineId: invalid ID/ : undefined,
    );
  });
let mediaRoot, media;
before(async () => {
  mediaRoot = await mkdtemp(join(tmpdir(), "placement-media-"));
  media = join(mediaRoot, "source.mp4");
  execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=64x64:r=24:d=2",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=48000:duration=2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      media,
    ],
    { timeout: 30000 },
  );
});
after(async () => {
  await rm(mediaRoot, { recursive: true, force: true });
});
async function sandbox(fn) {
  const root = await mkdtemp(join(tmpdir(), "placement-"));
  try {
    const workspace = join(root, "workspace");
    await mkdir(join(workspace, "media"), { recursive: true });
    const bytes = await readFile(media);
    await writeFile(join(workspace, "media/take.mp4"), bytes);
    await fn({
      ...fixture(createHash("sha256").update(bytes).digest("hex")),
      root,
      workspace,
      output: join(root, "composition"),
      bytes,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
test("selected media becomes a new portable composition with separate L-cut audio", () =>
  sandbox(async (f) => {
    await preparePlacement(f);
    const production = JSON.parse(await readFile(join(f.output, "production.json"), "utf8")),
      provenance = JSON.parse(await readFile(join(f.output, "placement.json"), "utf8"));
    assert.equal(production.edit.clips[2].durationFrames, 36);
    assert.equal(provenance.takes[0].takeId, "T:original");
    assert.deepEqual(await readFile(join(f.workspace, "media/take.mp4")), f.bytes);
    assert.deepEqual(await readFile(join(f.output, production.assets[0].path)), f.bytes);
    const w = new Window();
    w.document.write(await readFile(join(f.output, "index.html"), "utf8"));
    assert.equal(w.document.querySelector("#dialogue").getAttribute("data-duration"), "1.5");
    assert.equal(w.document.querySelector("#reaction").getAttribute("data-start"), "1");
    w.close();
  }));
test("existing edited composition is preserved and canonical workspace outputs are refused", () =>
  sandbox(async (f) => {
    await preparePlacement(f);
    await writeFile(join(f.output, "index.html"), "USER EDIT");
    await assert.rejects(preparePlacement(f));
    assert.equal(await readFile(join(f.output, "index.html"), "utf8"), "USER EDIT");
    await assert.rejects(preparePlacement({ ...f, output: join(f.workspace, "new-composition") }));
    await assert.rejects(access(join(f.workspace, "new-composition")));
  }));
for (const mode of ["changed", "missing", "symlink-escape"])
  test(`application refuses ${mode} media without publishing a composition`, () =>
    sandbox(async (f) => {
      const path = join(f.workspace, "media/take.mp4");
      if (mode === "changed") await writeFile(path, "changed");
      else {
        await rm(path);
        if (mode === "symlink-escape") await symlink(media, path);
      }
      await assert.rejects(preparePlacement(f));
      await assert.rejects(access(f.output));
    }));
test("actual stream coverage rejects an overlong cut before publication", () =>
  sandbox(async (f) => {
    f.plan.edit.clips[0].sourceInFrame = 1000;
    await assert.rejects(preparePlacement(f), /duration|trim|coverage/i);
    await assert.rejects(access(f.output));
  }));
test("actual CLI previews and explicitly prepares the selected cut", () =>
  sandbox(async (f) => {
    for (const [name, data] of [
      ["import", f.bundle],
      ["review", f.review],
      ["plan", f.plan],
    ])
      await writeFile(join(f.root, name + ".json"), JSON.stringify(data));
    const cli = new URL("./placement-cli.mjs", import.meta.url).pathname,
      args = [
        "--import",
        join(f.root, "import.json"),
        "--review",
        join(f.root, "review.json"),
        "--plan",
        join(f.root, "plan.json"),
      ];
    let p = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
    assert.equal(p.status, 0, p.stderr);
    assert.equal(JSON.parse(p.stdout).provenance.executionAllowed, false);
    await assert.rejects(access(f.output));
    p = spawnSync(
      process.execPath,
      [cli, ...args, "--workspace", f.workspace, "--output", f.output],
      { encoding: "utf8" },
    );
    assert.equal(p.status, 0, p.stderr);
    assert.match(await readFile(join(f.output, "index.html"), "utf8"), /id="reaction"/);
  }));

test("CLI describes binding fields and candidate selections without inventing a cut plan", () =>
  sandbox(async (f) => {
    for (const [name, value] of [
      ["import", f.bundle],
      ["review", f.review],
    ])
      await writeFile(join(f.root, name + ".json"), JSON.stringify(value));
    const p = spawnSync(
      process.execPath,
      [
        new URL("./placement-cli.mjs", import.meta.url).pathname,
        "--import",
        join(f.root, "import.json"),
        "--review",
        join(f.root, "review.json"),
        "--describe",
      ],
      { encoding: "utf8" },
    );
    assert.equal(p.status, 0, p.stderr);
    const described = JSON.parse(p.stdout);
    assert.equal(described.reviewFingerprint, reviewFingerprint(f.review));
    assert.equal(described.expectedReviewRevision, 2);
    assert.equal(described.selections[0].takeId, "T:original");
    assert.equal(described.edit, undefined);
  }));
