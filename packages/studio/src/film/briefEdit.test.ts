import {
  parseSceneBrief,
  REFERENCE_ROLES,
  SCENE_PATTERNS,
  SOUND_STRATEGIES,
} from "@hyperframes/film-production/browser";
import { describe, expect, it } from "vitest";
import {
  isReferenceRole,
  isSoundStrategy,
  withPattern,
  withReferenceRole,
  withSoundStrategy,
} from "./briefEdit";
import { sceneBrief } from "./testFixtures";

describe("withPattern", () => {
  it("changes only authoring.patternId and keeps every other field", () => {
    const brief = sceneBrief();
    const other = SCENE_PATTERNS.find((pattern) => pattern.id !== brief.authoring.patternId);
    if (!other) throw new Error("fixture needs a second scene pattern");
    const before = structuredClone(brief);

    const next = withPattern(brief, other.id);

    expect(next).toEqual({
      ...before,
      authoring: { producer: "human", turnId: "turn-1", patternId: other.id },
    });
    // dialogue bytes are untouched, not just equal
    expect(next.dialogue).toBe(brief.dialogue);
    // the input is never mutated
    expect(brief).toEqual(before);
  });
});

describe("withReferenceRole", () => {
  it("emits a brief parseSceneBrief accepts, for every role", () => {
    for (const role of REFERENCE_ROLES) {
      const next = withReferenceRole(sceneBrief(), "ref-face", role);
      expect(next.references[0]?.role).toBe(role);
      expect(parseSceneBrief(next)).toEqual(next);
    }
  });

  it("changes only the matching reference's role", () => {
    const brief = sceneBrief();
    const first = brief.references[0];
    if (!first) throw new Error("fixture needs a reference");
    const second = { ...first, referenceId: "ref-second", role: "wardrobe" as const };
    const two = { ...brief, references: [...brief.references, second] };
    const before = structuredClone(two);

    const next = withReferenceRole(two, "ref-second", "prop");

    expect(next).toEqual({
      ...before,
      references: [before.references[0], { ...second, role: "prop" }],
    });
    expect(two).toEqual(before);
  });

  it("leaves the brief equal when the reference id is unknown", () => {
    const brief = sceneBrief();
    expect(withReferenceRole(brief, "nope", "style")).toEqual(brief);
  });
});

describe("withSoundStrategy", () => {
  it("emits a brief parseSceneBrief accepts, for every strategy", () => {
    for (const strategy of SOUND_STRATEGIES) {
      const next = withSoundStrategy(sceneBrief(), strategy);
      expect(next.sound.strategy).toBe(strategy);
      expect(parseSceneBrief(next)).toEqual(next);
    }
  });

  it("keeps ambience, sfx and music", () => {
    const brief = sceneBrief();
    const next = withSoundStrategy(brief, "silence");
    expect(next.sound).toEqual({ ...brief.sound, strategy: "silence" });
    expect({ ...next, sound: brief.sound }).toEqual(brief);
  });
});

describe("type guards", () => {
  it("accept listed values and reject anything else", () => {
    expect(isReferenceRole("identity")).toBe(true);
    expect(isReferenceRole("Identity")).toBe(false);
    expect(isReferenceRole("")).toBe(false);
    expect(isSoundStrategy("native")).toBe(true);
    expect(isSoundStrategy("loud")).toBe(false);
  });
});
