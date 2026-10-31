import { describe, expect, it } from "vitest";
import { choicesForModel } from "./nativeChoices";
import { sceneBrief, snapshot } from "./testFixtures";

function model() {
  const first = snapshot().models[0];
  if (!first) throw new Error("fixture needs a model");
  return first;
}

function choice(key: string) {
  const found = choicesForModel(model(), sceneBrief()).find((item) => item.key === key);
  if (!found) throw new Error(`no choice ${key}`);
  return found;
}

describe("choicesForModel", () => {
  it("offers only the values the snapshot lists", () => {
    const choices = choicesForModel(model(), sceneBrief());
    expect(choices.map((c) => [c.key, c.options.map((o) => o.value)])).toEqual([
      ["duration-frames", ["72", "120"]],
      ["ratio", ["16:9"]],
      ["resolution", ["1280×720"]],
      ["count", ["1"]],
      ["enum-mode", ["fixture-mode"]],
    ]);
  });

  it("does not add the brief's own value when the model lacks it", () => {
    // brief is 96 frames at 1920x1080; neither is in the snapshot
    expect(choice("duration-frames").options.map((o) => o.value)).not.toContain("96");
    expect(choice("duration-frames").selected).toBe("72");
    expect(choice("resolution").selected).toBe("1280×720");
  });

  it("selects the brief's value when the model lists it", () => {
    const wide = { ...model(), durationFrames: [72, 96, 120] };
    const found = choicesForModel(wide, sceneBrief()).find((c) => c.key === "duration-frames");
    expect(found?.selected).toBe("96");
  });

  it("omits a choice whose list is empty", () => {
    const bare = { ...model(), ratios: [], counts: [], enums: {} };
    expect(choicesForModel(bare, null).map((c) => c.key)).toEqual([
      "duration-frames",
      "resolution",
    ]);
  });

  it("gives choices without a brief a first-option selection and no change to apply", () => {
    const choices = choicesForModel(model(), null);
    expect(choices.find((c) => c.key === "duration-frames")?.selected).toBe("72");
    expect(choices.find((c) => c.key === "ratio")?.apply).toBeUndefined();
  });

  it("applies a listed duration and resolution to output only", () => {
    const brief = sceneBrief();
    const duration = choice("duration-frames").apply?.(brief, "120");
    expect(duration).toEqual({ ...brief, output: { ...brief.output, durationFrames: 120 } });
    const resolution = choice("resolution").apply?.(brief, "1280×720");
    expect(resolution).toEqual({ ...brief, output: { ...brief.output, width: 1280, height: 720 } });
  });

  it("rejects an unparseable duration by returning the brief unchanged", () => {
    const brief = sceneBrief();
    const apply = choice("duration-frames").apply;
    for (const bad of ["abc", "7.5", "NaN", "12px"]) {
      expect(apply?.(brief, bad), bad).toBe(brief);
    }
  });

  it("rejects an unparseable resolution by returning the brief unchanged", () => {
    const brief = sceneBrief();
    const apply = choice("resolution").apply;
    for (const bad of [
      "abc",
      "1280",
      "1280×abc",
      "x720",
      "1280×720×24",
      "1280.5×720",
      "1280x720",
    ]) {
      expect(apply?.(brief, bad), bad).toBe(brief);
    }
  });
});
