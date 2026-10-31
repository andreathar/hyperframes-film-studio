import type { CapabilitySnapshotV1, SceneBriefV1 } from "@hyperframes/film-production/browser";
import type { AccountModel } from "./contractTypes";
import { Select } from "../components/ui";
import { headingClass, mutedClass } from "./chrome";
import { choicesForModel, type NativeChoice } from "./nativeChoices";

export function ChoiceSelect({
  modelId,
  choice,
  brief,
  onBriefChange,
}: {
  modelId: string;
  choice: NativeChoice;
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  const options = choice.options.map((opt) => ({
    value: opt.value,
    label: opt.disabled && opt.reason ? `${opt.label} (${opt.reason})` : opt.label,
    disabled: opt.disabled,
  }));
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>{choice.label}</span>
      <Select
        label={`${modelId} ${choice.label}`}
        value={choice.selected}
        options={options}
        className="text-step-12"
        itemClassName="text-step-12"
        onCommit={(value) => {
          const apply = choice.apply;
          if (!brief || !apply) return;
          onBriefChange(apply(brief, value));
        }}
      />
    </div>
  );
}

function SlotList({ model }: { model: AccountModel }) {
  if (model.slots.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-step-12 text-panel-text-3">
      {model.slots.map((slot) => (
        <li key={slot.name}>
          {slot.name} · {slot.mediaKinds.join(", ")}
          {slot.required ? " · required" : ""}
        </li>
      ))}
    </ul>
  );
}

function UnsupportedList({ model }: { model: AccountModel }) {
  if (model.unsupportedCombinations.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-warning-ink">
      {model.unsupportedCombinations.map((item) => (
        <li key={`${item.sound}:${item.motion}`}>{item.reason}</li>
      ))}
    </ul>
  );
}

function ModelParameters({
  model,
  brief,
  onBriefChange,
}: {
  model: AccountModel;
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  const choices = choicesForModel(model, brief);
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-panel-text-0">{model.id}</h4>
      <p className={mutedClass}>Up to {model.maxReferences} references.</p>
      {choices.map((choice) => (
        <ChoiceSelect
          key={`${model.id}:${choice.key}`}
          modelId={model.id}
          choice={choice}
          brief={brief}
          onBriefChange={onBriefChange}
        />
      ))}
      <SlotList model={model} />
      <UnsupportedList model={model} />
    </div>
  );
}

export function NativeParameters({
  snapshot,
  brief,
  onBriefChange,
}: {
  snapshot: CapabilitySnapshotV1 | null;
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  if (!snapshot) return <p>The account snapshot is unresolved.</p>;
  if (snapshot.models.length === 0) return <p>The account snapshot lists no models.</p>;
  return (
    <div className="flex flex-col gap-3">
      {snapshot.models.map((model) => (
        <ModelParameters key={model.id} model={model} brief={brief} onBriefChange={onBriefChange} />
      ))}
    </div>
  );
}
