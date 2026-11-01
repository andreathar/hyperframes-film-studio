import { memo } from "react";
import { Button, TextArea } from "../../components/ui";
import { BlockedButton } from "../BlockedButton";
import { headingClass, mutedClass, panelClass, warnClass } from "../chrome";
import { TbcIssueList, TbcPromptList } from "./TbcParts";
import type { TbcCheckedProposal, TbcProposal, TbcTurnV1 } from "./types";
import type { TbcAssistantProps } from "./useTbcSession";

/** Why Send cannot run, or null. */
export function sendReasonOf(props: {
  available: boolean;
  unavailableReason: string | null;
  hasContext: boolean;
  instruction: string;
  turn: TbcTurnV1 | null;
}): string | null {
  if (!props.available) {
    return props.unavailableReason ?? "The assistant is off in this tbc serve.";
  }
  if (!props.hasContext) return "Pick a shot first.";
  if (props.turn?.state === "running") return "Wait for this reply, or cancel it.";
  if (props.instruction.trim() === "") return "Write an instruction first.";
  return null;
}

/** Why Apply cannot run for one proposal, or null. */
export function applyReasonOf(
  checked: TbcCheckedProposal,
  index: number,
  props: Pick<TbcAssistantProps, "staleReason" | "applying" | "applied" | "turn">,
): string | null {
  if (checked.proposal.kind === "note") return "A note has nothing to apply.";
  if (checked.proposal.kind === "batch-draft") {
    return "Batches are drafted with tbc batch, never from here.";
  }
  if (props.turn?.state === "running") return "Wait for the reply to finish.";
  if (props.staleReason !== null) return props.staleReason;
  if (props.applied.includes(index)) return "Applied.";
  if (!checked.applicable) return "Its checks block it; see the issues.";
  if (props.applying !== null) return "Applying another proposal.";
  return null;
}

function replyText(turn: TbcTurnV1): string {
  if (turn.reply !== undefined) return turn.reply;
  return turn.events.map((event) => (event.kind === "delta" ? event.text : "")).join("");
}

function statusText(turn: TbcTurnV1): string {
  if (turn.state === "done") return "Done.";
  if (turn.state === "cancelled") return "Cancelled.";
  if (turn.state === "error") return turn.error ?? "The assistant failed.";
  const last = [...turn.events].reverse().find((event) => event.kind === "status");
  return last?.kind === "status" ? last.text : "Thinking…";
}

function ProposalBody({ proposal }: { proposal: TbcProposal }) {
  switch (proposal.kind) {
    case "preset-edit":
      return (
        <div className="flex flex-col gap-1">
          <p>
            <span className="text-panel-text-4">Edit </span>
            <span className="font-mono text-panel-text-0">
              {proposal.preset}#{proposal.field}
            </span>
          </p>
          <p aria-label="Before">
            <span className="text-panel-text-4">Before </span>
            <del className="text-panel-text-3">
              {proposal.from === "" ? "(empty)" : proposal.from}
            </del>
          </p>
          <p aria-label="After">
            <span className="text-panel-text-4">After </span>
            <ins className="text-panel-text-0 no-underline">
              {proposal.to === "" ? "(removed)" : proposal.to}
            </ins>
          </p>
          <p className={mutedClass}>{proposal.why}</p>
        </div>
      );
    case "look-draft":
      return (
        <div className="flex flex-col gap-1">
          <p>
            <span className="text-panel-text-4">Draft </span>
            <span className="text-panel-text-0">
              {proposal.count} × {proposal.entity} {proposal.view}
            </span>
            <span className={mutedClass}> on local ComfyUI, free; nothing is locked.</span>
          </p>
          <p className={mutedClass}>{proposal.why}</p>
        </div>
      );
    case "batch-draft":
      return (
        <div className="flex flex-col gap-1">
          <p>
            <span className="text-panel-text-4">Batch </span>
            <span className="text-panel-text-0">chapter {proposal.chapter}</span>
            <span className={mutedClass}>
              {" "}
              — run tbc batch to estimate it; spending needs Andre's approval id.
            </span>
          </p>
          <p className={mutedClass}>{proposal.why}</p>
        </div>
      );
    case "note":
      return <p className="text-panel-text-0">{proposal.text}</p>;
  }
}

