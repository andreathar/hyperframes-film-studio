import { BLOCKED_TERMS, READINESS_TERMS } from "./glossary";
import type { AssistantReadinessView } from "./types";

/** Why each Production action cannot run now, or null when it can. */
export interface ProductionReasons {
  prepare: string | null;
  applyProposal: string | null;
}

export function productionReasons(input: {
  connected: boolean;
  hasProposal: boolean;
}): ProductionReasons {
  return {
    prepare: input.connected ? null : BLOCKED_TERMS.noProject,
    applyProposal: input.hasProposal ? null : BLOCKED_TERMS.noProposal,
  };
}

/** Why each Assistant action cannot run now, or null when it can. */
export interface AssistantReasons {
  send: string | null;
  apply: string | null;
}

export function assistantReasons(input: {
  readiness: AssistantReadinessView;
  hasProposal: boolean;
}): AssistantReasons {
  return {
    send: sendReason(input.readiness),
    apply: input.hasProposal ? null : BLOCKED_TERMS.noProposal,
  };
}

/** `limited` still lets the assistant help (READINESS_TERMS.limited), so only states with a recovery action block. */
export function sendReason(readiness: AssistantReadinessView): string | null {
  if (readiness.state === "ready" || readiness.state === "limited") return null;
  const term = READINESS_TERMS[readiness.state];
  return `${term.label}. ${term.action ?? term.hint}`;
}
