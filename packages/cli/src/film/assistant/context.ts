import {
  FilmContractError,
  parseSceneBrief,
  SCENE_AUTHORING_INSTRUCTIONS,
  type AssistantContextV1,
  type DiagnosticV1,
  type SceneBriefV1,
} from "../../../../film-production/src/contracts.js";
import { assistantDiagnostic, redactSecrets } from "./events.js";

const APPROVAL = /["']?approval["']?\s*:|["']?approved["']?\s*:\s*true|\bapproval\b/i;
const PRICE = /["']?price["']?\s*:|\$\s*\d|\b(?:usd|eur)\s*\d/i;
const EXECUTABLE = /["']?executable["']?\s*:\s*true/i;

export interface ModelInterpretation {
  proposal: SceneBriefV1 | null;
  diagnostics: DiagnosticV1[];
}

/** Copy the turn target before the first await so later edits cannot retarget it. */
export function freezeContext(context: AssistantContextV1): AssistantContextV1 {
  return {
    projectId: context.projectId,
    shotKey: context.shotKey,
    compositionPath: context.compositionPath,
    selectionId: context.selectionId,
    playheadFrame: context.playheadFrame,
    projectRevision: context.projectRevision,
    sourceRevisionId: context.sourceRevisionId,
    reviewRevision: context.reviewRevision,
  };
}

export function authoringPrompt(context: AssistantContextV1, instruction: string): string {
  return [
    SCENE_AUTHORING_INSTRUCTIONS,
    "Context:",
    JSON.stringify(context),
    "Instruction:",
    instruction,
  ].join("\n");
}

export function interpretModelOutput(
  stdout: string,
  context: AssistantContextV1,
  extraText = "",
): ModelInterpretation {
  const rejected = rejectForbidden(`${extraText}\n${stdout}`);
  if (rejected) return empty(rejected);
  const parsed = readJson(stdout);
  if (!parsed.ok) return empty(parsed.diagnostic);
  return briefMatchingContext(parsed.value, context);
}

function rejectForbidden(text: string): DiagnosticV1 | null {
  if (APPROVAL.test(text)) {
    return assistantDiagnostic(
      "rejected-proposal",
      "scene",
      "A proposal cannot contain an approval.",
    );
  }
  if (PRICE.test(text)) {
    return assistantDiagnostic("rejected-proposal", "scene", "A proposal cannot contain a price.");
  }
  if (EXECUTABLE.test(text)) {
    return assistantDiagnostic(
      "rejected-proposal",
      "scene",
      "A proposal cannot contain executable:true.",
    );
  }
  return null;
}

function readJson(
  stdout: string,
): { ok: true; value: unknown } | { ok: false; diagnostic: DiagnosticV1 } {
  const text = redactSecrets(stdout);
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, value };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Model output was not JSON.";
    return {
      ok: false,
      diagnostic: assistantDiagnostic("invalid-json", "scene", `${reason} ${text}`),
    };
  }
}

function briefMatchingContext(value: unknown, context: AssistantContextV1): ModelInterpretation {
  try {
    return matchedBrief(parseSceneBrief(value), context);
  } catch (error) {
    return empty(schemaDiagnostic(error));
  }
}

function matchedBrief(brief: SceneBriefV1, context: AssistantContextV1): ModelInterpretation {
  const mismatch = mismatchDiagnostic(brief, context);
  if (mismatch) return empty(mismatch);
  return { proposal: brief, diagnostics: [] };
}

function mismatchDiagnostic(brief: SceneBriefV1, context: AssistantContextV1): DiagnosticV1 | null {
  if (brief.projectId !== context.projectId) {
    return assistantDiagnostic(
      "context-mismatch",
      "scene.projectId",
      "Proposal project does not match the frozen turn.",
    );
  }
  if (brief.shotKey !== context.shotKey) {
    return assistantDiagnostic(
      "context-mismatch",
      "scene.shotKey",
      "Proposal shot does not match the frozen turn.",
    );
  }
  if (
    brief.sourceRevisionId !== context.sourceRevisionId ||
    brief.reviewRevision !== context.reviewRevision
  ) {
    return assistantDiagnostic(
      "context-mismatch",
      "scene.reviewRevision",
      "Proposal revision does not match the frozen turn.",
    );
  }
  return null;
}

function schemaDiagnostic(error: unknown): DiagnosticV1 {
  if (error instanceof FilmContractError) {
    return assistantDiagnostic(error.code, error.fieldPath, error.message);
  }
  const message = error instanceof Error ? error.message : "Scene brief was rejected.";
  return assistantDiagnostic("invalid", "scene", message);
}

function empty(diagnostic: DiagnosticV1): ModelInterpretation {
  return { proposal: null, diagnostics: [diagnostic] };
}
