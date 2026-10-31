import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, readFile, mkdir, symlink, access, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { Window } from "happy-dom";
import { validateManifest, compositionHtml } from "./manifest.mjs";
import { prepareProject } from "./prepare.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
function fixture() {
  return {
    version: 1,
    project: { id: "film", title: "A conversation", fps: 24, width: 1920, height: 1080 },
    assets: [{ id: "take", path: "source.mp4", kind: "video", sha256: "a".repeat(64) }],
    shots: [
      {
        id: "shot-1",
        title: "Speech",
        direction: { camera: "Locked", acting: "Pause", dialogue: "Hello" },
      },
    ],
    edit: {
      durationFrames: 24,
      clips: [
        {
          id: "picture",
          shotId: "shot-1",
          takeId: "take-1",
          assetId: "take",
          kind: "video",
          track: 0,
          startFrame: 0,
          durationFrames: 24,
          sourceInFrame: 12,
          rate: 1,
          volume: 0,
        },
        {
          id: "dialogue",
          shotId: "shot-1",
          assetId: "take",
          kind: "audio",
          track: 1,
          startFrame: 0,
          durationFrames: 24,
          sourceInFrame: 0,
          rate: 1,
          volume: 0.8,
        },
      ],
    },
  };
}

test("compilation preserves source trims and independently timed dialogue without video audio doubling", () => {
  const manifest = fixture();
  manifest.project.title = '<script>alert("no")</script>';
  const window = new Window();
  window.document.write(compositionHtml(validateManifest(manifest)));
  const video = window.document.querySelector("#picture");
  const audio = window.document.querySelector("#dialogue");
  assert.ok(video, "picture clip exists");
  assert.equal(video.getAttribute("data-media-start"), "0.5");
  assert.equal(video.getAttribute("data-duration"), "1");
  assert.ok(video.hasAttribute("muted"));
  assert.equal(audio.getAttribute("data-media-start"), "0");
  assert.equal(audio.getAttribute("data-volume"), "0.8");
  assert.equal(window.document.title, manifest.project.title);
  assert.equal(window.document.querySelectorAll("script").length, 0);
  window.close();
});

test("frame-based placement permits an audio L-cut across picture boundaries", () => {
  const m = fixture();
  m.edit.durationFrames = 48;
  m.edit.clips[1].durationFrames = 36;
  m.edit.clips.push({ ...m.edit.clips[0], id: "reaction", startFrame: 24, sourceInFrame: 0 });
  assert.doesNotThrow(() => validateManifest(m));
  const window = new Window();
  window.document.write(compositionHtml(m));
  assert.equal(window.document.querySelector("#dialogue").getAttribute("data-duration"), "1.5");
  assert.equal(window.document.querySelector("#reaction").getAttribute("data-start"), "1");
  window.close();
});

for (const [name, mutate] of [
  [
    "fractional frames",
    (m) => {
      m.edit.clips[0].durationFrames = 23.5;
    },
  ],
  [
    "negative source trim",
    (m) => {
      m.edit.clips[0].sourceInFrame = -1;
    },
  ],
  [
    "non-finite rate",
    (m) => {
      m.edit.clips[0].rate = Infinity;
    },
  ],
  [
    "unknown shot",
    (m) => {
      m.edit.clips[0].shotId = "missing";
    },
  ],
  [
    "duplicate clip ID",
    (m) => {
      m.edit.clips[1].id = "picture";
    },
  ],
  [
    "asset path traversal",
    (m) => {
      m.assets[0].path = "../secret.mp4";
    },
  ],
  [
    "remote source",
    (m) => {
      m.assets[0].path = "https://example.com/media.mp4";
    },
  ],
  [
    "unsupported effect",
    (m) => {
      m.edit.clips[0].effects = ["blur"];
    },
  ],
  [
    "unsupported picture track",
    (m) => {
      m.edit.clips[0].track = 2;
    },
  ],
  [
    "blank picture gap",
    (m) => {
      m.edit.clips[0].startFrame = 1;
      m.edit.clips[0].durationFrames = 23;
    },
  ],
  [
    "picture overlap",
    (m) => {
      m.edit.clips.push({ ...m.edit.clips[0], id: "overlap" });
    },
  ],
  [
    "clip beyond composition",
    (m) => {
      m.edit.clips[1].durationFrames = 25;
    },
  ],
]) {
  test(`rejects ${name} instead of silently dropping it`, () => {
    const m = fixture();
    mutate(m);
    assert.throws(() => validateManifest(m));
  });
}

