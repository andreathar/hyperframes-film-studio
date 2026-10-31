import { memo, useMemo } from "react";
import {
  scenePattern,
  type SceneBriefV1,
  type ScenePatternId,
  type ScenePatternV1,
} from "@hyperframes/film-production/browser";
import { Button } from "../components/ui";
import { withPattern } from "./briefEdit";
import { headingClass, mutedClass, panelClass } from "./chrome";
import { DiagnosticsList } from "./DiagnosticsList";
import { NativeParameters } from "./NativeParameters";
import { unappliedProposal } from "./proposal";
import { PatternChoice } from "./PatternChoice";
import { usePinnedPattern } from "./patternPin";
import { PromptSections } from "./PromptSections";
import { ReferenceRoles } from "./ReferenceRoles";
import { ShotSummary } from "./ShotSummary";
import { NextStep } from "./NextStep";
import { StepSection } from "./StepSection";
import { planSteps, type StepId, type StepView } from "./steps";
import { DISCONNECTED_SHOT_KEY, type ProductionPanelProps } from "./types";

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

function ProductionActions({
  brief,
  onPrepare,
  onApplyProposal,
}: {
  brief: SceneBriefV1 | null;
  onPrepare: () => void;
  onApplyProposal: (brief: SceneBriefV1) => void;
}) {
  const proposal = unappliedProposal(brief);
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Production actions">
      <Button type="button" size="sm" variant="secondary" onClick={onPrepare}>
        Prepare
      </Button>
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
  takes = 0,
  placed = false,
  onNextStep,
}: ProductionPanelProps) {
  const [picked, pick] = usePinnedPattern(shot.shotKey);
  const pattern = shownPattern(picked, brief);
  const connected = shot.shotKey !== DISCONNECTED_SHOT_KEY;
  const { steps, next } = useMemo(
    () => planSteps({ shot: connected ? shot : null, brief, compilation, takes, placed }),
    [connected, shot, brief, compilation, takes, placed],
  );
  const step = (id: StepId): StepView => {
    const found = steps.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`missing step ${id}`);
    return found;
  };
  return (
    <div className={panelClass} aria-label="Production">
      <h2 className="text-step-12 font-medium text-panel-text-0">Production</h2>
      {next && <NextStep next={next} onAct={() => onNextStep?.(next.step)} />}
      <ProductionActions brief={brief} onPrepare={onPrepare} onApplyProposal={onApplyProposal} />
      <ShotSummary shot={shot} />
      <StepSection step={step("shot")} />
      <StepSection step={step("references")}>
        <div className="flex flex-col gap-2">
          <h4 className={headingClass}>Reference roles</h4>
          <ReferenceRoles shot={shot} brief={brief} onBriefChange={onBriefChange} />
        </div>
        <PatternChoice
          pattern={pattern}
          onPick={(id) => pickPattern(id, brief, pick, onBriefChange)}
        />
      </StepSection>
      <StepSection step={step("direction")}>
        <PromptSections
          shot={shot}
          brief={brief}
          prompt={compilation?.prompt ?? null}
          onBriefChange={onBriefChange}
        />
      </StepSection>
      <StepSection step={step("prompt")}>
        <DiagnosticsList compilation={compilation} />
        <div className="flex flex-col gap-2">
          <h4 className={headingClass}>Native parameters</h4>
          <p className={mutedClass}>Account controls from the current snapshot.</p>
          <NativeParameters snapshot={snapshot} brief={brief} onBriefChange={onBriefChange} />
        </div>
      </StepSection>
      <StepSection step={step("takes")} />
      <StepSection step={step("place")} />
    </div>
  );
});
