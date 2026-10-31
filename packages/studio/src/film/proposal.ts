import type { SceneBriefV1 } from "@hyperframes/film-production/browser";

/** An assistant-written brief that the maker has not applied yet. Editing its fields does not change the author. */
export function unappliedProposal(brief: SceneBriefV1 | null): SceneBriefV1 | null {
  return brief?.authoring.producer === "assistant" ? brief : null;
}
