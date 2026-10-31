import type { CompilationV1 } from "@hyperframes/film-production/browser";
import { describe, expect, it } from "vitest";
import { REFERENCE_ROLE_TERMS } from "./glossary";
import { planSteps, type StepId } from "./steps";
import { sceneBrief, shot } from "./testFixtures";

function compilation(severity: "error" | "warning" | null): CompilationV1 {
  return {
    prompt: "Hold the face.",
    nativeCandidate: null,
    diagnostics:
      severity === null
        ? []
        : [{ code: "malformed", severity, path: "beats.1", message: "Beats overlap." }],
    sceneSha256: "ab",
    compilationSha256: "cd",
    capabilitySnapshotSha256: null,
    executable: false,
  };
}

const ready = {
  shot: shot(),
  brief: sceneBrief(),
  compilation: compilation(null),
  takes: 1,
  placed: true,
};

function state(result: ReturnType<typeof planSteps>, id: StepId) {
  return result.steps.find((step) => step.id === id)?.state;
}

describe("planSteps", () => {
  it("asks for a shot first and holds everything else back", () => {
    const plan = planSteps({ ...ready, shot: null, brief: null, compilation: null });
    expect(plan.next?.step).toBe("shot");
    expect(plan.next?.title).toBe("Next: connect a film project");
    for (const step of plan.steps) {
      expect(step.state).toBe(step.id === "shot" ? "current" : "later");
    }
  });

  it("names a missing reference role in plain words", () => {
    const base = shot();
    const plan = planSteps({
      ...ready,
      shot: { ...base, references: [] },
      brief: { ...sceneBrief(), references: [] },
      compilation: null,
      takes: 0,
      placed: false,
    });
    expect(state(plan, "shot")).toBe("done");
    expect(state(plan, "references")).toBe("current");
    const hint = plan.steps.find((step) => step.id === "references")?.hint ?? "";
    expect(hint).toContain(REFERENCE_ROLE_TERMS.identity.label);
    expect(hint).not.toContain("identity");
    expect(plan.next?.step).toBe("references");
  });

  it("makes the prompt current and quotes the first error", () => {
    const plan = planSteps({
      ...ready,
      compilation: compilation("error"),
      takes: 0,
      placed: false,
    });
    expect(state(plan, "prompt")).toBe("current");
    const prompt = plan.steps.find((step) => step.id === "prompt");
    expect(prompt?.hint).toContain("Beats overlap.");
    expect(plan.steps.find((step) => step.id === "takes")).toMatchObject({
      state: "blocked",
      blockedBy: "prompt",
    });
  });

  it("asks for a prepared prompt when none exists yet", () => {
    const plan = planSteps({ ...ready, compilation: null, takes: 0, placed: false });
    expect(plan.next?.step).toBe("prompt");
  });

  it("does not treat a warning as a blocker", () => {
    const plan = planSteps({
      ...ready,
      compilation: compilation("warning"),
      takes: 0,
      placed: false,
    });
    expect(plan.next?.step).toBe("takes");
  });

  it("asks to place a take once one exists", () => {
    const plan = planSteps({ ...ready, placed: false });
    expect(state(plan, "takes")).toBe("done");
    expect(state(plan, "place")).toBe("current");
    expect(plan.next?.step).toBe("place");
  });

  it("has nothing left to ask when every step is done", () => {
    const plan = planSteps(ready);
    expect(plan.next).toBeNull();
    expect(plan.steps.every((step) => step.state === "done")).toBe(true);
    expect(plan.steps.find((step) => step.id === "place")?.summary).toBe("Ready");
  });

  it("keeps the prompt for later while a role is missing and nothing is compiled", () => {
    const plan = planSteps({
      ...ready,
      shot: { ...shot(), references: [] },
      brief: { ...sceneBrief(), references: [] },
      compilation: null,
      takes: 0,
      placed: false,
    });
    expect(state(plan, "references")).toBe("current");
    expect(state(plan, "prompt")).toBe("later");
  });

  it("asks for a scene pattern first when there is a shot but no brief", () => {
    const plan = planSteps({ ...ready, brief: null, compilation: null, takes: 0, placed: false });
    const references = plan.steps.find((step) => step.id === "references");
    expect(references).toMatchObject({ state: "current", summary: "Not started" });
    expect(references?.hint).toContain("scene pattern");
    expect(state(plan, "direction")).toBe("later");
  });

  it("keeps direction current for an unapplied assistant proposal", () => {
    const plan = planSteps({
      ...ready,
      brief: sceneBrief("A line.", "assistant"),
      compilation: null,
      takes: 0,
      placed: false,
    });
    expect(state(plan, "references")).toBe("done");
    const direction = plan.steps.find((step) => step.id === "direction");
    expect(direction?.state).toBe("current");
    expect(direction?.hint).toMatch(/apply/i);
  });
});
