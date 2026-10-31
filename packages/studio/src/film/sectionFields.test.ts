import type { SceneBriefV1 } from "@hyperframes/film-production/browser";
import { describe, expect, it } from "vitest";
import { sectionFields } from "./sectionFields";
import { sceneBrief, shot } from "./testFixtures";

type SectionId = Parameters<typeof sectionFields>[0];

const SECTION_IDS: readonly SectionId[] = [
  "reference-grounding",
  "opening-composition",
  "timed-action",
  "camera-rhythm",
  "environment-light",
  "dialogue-sound",
  "continuity-exclusions",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Dotted paths of every leaf that differs between two JSON values. Arrays count as one leaf. */
function changedPaths(a: unknown, b: unknown, path = ""): string[] {
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b) ? [] : [path];
  }
  if (isRecord(a) && isRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((key) => changedPaths(a[key], b[key], path ? `${path}.${key}` : key));
  }
  return Object.is(a, b) ? [] : [path];
}

/** Which brief path each editable field is expected to own. */
const OWNER: Record<string, string> = {
  opening: "camera.opening",
  framing: "camera.framing",
  angle: "camera.angle",
  path: "camera.path",
  screen: "camera.screenDirection",
  place: "setting.place",
  "light-direction": "setting.lightDirection",
  atmosphere: "setting.atmosphere",
  ambience: "sound.ambience",
  locks: "continuity.locks",
  exclusions: "continuity.exclusions",
  entry: "continuity.entryAnchor",
  exit: "continuity.exitAnchor",
};

function editable(brief: SceneBriefV1) {
  return SECTION_IDS.flatMap((id) =>
    sectionFields(id, shot(), brief).flatMap((field) =>
      field.write ? [{ id, field, write: field.write }] : [],
    ),
  );
}

describe("sectionFields editing", () => {
  it("covers every editable field this test knows an owner for", () => {
    const keys = editable(sceneBrief()).map((entry) => entry.field.key);
    expect(keys.toSorted()).toEqual(Object.keys(OWNER).toSorted());
  });

  it("each field's write changes only its own brief path", () => {
    const brief = sceneBrief();
    const before = structuredClone(brief);
    for (const { field, write } of editable(brief)) {
      const next = write(brief, "Changed text");
      const owner = OWNER[field.key];
      expect(changedPaths(brief, next), field.key).toEqual([owner]);
      // never mutates the brief it was given
      expect(brief).toEqual(before);
    }
  });

  it("locks and exclusions write one entry per non-empty trimmed line", () => {
    const brief = sceneBrief();
    const locks = sectionFields("continuity-exclusions", shot(), brief).find(
      (f) => f.key === "locks",
    );
    const next = locks?.write?.(brief, "  a  \n\n b\n");
    expect(next?.continuity.locks).toEqual(["a", "b"]);
    expect(next?.continuity.exclusions).toEqual(brief.continuity.exclusions);
  });

  it("dialogue bytes are never editable", () => {
    const fields = sectionFields("dialogue-sound", shot(), sceneBrief());
    const exact = fields.filter((field) => field.exact);
    expect(exact.map((field) => field.key)).toEqual(["shot-dialogue", "brief-line-0"]);
    for (const field of exact) expect(field.write).toBeUndefined();
  });

  it("offers no write without a brief", () => {
    for (const id of SECTION_IDS) {
      for (const field of sectionFields(id, shot(), null)) expect(field.write, id).toBeUndefined();
    }
  });
});
