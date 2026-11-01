import { Section } from "../../components/editor/propertyPanelPrimitives";
import { mutedClass, warnClass } from "../chrome";
import type { TbcIssue, TbcLookState, TbcPromptSegment } from "./types";

const SEVERITY_LABEL: Record<TbcIssue["severity"], string> = {
  error: "Blocks",
  warning: "Check",
  info: "Note",
};

/** tbc issues (checks, proposal issues, apply refusals), errors first. */
export function TbcIssueList({ title, issues }: { title: string; issues: readonly TbcIssue[] }) {
  if (issues.length === 0) {
    return (
      <Section title={title} icon={null}>
        <p className={mutedClass}>No issues.</p>
      </Section>
    );
  }
  const order = { error: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <Section title={title} icon={null}>
      <ul className="flex flex-col gap-1" aria-label={title}>
        {sorted.map((issue, index) => (
          <li
            key={`${issue.code}-${issue.where}-${index}`}
            className={issue.severity === "error" ? warnClass : "text-panel-text-3"}
          >
            <span className="text-panel-text-4">{SEVERITY_LABEL[issue.severity]} </span>
            <span className="font-mono">{issue.code}</span> {issue.message}
            {issue.hint === undefined ? null : <span className={mutedClass}> {issue.hint}</span>}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** The explained Kling prompt: each segment with the preset field it came from. */
export function TbcPromptList({
  title,
  segments,
}: {
  title: string;
  segments: readonly TbcPromptSegment[];
}) {
  return (
    <Section title={title} icon={null}>
      {segments.length === 0 ? (
        <p className={mutedClass}>No prompt yet.</p>
      ) : (
        <ol className="flex flex-col gap-1" aria-label={title}>
          {segments.map((segment, index) => (
            <li key={`${segment.source}-${index}`}>
              <span className="text-panel-text-0">{segment.text}</span>
              <span className={`${mutedClass} font-mono`}> {segment.source}</span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

export const LOOK_STATE_LABEL: Record<TbcLookState, string> = {
  locked: "Locked",
  drift: "Changed since lock",
  incomplete: "Views missing",
  none: "No look yet",
};

export function LookBadge({ state }: { state: TbcLookState }) {
  const tone = state === "locked" ? "text-panel-text-0" : warnClass;
  return (
    <span className={`rounded border border-panel-border px-1 ${tone}`} data-state={state}>
      {LOOK_STATE_LABEL[state]}
    </span>
  );
}
