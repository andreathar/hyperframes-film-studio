import { describe, expect, test } from "vitest";
import {
  PROMPT_SECTIONS,
  type CapabilitySnapshotV1,
  type CompilationV1,
  type CompileContextV1,
  type FilmReleaseProfileV1,
  type SceneBriefV1,
  type SceneReferenceBindingV1,
} from "../model.js";
import { TABLE_BETWEEN_CENTURIES_KLING_PROFILE } from "../native/releaseProfile.js";
import { canonicalJson, sha256Hex } from "../native/serialize.js";
import { validateNativeCandidate } from "../native/validate.js";
import { compileScene } from "./compile.js";

const HASH = "a".repeat(64);
const ALT_HASH = "b".repeat(64);
const DIGEST = "c".repeat(64);
const TEXT = "Já chega — fica.";
const OPEN_PROFILE: FilmReleaseProfileV1 = { id: "open-fixture", restrictions: [] };

function identityReference(): SceneReferenceBindingV1 {
  return {
    referenceId: "ref-ada",
    sha256: HASH,
    mediaKind: "image",
    subjectId: "ada",
    role: "identity",
    control: "native",
    exclusions: ["Do not change her face."],
  };
}

function wardrobeReference(): SceneReferenceBindingV1 {
  return {
    referenceId: "ref-coat",
    sha256: ALT_HASH,
    mediaKind: "image",
    subjectId: "ada",
    role: "wardrobe",
    control: "prose",
    exclusions: [],
  };
}

function sceneBrief(): SceneBriefV1 {
  return {
    version: 1,
    projectId: "table",
    shotKey: "plan:S1",
    sourceRevisionId: "source-1",
    reviewRevision: 4,
    authoring: { producer: "human", turnId: "turn-1", patternId: "restrained-dialogue" },
    subjects: [{ id: "ada", facts: "The woman already cast for this shot." }],
    references: [identityReference()],
    camera: camera(),
    setting: setting(),
    beats: [beat()],
    dialogue: [line()],
    sound: { strategy: "separate-edit", ambience: "Room tone", sfx: "", music: "" },
    continuity: continuity(),
    output: output(),
  };
}

function camera(): SceneBriefV1["camera"] {
  return {
    framing: "Medium close-up",
    angle: "Eye level",
    lensIntent: "A short lens, prose only",
    focusIntent: "Eyes",
    opening: "She is already looking off-screen left",
    ending: "She is still looking off-screen left",
    path: "Locked",
    screenDirection: "Looks left",
    axis: "Hold the line",
  };
}

function setting(): SceneBriefV1["setting"] {
  return {
    place: "A quiet room",
    lightSources: "Window",
    lightDirection: "From frame left",
    materials: "Wood",
    palette: "Warm shadow",
    atmosphere: "Still",
  };
}

function beat(): SceneBriefV1["beats"][number] {
  return {
    id: "beat1",
    startFrame: 0,
    endFrame: 48,
    subjectMotion: "She finishes the sentence.",
    cameraMotion: "The frame stays put.",
    environmentMotion: "Dust in the window light.",
    observableEnd: "Her mouth is closed.",
  };
}

function line(): SceneBriefV1["dialogue"][number] {
  return {
    speakerId: "ada",
    language: "pt",
    text: TEXT,
    delivery: "Quiet, no smile",
    voiceId: "voice-ada",
    startFrame: 12,
    endFrame: 40,
  };
}

function continuity(): SceneBriefV1["continuity"] {
  return {
    locks: ["Look left"],
    allowedChanges: [],
    exclusions: ["No second person"],
    entryAnchor: "Already seated",
    exitAnchor: "Still seated",
  };
}

function output(): SceneBriefV1["output"] {
  return {
    kind: "video",
    width: 1920,
    height: 1080,
    fps: 24,
    durationFrames: 96,
    routePreference: "kling",
  };
}

function matchingSnapshot(): CapabilitySnapshotV1 {
  return {
    version: 1,
    route: "kling",
    runtimeIdentity: "account-fixture",
    schemaDigest: DIGEST,
    models: [
      {
        id: "account-model",
        durationFrames: [96],
        ratios: ["16:9"],
        resolutions: [{ width: 1920, height: 1080 }],
        counts: [1],
        enums: {},
        slots: [{ name: "identity", mediaKinds: ["image"], required: true }],
        maxReferences: 4,
        unsupportedCombinations: [],
      },
    ],
  };
}