const KIND_LABEL: Record<TbcProposal["kind"], string> = {
  "preset-edit": "Preset edit",
  "look-draft": "Look draft",
  "batch-draft": "Batch draft",
  note: "Note",
};

function ProposalCard({
  checked,
  index,
  props,
}: {
  checked: TbcCheckedProposal;
  index: number;
  props: TbcAssistantProps;
}) {
  const outcome = props.outcome?.index === index ? props.outcome : null;
  const label = `Proposal ${index + 1}: ${KIND_LABEL[checked.proposal.kind]}`;
  return (
    <li
      className="flex flex-col gap-1.5 rounded border border-panel-border p-2"
      aria-label={label}
      data-kind={checked.proposal.kind}
    >
      <span className={headingClass}>{label}</span>
      <ProposalBody proposal={checked.proposal} />
      {checked.issues.length === 0 ? null : (
        <TbcIssueList title={`Issues for proposal ${index + 1}`} issues={checked.issues} />
      )}
      {checked.preview === undefined ? null : (
        <TbcPromptList
          title={`Prompt after proposal ${index + 1}`}
          segments={checked.preview.prompt}
        />
      )}
      <BlockedButton
        type="button"
        size="sm"
        variant="secondary"
        reason={applyReasonOf(checked, index, props)}
        onClick={() => props.onApply(index)}
      >
        {props.applying === index ? "Applying…" : "Apply"}
      </BlockedButton>
      {outcome === null ? null : (
        <div role="status">
          <p className={outcome.ok ? "text-panel-text-0" : warnClass}>{outcome.message}</p>
          {outcome.issues.length === 0 ? null : (
            <TbcIssueList title="Why it was refused" issues={outcome.issues} />
          )}
        </div>
      )}
    </li>
  );
}

function TurnView({ props }: { props: TbcAssistantProps }) {
  const { turn } = props;
  if (turn === null) return null;
  return (
    <div className="flex flex-col gap-2" aria-label="Reply">
      <p className={mutedClass} aria-live="polite">
        {turn.shotId} · {statusText(turn)}
      </p>
      <p className="whitespace-pre-wrap text-panel-text-0">{replyText(turn)}</p>
      {props.staleReason === null ? null : (
        <p className={warnClass} role="note">
          Read-only draft. {props.staleReason}
        </p>
      )}
      {turn.proposals.length === 0 ? null : (
        <ol className="flex flex-col gap-2" aria-label="Proposals">
          {turn.proposals.map((checked, index) => (
            <ProposalCard key={index} checked={checked} index={index} props={props} />
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * The Assistant panel when `tbc serve` answers. The assistant only proposes; Andre applies one
 * proposal at a time, and only while the shot is still the one the reply was written for.
 */
export const TbcAssistantPanel = memo(function TbcAssistantPanel(props: TbcAssistantProps) {
  const running = props.turn?.state === "running";
  return (
    <div className={panelClass} aria-label="Assistant">
      <h2 className="text-step-12 font-medium text-panel-text-0">Assistant</h2>
      <p>
        <span className="text-panel-text-4">Readiness </span>
        <span className="text-panel-text-0">{props.available ? "Ready" : "Unavailable"}</span>
        <span className="text-panel-text-3">
          {" "}
          {props.available
            ? "Claude Code (signed in) on tbc serve. It proposes; you apply."
            : (props.unavailableReason ?? "tbc serve runs without the assistant.")}
        </span>
      </p>
      <p className={mutedClass}>{props.contextLabel}</p>
      <div className="flex flex-col gap-1">
        <span className={headingClass}>Instruction</span>
        <TextArea
          aria-label="Instruction"
          className="text-step-12"
          rows={4}
          value={props.instruction}
          onDraft={props.onInstructionChange}
          onCommit={props.onInstructionChange}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <BlockedButton
          type="button"
          size="sm"
          variant="primary"
          reason={sendReasonOf(props)}
          onClick={props.onSend}
        >
          Send
        </BlockedButton>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-step-12"
          onClick={props.onCancel}
        >
          {running ? "Cancel reply" : "Clear"}
        </Button>
      </div>
      {props.sendError === null ? null : (
        <p className={warnClass} role="alert">
          {props.sendError}
        </p>
      )}
      <TurnView props={props} />
    </div>
  );
});
