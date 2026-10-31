import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { FilmContractError, parseFilmCommand, parseSceneBrief } from "./contracts.js";

const dialogue = "Já chega — fica.";

function brief(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    projectId: "table",
    shotKey: "plan:S1",
    sourceRevisionId: "source1",
    reviewRevision: 0,
    authoring: { producer: "assistant", turnId: "turn-1", patternId: "restrained-dialogue" },
    subjects: [{ id: "ada", facts: "The woman already cast for this shot." }],
    references: [
      {
        referenceId: "ref1",
        sha256: "a".repeat(64),
        mediaKind: "image",
        subjectId: "ada",
        role: "identity",
        control: "native",
        exclusions: ["Do not change her face."],
      },
    ],
    camera: {
      framing: "Medium close-up",
      angle: "Eye level",
      lensIntent: "A short lens, prose only",
      focusIntent: "Eyes",
      opening: "She is already looking off-screen left",
      ending: "She is still looking off-screen left",
      path: "Locked",
      screenDirection: "Looks left",
      axis: "Hold the line",
    },
    setting: {
      place: "A quiet room",
      lightSources: "Window",
      lightDirection: "From frame left",
      materials: "Wood",
      palette: "Warm shadow",
      atmosphere: "Still",
    },
    beats: [
      {
        id: "beat1",
        startFrame: 0,
        endFrame: 48,
        subjectMotion: "She finishes the sentence.",
        cameraMotion: "The frame stays put.",
        environmentMotion: "Dust in the window light.",
        observableEnd: "Her mouth is closed.",
      },
    ],
    dialogue: [
      {
        speakerId: "ada",
        language: "pt",
        text: dialogue,
        delivery: "Quiet, no smile",
        voiceId: "",
        startFrame: 12,
        endFrame: 40,
      },
    ],
    sound: { strategy: "separate-edit", ambience: "Room tone", sfx: "", music: "" },
    continuity: {
      locks: ["Look left"],
      allowedChanges: [],
      exclusions: ["No second person"],
      entryAnchor: "Already seated",
      exitAnchor: "Still seated",
    },
    output: {
      kind: "video",
      width: 1920,
      height: 1080,
      fps: 24,
      durationFrames: 96,
      routePreference: "kling",
    },
    ...overrides,
  };
}

describe("scene contracts", () => {
  test("keeps exact dialogue bytes and rejects unknown fields", () => {
    const parsed = parseSceneBrief(brief());
    expect(parsed.dialogue[0]?.text).toBe(dialogue);
    expect(() => parseSceneBrief({ ...brief(), surprise: true })).toThrow(FilmContractError);
  });

  test("rejects overlapping beats and a selected candidate registration", () => {
    const overlapping = brief();
    overlapping.beats = [
      { ...overlapping.beats[0], id: "beat1", startFrame: 0, endFrame: 40 },
      {
        ...overlapping.beats[0],
        id: "beat2",
        startFrame: 20,
        endFrame: 60,
      },
    ];
    expect(() => parseSceneBrief(overlapping)).toThrow(/overlap/);
    expect(() =>
      parseFilmCommand({
        requestId: "req1",
        projectId: "table",
        expectedProjectRevision: 2,
        reason: "Save the assistant proposal",
        action: { type: "save-scene-draft", brief: brief() },
      }),
    ).not.toThrow();
    expect(() =>
      parseFilmCommand({
        requestId: "req2",
        projectId: "table",
        expectedProjectRevision: 2,
        reason: "Try to approve a take",
        action: {
          type: "register-candidate",
          candidate: {
            id: "take1",
            projectId: "table",
            shotKey: "plan:S1",
            attemptId: null,
            jobId: null,
            kind: "video",
            sha256: "b".repeat(64),
            mediaPath: "takes/take1.mp4",
            width: 1920,
            height: 1080,
            fps: 24,
            durationFrames: 96,
            imageMetadata: null,
            firstFrameSha256: null,
            selected: true,
            accepted: false,
            provenance: { route: "owned-media", receiptId: null, originalOutputId: "" },
          },
        },
      }),
    ).toThrow(/cannot select/);
  });

  test("built browser bundle parses scene briefs without node builtins", async () => {
    const bundleUrl = new URL("../dist/browser.js", import.meta.url);
    const bundle = readFileSync(bundleUrl, "utf8");
    expect(bundle).not.toContain("node:");
    expect(bundle).not.toContain("child_process");
    const { parseSceneBrief: parseBuiltBrief } = await import(bundleUrl.href);
    expect(parseBuiltBrief(brief()).dialogue[0]?.text).toBe(dialogue);
  });

  test("node resolves the built contracts export", () => {
    const packageDir = fileURLToPath(new URL("..", import.meta.url));
    const consumer = mkdtempSync(join(tmpdir(), "film-contracts-"));
    try {
      mkdirSync(join(consumer, "node_modules/@hyperframes"), { recursive: true });
      symlinkSync(packageDir, join(consumer, "node_modules/@hyperframes/film-production"));
      const result = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `import assert from 'node:assert/strict';
          import { FilmContractError, parseSceneBrief } from '@hyperframes/film-production/contracts';
          const input = JSON.parse(process.argv[1]);
          assert.equal(parseSceneBrief(input).dialogue[0].text, 'Já chega — fica.');
          assert.throws(() => parseSceneBrief({ ...input, surprise: true }), FilmContractError);`,
          JSON.stringify(brief()),
        ],
        { encoding: "utf8", cwd: consumer },
      );
      expect(result.status, result.stderr).toBe(0);
    } finally {
      rmSync(consumer, { recursive: true, force: true });
    }
  });
});
