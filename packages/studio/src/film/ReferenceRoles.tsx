import { REFERENCE_ROLES, type SceneBriefV1 } from "@hyperframes/film-production/browser";
import type { SceneReferenceBinding } from "./contractTypes";
import { isReferenceRole, withReferenceRole } from "./briefEdit";
import { Select } from "../components/ui";
import { headingClass, mutedClass } from "./chrome";
import { REFERENCE_ROLE_TERMS } from "./glossary";
import type { ProductionShot } from "./types";

function changeRole(
  brief: SceneBriefV1,
  referenceId: string,
  value: string,
  onBriefChange: (brief: SceneBriefV1) => void,
) {
  if (!isReferenceRole(value)) return;
  onBriefChange(withReferenceRole(brief, referenceId, value));
}

const ROLE_OPTIONS = REFERENCE_ROLES.map((role) => ({
  value: role,
  label: REFERENCE_ROLE_TERMS[role].label,
}));

function RoleSelect({
  brief,
  binding,
  referenceId,
  onBriefChange,
}: {
  brief: SceneBriefV1 | null;
  binding: SceneReferenceBinding | null;
  referenceId: string;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  if (!brief || !binding) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>Brief role</span>
      <Select
        label={`Brief role for ${referenceId}`}
        value={binding.role}
        options={ROLE_OPTIONS}
        className="text-step-12"
        itemClassName="text-step-12"
        onCommit={(value) => changeRole(brief, referenceId, value, onBriefChange)}
      />
      <span className={mutedClass}>{REFERENCE_ROLE_TERMS[binding.role].hint}</span>
    </div>
  );
}

function ReferenceRow({
  reference,
  brief,
  onBriefChange,
}: {
  reference: ProductionShot["references"][number];
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  const binding = brief?.references.find((item) => item.referenceId === reference.id) ?? null;
  return (
    <li className="flex flex-col gap-1">
      <span className="text-panel-text-0">{reference.role}</span>
      <span className="font-mono text-step-12 text-panel-text-4">
        {reference.mediaKind} · {reference.id}
      </span>
      <RoleSelect
        brief={brief}
        binding={binding}
        referenceId={reference.id}
        onBriefChange={onBriefChange}
      />
    </li>
  );
}

export function ReferenceRoles({
  shot,
  brief,
  onBriefChange,
}: {
  shot: ProductionShot;
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  if (shot.references.length === 0) {
    return <p className={mutedClass}>No references on this shot.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {shot.references.map((reference) => (
        <ReferenceRow
          key={reference.id}
          reference={reference}
          brief={brief}
          onBriefChange={onBriefChange}
        />
      ))}
    </ul>
  );
}
