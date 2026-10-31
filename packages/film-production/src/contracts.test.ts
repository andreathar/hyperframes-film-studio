import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  FilmContractError,
  PROMPT_SECTIONS,
  SCENE_AUTHORING_INSTRUCTIONS,
  parseFilmCommand,
  parseSceneBrief,
  scenePattern,
} from "./contracts.js";

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
    expect(PROMPT_SECTIONS.map((section) => section.title).join("\n")).toContain(
      "Reference grounding",
    );
    expect(scenePattern("restrained-dialogue").requiresVoice).toBe(true);
    expect(SCENE_AUTHORING_INSTRUCTIONS).toContain("Copy dialogue text exactly");
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

  test("browser sources do not import node builtins", () => {
    const root = fileURLToPath(new URL(".", import.meta.url));
    const files = ["browser.ts", "contracts.ts", "model.ts"].map((name) => join(root, name));
    files.push(...walk(join(root, "parse")));
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toContain("node:");
    const bundle = readFileSync(join(root, "../dist/browser.js"), "utf8");
    expect(bundle).not.toContain("node:");
    expect(bundle).not.toContain("child_process");
  });

  test("node resolves the built contracts export", () => {
    const packageDir = fileURLToPath(new URL("..", import.meta.url));
    const consumer = mkdtempSync(join(tmpdir(), "film-contracts-"));
    mkdirSync(join(consumer, "node_modules/@hyperframes"), { recursive: true });
    symlinkSync(packageDir, join(consumer, "node_modules/@hyperframes/film-production"));
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import { PROMPT_SECTIONS, parseSceneBrief } from '@hyperframes/film-production/contracts'; if (PROMPT_SECTIONS.length !== 7 || typeof parseSceneBrief !== 'function') process.exit(2);",
      ],
      { encoding: "utf8", cwd: consumer },
    );
    expect(result.status, result.stderr).toBe(0);
  });
});

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
