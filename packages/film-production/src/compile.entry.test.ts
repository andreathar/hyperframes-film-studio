import { describe, expect, test } from "vitest";
import {
  TABLE_BETWEEN_CENTURIES_KLING_PROFILE,
  compileScene,
  serializeCanonicalArgs,
} from "./compile.js";
import type { CompileContextV1, SceneBriefV1 } from "./model.js";

describe("compile entry", () => {
  test("stays non-executable and names the film profile limits", () => {
    const compiled = compileScene(emptyBrief(), emptyContext());
    expect(compiled.executable).toBe(false);
    expect(compiled.nativeCandidate?.model).toBeNull();
    expect(compiled.diagnostics.some((item) => item.code === "unresolved-capability")).toBe(true);
    expect(compiled.prompt).toContain("## Reference grounding");
    expect(compiled.prompt.indexOf("## Reference grounding")).toBeLessThan(
      compiled.prompt.indexOf("## Dialogue and sound"),
    );
    expect(TABLE_BETWEEN_CENTURIES_KLING_PROFILE.restrictions.map((item) => item.code)).toEqual([
      "omni-multishot-limited",
      "native-sound-limited",
    ]);
    expect(serializeCanonicalArgs([])).toBe("[]");
  });
});

function emptyBrief(): SceneBriefV1 {
  return {
    version: 1,
    projectId: "table",
    shotKey: "plan:S1",
    sourceRevisionId: "source1",
    reviewRevision: 0,
    authoring: { producer: "human", turnId: "", patternId: null },
    subjects: [],
    references: [],
    camera: {
      framing: "",
      angle: "",
      lensIntent: "",
      focusIntent: "",
      opening: "",
      ending: "",
      path: "",
      screenDirection: "",
      axis: "",
    },
    setting: {
      place: "",
      lightSources: "",
      lightDirection: "",
      materials: "",
      palette: "",
      atmosphere: "",
    },
    beats: [],
    dialogue: [],
    sound: { strategy: "silence", ambience: "", sfx: "", music: "" },
    continuity: {
      locks: [],
      allowedChanges: [],
      exclusions: [],
      entryAnchor: "",
      exitAnchor: "",
    },
    output: {
      kind: "video",
      width: 1920,
      height: 1080,
      fps: 24,
      durationFrames: 24,
      routePreference: "kling",
    },
  };
}

function emptyContext(): CompileContextV1 {
  return {
    verifiedReferences: [],
    sourceRevisionId: "source1",
    reviewRevision: 0,
    knownVoices: [],
    snapshot: null,
    profile: TABLE_BETWEEN_CENTURIES_KLING_PROFILE,
  };
}
