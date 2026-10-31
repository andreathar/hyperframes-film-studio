import {
  scenePattern,
  type CompilationV1,
  type DiagnosticV1,
  type ReferenceRole,
  type SceneBriefV1,
} from "@hyperframes/film-production/browser";
import { productionReasons } from "./actionReasons";
import { unappliedProposal } from "./proposal";
import {
  NEXT_ACTION_TERMS,
  PATTERN_FIRST_HINT,
  PROPOSAL_HINT,
  REFERENCE_ROLE_TERMS,
  STEP_TERMS,
} from "./glossary";
import type { ProductionShot } from "./types";

export type StepId = "shot" | "references" | "direction" | "prompt" | "takes" | "place";
export type StepState = "done" | "current" | "later" | "blocked";

export interface StepView {
  id: StepId;
  state: StepState;
  summary: string;
  hint: string;
  blockedBy: StepId | null;
}

export interface NextAction {
  step: StepId;
  title: string;
  hint: string;
  actionLabel: string;
  /** Why the action cannot run now, or null when it can. */
  reason: string | null;
}

export interface StepInput {
  shot: ProductionShot | null;
  brief: SceneBriefV1 | null;
  compilation: CompilationV1 | null;
  takes: number;
  placed: boolean;
}

const STEP_ORDER: readonly StepId[] = [
  "shot",
  "references",
  "direction",
  "prompt",
  "takes",
  "place",
];

interface Check {
  done: boolean;
  summary: string;
  /** Replaces the glossary hint while this step is the current one. */
  hint?: string;
}

function missingRoles(shot: ProductionShot, brief: SceneBriefV1 | null): ReferenceRole[] {
  const patternId = brief?.authoring.patternId ?? null;
  if (!patternId) return [];
  const have = new Set<ReferenceRole>([
    ...shot.references.map((reference) => reference.role),
    ...(brief?.references.map((reference) => reference.role) ?? []),
  ]);
  return scenePattern(patternId).requiredReferenceRoles.filter((role) => !have.has(role));
}

function firstError(compilation: CompilationV1 | null): DiagnosticV1 | null {
  return compilation?.diagnostics.find((diagnostic) => diagnostic.severity === "error") ?? null;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function referencesCheck(input: StepInput): Check {
  if (input.brief === null) {
    return { done: false, summary: "Not started", hint: PATTERN_FIRST_HINT };
  }
  const missing = input.shot ? missingRoles(input.shot, input.brief) : [];
  const labels = missing.map((role) => REFERENCE_ROLE_TERMS[role].label).join(", ");
  if (missing.length === 0) {
    return {
      done: true,
      summary: count(input.shot?.references.length ?? 0, "picture", "pictures"),
    };
  }
  return { done: false, summary: `Missing: ${labels}`, hint: `Still needed: ${labels}.` };
}

function directionCheck(brief: SceneBriefV1 | null): Check {
  if (brief === null) return { done: false, summary: "Not started" };
  if (unappliedProposal(brief)) {
    return { done: false, summary: "Proposal waiting", hint: PROPOSAL_HINT };
  }
  return { done: true, summary: "Written" };
}

function promptCheck(compilation: CompilationV1 | null): Check {
  const error = firstError(compilation);
  if (error) {
    return { done: false, summary: "Needs a fix", hint: `Fix this first: ${error.message}` };
  }
  return compilation
    ? { done: true, summary: "Prepared" }
    : { done: false, summary: "Not prepared" };
}

function checks(input: StepInput): Record<StepId, Check> {
  const { shot, brief, takes, placed } = input;
  return {
    shot: { done: shot !== null, summary: shot?.title ?? "Not connected" },
    references: referencesCheck(input),
    direction: directionCheck(brief),
    prompt: promptCheck(input.compilation),
    takes: { done: takes > 0, summary: takes > 0 ? count(takes, "take", "takes") : "None yet" },
    place: { done: placed, summary: placed ? "Ready" : "Not placed" },
  };
}

/** Which step the director should do now, derived from what exists. Pure. */
export function planSteps(input: StepInput): { steps: StepView[]; next: NextAction | null } {
  const byId = checks(input);
  const currentId = STEP_ORDER.find((id) => !byId[id].done) ?? null;
  const promptBlocks = currentId === "prompt" && firstError(input.compilation) !== null;
  const steps = STEP_ORDER.map((id): StepView => {
    const check = byId[id];
    const hint = id === currentId && check.hint ? check.hint : STEP_TERMS[id].hint;
    // Steps after the current one wait their turn, even if their own data exists.
    const reached = currentId === null || STEP_ORDER.indexOf(id) < STEP_ORDER.indexOf(currentId);
    if (check.done && reached)
      return { id, state: "done", summary: check.summary, hint, blockedBy: null };
    if (id === currentId) {
      return { id, state: "current", summary: check.summary, hint, blockedBy: null };
    }
    if (promptBlocks && id === "takes") {
      return { id, state: "blocked", summary: check.summary, hint, blockedBy: "prompt" };
    }
    return { id, state: "later", summary: check.summary, hint, blockedBy: null };
  });
  const current = steps.find((step) => step.state === "current");
  const next: NextAction | null = current
    ? {
        step: current.id,
        title: `Next: ${lowerFirst(NEXT_ACTION_TERMS[current.id])}`,
        hint: current.hint,
        actionLabel: NEXT_ACTION_TERMS[current.id],
        reason: productionReasons({ connected: input.shot !== null, hasProposal: false }).prepare,
      }
    : null;
  return { steps, next };
}