function contextFor(
  brief: SceneBriefV1,
  snapshot: CapabilitySnapshotV1 | null,
  profile: FilmReleaseProfileV1 = TABLE_BETWEEN_CENTURIES_KLING_PROFILE,
): CompileContextV1 {
  return {
    verifiedReferences: brief.references.map((reference) => ({
      referenceId: reference.referenceId,
      sha256: reference.sha256,
      mediaKind: reference.mediaKind,
      role: reference.role,
    })),
    sourceRevisionId: brief.sourceRevisionId,
    reviewRevision: brief.reviewRevision,
    knownVoices: ["voice-ada"],
    snapshot,
    profile,
  };
}

function compileOf(
  brief: SceneBriefV1,
  snapshot: CapabilitySnapshotV1 | null,
  profile: FilmReleaseProfileV1 = TABLE_BETWEEN_CENTURIES_KLING_PROFILE,
): CompilationV1 {
  return compileScene(brief, contextFor(brief, snapshot, profile));
}

function edited(change: (brief: SceneBriefV1) => void): SceneBriefV1 {
  const next = structuredClone(sceneBrief());
  change(next);
  return next;
}

function codes(diagnostics: { code: string }[]): string[] {
  return diagnostics.map((item) => item.code);
}

function argValue(result: CompilationV1, name: string): string | number | boolean | undefined {
  return result.nativeCandidate?.args.find((arg) => arg.name === name)?.value;
}

function sectionBody(prompt: string, title: string): string {
  const marker = `## ${title}\n`;
  const start = prompt.indexOf(marker);
  if (start < 0) return "";
  const rest = prompt.slice(start + marker.length);
  const next = rest.indexOf("\n## ");
  if (next < 0) return rest;
  return rest.slice(0, next);
}

function requireModel(snapshot: CapabilitySnapshotV1) {
  const model = snapshot.models[0];
  if (!model) throw new Error("snapshot model");
  return model;
}

