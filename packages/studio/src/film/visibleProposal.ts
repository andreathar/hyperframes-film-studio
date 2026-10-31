import { useState } from "react";
import type { SceneBriefV1 } from "@hyperframes/film-production/browser";

export interface ProposalMemory {
  label: string;
  hidden: SceneBriefV1 | null;
}

/**
 * A proposal belongs to the context that was on screen when it arrived.
 * Switching project, shot, or revision hides that object until a different one arrives.
 */
export function resolveVisibleProposal(
  contextLabel: string,
  proposal: SceneBriefV1 | null,
  memory: ProposalMemory,
): { visible: SceneBriefV1 | null; memory: ProposalMemory } {
  if (memory.label !== contextLabel) {
    return { visible: null, memory: { label: contextLabel, hidden: proposal } };
  }
  if (memory.hidden !== null && (proposal === null || proposal === memory.hidden)) {
    return { visible: null, memory };
  }
  return { visible: proposal, memory: { label: contextLabel, hidden: null } };
}

export function useVisibleProposal(
  contextLabel: string,
  proposal: SceneBriefV1 | null,
): SceneBriefV1 | null {
  const [memory, setMemory] = useState<ProposalMemory>({ label: contextLabel, hidden: null });
  const next = resolveVisibleProposal(contextLabel, proposal, memory);
  if (next.memory.label !== memory.label || next.memory.hidden !== memory.hidden)
    setMemory(next.memory);
  return next.visible;
}
