import { memo } from "react";
import type { DialogueLineV1, SceneBriefV1 } from "@hyperframes/film-production/browser";
import { Button, TextArea } from "../components/ui";
import { BlockedButton } from "./BlockedButton";
import { assistantReasons, type AssistantReasons } from "./actionReasons";
import { headingClass, mutedClass, panelClass } from "./chrome";
import { READINESS_TERMS } from "./glossary";
import type { AssistantPanelProps, AssistantReadinessView } from "./types";
import { useVisibleProposal } from "./visibleProposal";

function ReadinessLine({ readiness }: { readiness: AssistantReadinessView }) {
  const term = READINESS_TERMS[readiness.state];
  return (
    <p>
      <span className="text-panel-text-4">Readiness </span>
      <span className="text-panel-text-0">{term.label}</span>
      <span className="text-panel-text-3"> {readiness.evidence}</span>
      <span className={mutedClass}> {term.hint}</span>
    </p>
  );
}

function InstructionField({
  value,
  onInstructionChange,
}: {
  value: string;
  onInstructionChange: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>Instruction</span>
      <TextArea
        aria-label="Instruction"
        className="text-step-12"
        rows={4}
        value={value}
        onDraft={onInstructionChange}
        onCommit={onInstructionChange}
      />
    </div>
  );
}

function AssistantActions({
  reasons,
  onSend,
  onCancel,
  onCopyHandoff,
  onApply,
}: {
  reasons: AssistantReasons;
  onSend: () => void;
  onCancel: () => void;
  onCopyHandoff: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <BlockedButton
        type="button"
        size="sm"
        variant="primary"
        reason={reasons.send}
        onClick={onSend}
      >
        Send
      </BlockedButton>
      <Button type="button" size="sm" variant="ghost" className="text-step-12" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-step-12"
        onClick={onCopyHandoff}
      >
        Copy handoff
      </Button>
      <BlockedButton
        type="button"
        size="sm"
        variant="secondary"
        reason={reasons.apply}
        onClick={onApply}
      >
        Apply
      </BlockedButton>
    </div>
  );
}

function ProposalLine({ line }: { line: DialogueLineV1 }) {
  return (
    <li>
      <span className="text-panel-text-4">{line.speakerId} </span>
      <span data-proposal-dialogue className="whitespace-pre-wrap text-panel-text-0">
        {line.text}
      </span>
    </li>
  );
}

function ProposalLines({ proposal }: { proposal: SceneBriefV1 | null }) {
  if (!proposal || proposal.dialogue.length === 0) {
    return <p className={mutedClass}>No proposal for this context.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {proposal.dialogue.map((line, index) => (
        <ProposalLine key={`${index}:${line.speakerId}`} line={line} />
      ))}
    </ul>
  );
}

function DialogueCompare({
  proposal,
  shotDialogue,
}: {
  proposal: SceneBriefV1 | null;
  shotDialogue: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="min-w-0">
        <h3 className={headingClass}>Shot dialogue</h3>
        <p data-current-dialogue className="wrap-break-word whitespace-pre-wrap text-panel-text-0">
          {shotDialogue}
        </p>
      </div>
      <div className="min-w-0">
        <h3 className={headingClass}>Proposal dialogue</h3>
        <ProposalLines proposal={proposal} />
      </div>
    </div>
  );
}

export const AssistantPanel = memo(function AssistantPanel({
  contextLabel,
  readiness,
  proposal,
  shotDialogue = "",
  draftInstruction,
  onInstructionChange,
  onSend,
  onApply,
  onCancel,
  onCopyHandoff,
}: AssistantPanelProps) {
  const visible = useVisibleProposal(contextLabel, proposal);
  return (
    <div className={panelClass} aria-label="Assistant">
      <h2 className="text-step-12 font-medium text-panel-text-0">Assistant</h2>
      <p className="text-panel-text-0">{contextLabel}</p>
      <ReadinessLine readiness={readiness} />
      <InstructionField value={draftInstruction} onInstructionChange={onInstructionChange} />
      <AssistantActions
        reasons={assistantReasons({ readiness, hasProposal: visible !== null })}
        onSend={onSend}
        onCancel={onCancel}
        onCopyHandoff={onCopyHandoff}
        onApply={onApply}
      />
      <DialogueCompare proposal={visible} shotDialogue={shotDialogue} />
    </div>
  );
});