describe("compileScene", () => {
  test("keeps dialogue bytes and labels lens, mood, and path as prose", () => {
    const result = compileOf(sceneBrief(), matchingSnapshot());
    let cursor = -1;
    for (const section of PROMPT_SECTIONS) {
      const index = result.prompt.indexOf(`## ${section.title}`);
      expect(index).toBeGreaterThan(cursor);
      cursor = index;
    }
    expect(sectionBody(result.prompt, "Dialogue and sound").startsWith(`${TEXT}\n`)).toBe(true);
    expect(sectionBody(result.prompt, "Dialogue and sound")).not.toContain(`ada: ${TEXT}`);
    expect(result.prompt).toContain("Lens intent (prose intent):");
    expect(result.prompt).toContain("Path (prose intent): Locked");
    expect(result.prompt).toContain("Mood (prose intent): Still");
    expect(result.prompt).toContain("Native camera control: none");
    expect(result.prompt).toContain("Hold a readable face");
    expect(result.prompt).not.toContain("camera_control");
    const sources = result.nativeCandidate?.args.map((arg) => arg.source) ?? [];
    expect(sources.every((source) => source === "scene")).toBe(true);
    expect(argValue(result, "ratio")).toBe("16:9");
    expect(argValue(result, "resolution")).toBe("1920x1080");
    expect(argValue(result, "count")).toBe(1);
    expect(argValue(result, "durationFrames")).toBe(96);
  });

  test("does not trim exact dialogue text", () => {
    const padded = `  ${TEXT}  `;
    const brief = edited((next) => {
      const spoken = next.dialogue[0];
      if (!spoken) throw new Error("line");
      spoken.text = padded;
    });
    const result = compileOf(brief, matchingSnapshot());
    expect(sectionBody(result.prompt, "Dialogue and sound").startsWith(`${padded}\n`)).toBe(true);
  });

  test("stays non-executable even when native validation passes", () => {
    const brief = sceneBrief();
    const snapshot = matchingSnapshot();
    const compiled = compileOf(brief, snapshot);
    const candidate = compiled.nativeCandidate;
    if (!candidate) throw new Error("missing candidate");
    const validation = validateNativeCandidate(candidate, snapshot, contextFor(brief, snapshot));
    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.executable).toBe(false);
    expect(candidate.executable).toBe(false);
    expect(candidate.model).toBe("account-model");
    expect(validation.executable).toBe(true);
    expect(compiled.sceneSha256).toBe(sha256Hex(canonicalJson(brief)));
    expect(compiled.capabilitySnapshotSha256).toBe(sha256Hex(canonicalJson(snapshot)));
    const { compilationSha256, ...draft } = compiled;
    expect(compilationSha256).toBe(sha256Hex(canonicalJson(draft)));
  });

  test("leaves native parameters unresolved when the snapshot is absent", () => {
    const result = compileOf(sceneBrief(), null);
    expect(result.nativeCandidate?.model).toBeNull();
    expect(result.nativeCandidate?.schemaDigest).toBeNull();
    expect(result.capabilitySnapshotSha256).toBeNull();
    expect(result.executable).toBe(false);
    expect(codes(result.diagnostics)).toEqual(["unresolved-capability"]);
    expect(argValue(result, "durationFrames")).toBe(96);
    expect(result.nativeCandidate?.referenceSlots).toHaveLength(1);
  });

  test("does not guess between snapshot models", () => {
    const snapshot = matchingSnapshot();
    const model = requireModel(snapshot);
    snapshot.models = [
      {
        ...model,
        id: "other-account-model",
        durationFrames: [1],
        ratios: ["1:1"],
        resolutions: [{ width: 100, height: 100 }],
        counts: [2],
      },
      model,
    ];
    const result = compileOf(sceneBrief(), snapshot);
    expect(result.nativeCandidate?.model).toBeNull();
    expect(codes(result.diagnostics)).toEqual(["unresolved-capability"]);
    expect(argValue(result, "durationFrames")).toBe(96);
  });

  test("reports an empty snapshot instead of throwing", () => {
    const snapshot = matchingSnapshot();
    snapshot.models = [];
    const result = compileOf(sceneBrief(), snapshot);
    expect(result.nativeCandidate?.model).toBeNull();
    expect(result.nativeCandidate?.schemaDigest).toBe(DIGEST);
    expect(codes(result.diagnostics)).toEqual(["incomplete-snapshot"]);
  });

  test("reports overlapping beats", () => {
    const brief = edited((next) => {
      const existing = next.beats[0];
      if (!existing) throw new Error("beat");
      next.beats.push({ ...existing, id: "beat2", startFrame: 24, endFrame: 70 });
    });
    expect(codes(compileOf(brief, matchingSnapshot()).diagnostics)).toEqual(["overlapping-beats"]);
  });

  test("allows a later beat to start where the previous beat ends", () => {
    const brief = edited((next) => {
      const existing = next.beats[0];
      if (!existing) throw new Error("beat");
      existing.endFrame = 40;
      next.beats.push({ ...existing, id: "beat2", startFrame: 40, endFrame: 80 });
    });
    expect(codes(compileOf(brief, matchingSnapshot()).diagnostics)).toEqual([]);
  });

  test("reports a locked path that also travels", () => {
    const brief = edited((next) => {
      next.camera.path = "Locked dolly";
    });
    expect(codes(compileOf(brief, matchingSnapshot()).diagnostics)).toEqual([
      "contradictory-camera",
    ]);
  });

  test("allows a travel path that is not locked", () => {
    const brief = edited((next) => {
      next.camera.path = "A slow dolly";
    });
    expect(codes(compileOf(brief, matchingSnapshot()).diagnostics)).toEqual([]);
  });

  test("reports a pattern role missing from verified references", () => {
    const brief = edited((next) => {
      next.authoring.patternId = "prop-hand-insert";
    });
    expect(codes(compileOf(brief, matchingSnapshot()).diagnostics)).toEqual([
      "missing-reference-role",
    ]);
  });

  test("reports an unknown voice without treating an empty voice as unknown", () => {
    const brief = sceneBrief();
    const context = contextFor(brief, matchingSnapshot());
    context.knownVoices = [];
    expect(codes(compileScene(brief, context).diagnostics)).toEqual(["unknown-voice"]);
  });

  test("reports a missing voice required by the pattern", () => {
    const brief = edited((next) => {
      const spoken = next.dialogue[0];
      if (!spoken) throw new Error("line");
      spoken.voiceId = "";
    });
    expect(codes(compileOf(brief, matchingSnapshot()).diagnostics)).toEqual(["missing-voice"]);
  });

  test("reports an unsupported sound strategy", () => {
    const brief = edited((next) => {
      next.sound.strategy = "unsupported";
    });
    const snapshot = matchingSnapshot();
    const result = compileOf(brief, snapshot);
    expect(codes(result.diagnostics)).toEqual(["unsupported-sound"]);
    const candidate = result.nativeCandidate;
    if (!candidate) throw new Error("missing candidate");
    expect(
      validateNativeCandidate(candidate, snapshot, contextFor(brief, snapshot)).executable,
    ).toBe(false);
  });

  test("matches the film profile native-sound limit", () => {
    const brief = edited((next) => {
      next.sound.strategy = "native";
    });
    const snapshot = matchingSnapshot();
    const result = compileOf(brief, snapshot);
    expect(codes(result.diagnostics)).toEqual(["native-sound-limited"]);
    const candidate = result.nativeCandidate;
    if (!candidate) throw new Error("missing candidate");
    expect(
      validateNativeCandidate(candidate, snapshot, contextFor(brief, snapshot)).executable,
    ).toBe(false);
  });

  test("matches the film profile Omni and multishot limit from reference count", () => {
    const brief = edited((next) => {
      next.references.push(wardrobeReference());
    });
    const result = compileOf(brief, null);
    expect(codes(result.diagnostics)).toEqual(["unresolved-capability", "omni-multishot-limited"]);
    expect(result.nativeCandidate?.referenceSlots).toHaveLength(2);
  });

  test("keeps a reference whose hash is not verified", () => {
    const brief = sceneBrief();
    const snapshot = matchingSnapshot();
    const context = contextFor(brief, snapshot);
    const verified = context.verifiedReferences[0];
    if (!verified) throw new Error("reference");
    verified.sha256 = ALT_HASH;
    const result = compileScene(brief, context);
    expect(codes(result.diagnostics)).toContain("reference-hash-mismatch");
    expect(result.nativeCandidate?.referenceSlots[0]?.sha256).toBe(HASH);
    const candidate = result.nativeCandidate;
    if (!candidate) throw new Error("missing candidate");
    expect(validateNativeCandidate(candidate, snapshot, context).executable).toBe(false);
  });

  test("does not clamp output that the selected model rejects", () => {
    const snapshot = matchingSnapshot();
    const model = requireModel(snapshot);
    model.durationFrames = [24];
    model.ratios = ["1:1"];
    model.resolutions = [{ width: 1280, height: 720 }];
    model.counts = [2];
    const result = compileOf(sceneBrief(), snapshot);
    expect(codes(result.diagnostics)).toEqual([
      "duration-mismatch",
      "ratio-mismatch",
      "resolution-mismatch",
      "count-mismatch",
    ]);
    expect(argValue(result, "durationFrames")).toBe(96);
    expect(argValue(result, "ratio")).toBe("16:9");
    expect(argValue(result, "resolution")).toBe("1920x1080");
    expect(argValue(result, "count")).toBe(1);
    expect(result.nativeCandidate?.model).toBe("account-model");
  });

  test("keeps every reference when the combined count exceeds the model cap", () => {
    const brief = edited((next) => {
      next.references.push(wardrobeReference());
    });
    const snapshot = matchingSnapshot();
    const model = requireModel(snapshot);
    model.maxReferences = 1;
    model.slots = [
      { name: "identity", mediaKinds: ["image"], required: true },
      { name: "wardrobe", mediaKinds: ["image"], required: false },
    ];
    const result = compileOf(brief, snapshot, OPEN_PROFILE);
    expect(codes(result.diagnostics)).toEqual(["reference-cap"]);
    expect(result.nativeCandidate?.referenceSlots).toHaveLength(2);
  });

  test("reports two references that claim the same slot alias", () => {
    const brief = edited((next) => {
      next.references.push({ ...identityReference(), referenceId: "ref-ada-2", sha256: ALT_HASH });
    });
    const result = compileOf(brief, matchingSnapshot(), OPEN_PROFILE);
    expect(codes(result.diagnostics)).toEqual(["slot-alias-collision"]);
    expect(result.nativeCandidate?.referenceSlots).toHaveLength(2);
  });

  test("hashes reordered object keys to the same compilation and canonical args", () => {
    const snapshot = matchingSnapshot();
    const original = compileOf(sceneBrief(), snapshot);
    const reordered = compileOf(reorderedBrief(sceneBrief()), snapshot);
    expect(reordered.prompt).toBe(original.prompt);
    expect(reordered.sceneSha256).toBe(original.sceneSha256);
    expect(reordered.compilationSha256).toBe(original.compilationSha256);
    const originalArgs = original.nativeCandidate?.args;
    const reorderedArgs = reordered.nativeCandidate?.args;
    if (!originalArgs || !reorderedArgs) throw new Error("missing args");
    expect(canonicalJson(reorderedArgs)).toBe(canonicalJson(originalArgs));
  });
});

function reorderedBrief(brief: SceneBriefV1): SceneBriefV1 {
  const value = reorderKeys(brief);
  if (!isBrief(value)) throw new Error("reordered brief lost its shape");
  return value;
}

function reorderKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => reorderKeys(item));
  if (!isRecord(value)) return value;
  const reversed: Record<string, unknown> = {};
  for (const key of Object.keys(value).reverse()) reversed[key] = reorderKeys(value[key]);
  return reversed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBrief(value: unknown): value is SceneBriefV1 {
  if (!isRecord(value)) return false;
  return typeof value.shotKey === "string" && Array.isArray(value.dialogue);
}