let scratch;
let media;
const hasFfmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
before(async () => {
  scratch = await mkdtemp(join(tmpdir(), "film-preparation-test-"));
  if (!hasFfmpeg) return;
  const video = join(scratch, "fixture.mp4");
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=s=96x64:r=24:d=2",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=2",
    "-c:v",
    "libx264",
    "-threads",
    "1",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    video,
  ]);
  media = await readFile(video);
});
after(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true });
});

async function inputs(name) {
  const root = join(scratch, name);
  await mkdir(root);
  const manifest = fixture();
  manifest.assets[0].sha256 = digest(media);
  await writeFile(join(root, "source.mp4"), media);
  await writeFile(join(root, "manifest.json"), JSON.stringify(manifest));
  return {
    root,
    manifestPath: join(root, "manifest.json"),
    output: join(root, "composition"),
    manifest,
  };
}

test(
  "preparation copies verified media and preserves direction/take IDs in portable output",
  { skip: !hasFfmpeg },
  async () => {
    const x = await inputs("valid");
    const receipt = await prepareProject(x.manifestPath, x.output);
    const output = JSON.parse(await readFile(join(x.output, "production.json"), "utf8"));
    assert.deepEqual(output.shots, x.manifest.shots);
    assert.equal(output.edit.clips[0].takeId, "take-1");
    assert.equal(output.assets[0].path, "assets/take.mp4");
    assert.equal(digest(await readFile(join(x.output, output.assets[0].path))), digest(media));
    assert.equal(receipt.compositionSha256, digest(await readFile(join(x.output, "index.html"))));
    assert.equal(await readFile(x.manifestPath, "utf8"), JSON.stringify(x.manifest));
    await writeFile(join(x.output, "index.html"), "human edit");
    await assert.rejects(prepareProject(x.manifestPath, x.output), /exist/i);
    assert.equal(await readFile(join(x.output, "index.html"), "utf8"), "human edit");
  },
);

test("hash drift leaves no prepared output", { skip: !hasFfmpeg }, async () => {
  const x = await inputs("hash-drift");
  await writeFile(join(x.root, "source.mp4"), "changed source");
  await assert.rejects(prepareProject(x.manifestPath, x.output), /hash/i);
  await assert.rejects(access(x.output));
});

test("symlink outside the manifest directory is refused", { skip: !hasFfmpeg }, async () => {
  const x = await inputs("symlink");
  await rm(join(x.root, "source.mp4"));
  await symlink(join(scratch, "fixture.mp4"), join(x.root, "source.mp4"));
  await assert.rejects(prepareProject(x.manifestPath, x.output), /outside|escape/i);
  await assert.rejects(access(x.output));
});

test(
  "out-of-range source trim is refused after probing actual media",
  { skip: !hasFfmpeg },
  async () => {
    const x = await inputs("overrun");
    x.manifest.edit.clips[0].sourceInFrame = 47;
    await writeFile(x.manifestPath, JSON.stringify(x.manifest));
    await assert.rejects(prepareProject(x.manifestPath, x.output), /duration|source/i);
    await assert.rejects(access(x.output));
  },
);

test(
  "CLI prepares a project and returns nonzero without overwriting a later edit",
  { skip: !hasFfmpeg },
  async () => {
    const x = await inputs("cli");
    const cli = new URL("./cli.mjs", import.meta.url);
    const run = () =>
      spawnSync(
        process.execPath,
        [cli.pathname, "--manifest", x.manifestPath, "--output", x.output],
        { encoding: "utf8" },
      );
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    assert.equal(JSON.parse(first.stdout).status, "prepared");
    await writeFile(join(x.output, "index.html"), "edited");
    const second = run();
    assert.notEqual(second.status, 0);
    assert.equal(await readFile(join(x.output, "index.html"), "utf8"), "edited");
  },
);

test(
  "a long container cannot certify coverage of a shorter audio stream",
  { skip: !hasFfmpeg },
  async () => {
    const x = await inputs("short-audio");
    const source = join(x.root, "short-audio.mkv");
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-i",
      join(scratch, "fixture.mp4"),
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=0.5",
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      source,
    ]);
    x.manifest.assets[0].path = "short-audio.mkv";
    x.manifest.assets[0].sha256 = digest(await readFile(source));
    await writeFile(x.manifestPath, JSON.stringify(x.manifest));
    await assert.rejects(prepareProject(x.manifestPath, x.output), /duration|coverage/i);
    await assert.rejects(access(x.output));
  },
);
