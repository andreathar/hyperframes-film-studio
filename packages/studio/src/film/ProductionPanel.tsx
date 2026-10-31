import { memo } from "react";
import {
  scenePattern,
  type SceneBriefV1,
  type ScenePatternId,
  type ScenePatternV1,
} from "@hyperframes/film-production/browser";
import { Button } from "../components/ui";
import { withPattern } from "./briefEdit";
import { Section } from "../components/editor/propertyPanelPrimitives";
import { mutedClass, panelClass } from "./chrome";
import { DiagnosticsList } from "./DiagnosticsList";
import { NativeParameters } from "./NativeParameters";
import { PatternChoice } from "./PatternChoice";
import { usePinnedPattern } from "./patternPin";
import { PromptSections } from "./PromptSections";
import { ReferenceRoles } from "./ReferenceRoles";
import { ShotSummary } from "./ShotSummary";
import type { ProductionPanelProps } from "./types";

function shownPattern(
  picked: ScenePatternId | null,
  brief: SceneBriefV1 | null,
): ScenePatternV1 | null {
  const id = picked ?? brief?.authoring.patternId ?? null;
  if (!id) return null;
  return scenePattern(id);
}

function pickPattern(
  id: ScenePatternId,
  brief: SceneBriefV1 | null,
  pick: (id: ScenePatternId) => void,
  onBriefChange: (brief: SceneBriefV1) => void,
) {
  pick(id);
  if (!brief) return;
  onBriefChange(withPattern(brief, id));
}

function ApplyProposalButton({
  brief,
  onApplyProposal,
}: {
  brief: SceneBriefV1 | null;
  onApplyProposal: (brief: SceneBriefV1) => void;
}) {
  const proposal = brief?.authoring.producer === "assistant" ? brief : null;
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={proposal === null}
      onClick={() => {
        if (proposal) onApplyProposal(proposal);
      }}
    >
      Apply proposal
    </Button>
  );
}

function ProductionActions({
  brief,
  onPrepare,
  onApplyProposal,
}: {
  brief: SceneBriefV1 | null;
  onPrepare: () => void;
  onApplyProposal: (brief: SceneBriefV1) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button type="button" size="sm" variant="primary" onClick={onPrepare}>
        Prepare
      </Button>
      <ApplyProposalButton brief={brief} onApplyProposal={onApplyProposal} />
    </div>
  );
}

export const ProductionPanel = memo(function ProductionPanel({
  shot,
  brief,
  compilation,
  snapshot,
  onBriefChange,
  onApplyProposal,
  onPrepare,
}: ProductionPanelProps) {
  const [picked, pick] = usePinnedPattern(shot.shotKey);
  const pattern = shownPattern(picked, brief);
  return (
    <div className={panelClass} aria-label="Production">
      <h2 className="text-step-12 font-medium text-panel-text-0">Production</h2>
      <ShotSummary shot={shot} />
      <Section title="Reference roles" icon={null}>
        <ReferenceRoles shot={shot} brief={brief} onBriefChange={onBriefChange} />
      </Section>
      <PatternChoice
        pattern={pattern}
        onPick={(id) => pickPattern(id, brief, pick, onBriefChange)}
      />
      <PromptSections
        shot={shot}
        brief={brief}
        prompt={compilation?.prompt ?? null}
        onBriefChange={onBriefChange}
      />
      <DiagnosticsList compilation={compilation} />
      <Section title="Native parameters" icon={null}>
        <p className={mutedClass}>Account controls from the current snapshot.</p>
        <NativeParameters snapshot={snapshot} brief={brief} onBriefChange={onBriefChange} />
      </Section>
      <ProductionActions brief={brief} onPrepare={onPrepare} onApplyProposal={onApplyProposal} />
    </div>
  );
});
