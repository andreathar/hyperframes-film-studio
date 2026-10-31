import type { SceneBriefV1 } from "@hyperframes/film-production/browser";
import { TextArea } from "../components/ui";
import { headingClass } from "./chrome";
import type { SectionField } from "./sectionFields";

function ExactLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>{label}</span>
      <p className="whitespace-pre-wrap text-panel-text-0">{text}</p>
    </div>
  );
}

function ReadOnlyLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>{label}</span>
      <p className="whitespace-pre-wrap text-panel-text-1">{text}</p>
    </div>
  );
}

function EditableLine({
  label,
  text,
  onCommit,
}: {
  label: string;
  text: string;
  onCommit: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>{label}</span>
      <TextArea
        aria-label={label}
        className="text-step-12"
        rows={2}
        value={text}
        onCommit={onCommit}
      />
    </div>
  );
}

export function FieldControl({
  field,
  brief,
  onBriefChange,
}: {
  field: SectionField;
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  if (field.exact) return <ExactLine label={field.label} text={field.text} />;
  const write = field.write;
  if (!brief || !write) return <ReadOnlyLine label={field.label} text={field.text} />;
  return (
    <EditableLine
      label={field.label}
      text={field.text}
      onCommit={(text) => onBriefChange(write(brief, text))}
    />
  );
}
