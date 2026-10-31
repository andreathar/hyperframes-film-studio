import type { SceneBriefV1 } from "@hyperframes/film-production/browser";
import { headingClass, textAreaClass } from "./chrome";
import type { SectionField } from "./sectionFields";

function ExactLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>{label}</span>
      <p className="whitespace-pre-wrap text-neutral-100">{text}</p>
    </div>
  );
}

function ReadOnlyLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>{label}</span>
      <p className="whitespace-pre-wrap text-neutral-200">{text}</p>
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
    <label className="flex flex-col gap-1">
      <span className={headingClass}>{label}</span>
      <textarea
        aria-label={label}
        className={textAreaClass}
        rows={2}
        value={text}
        onChange={(event) => onCommit(event.target.value)}
      />
    </label>
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
