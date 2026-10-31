import { REFERENCE_ROLES, type SceneBriefV1 } from "@hyperframes/film-production/browser";
import type { SceneReferenceBinding } from "./contractTypes";
import { isReferenceRole, withReferenceRole } from "./briefEdit";
import { headingClass, selectClass } from "./chrome";
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
    <label className="flex flex-col gap-1">
      <span className={headingClass}>Brief role</span>
      <select
        aria-label={`Brief role for ${referenceId}`}
        className={selectClass}
        value={binding.role}
        onChange={(event) => changeRole(brief, referenceId, event.target.value, onBriefChange)}
      >
        {REFERENCE_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </label>
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
      <span className="text-neutral-100">{reference.role}</span>
      <span className="font-mono text-[10px] text-neutral-500">
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
    return <p className="text-neutral-500">No references on this shot.</p>;
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
