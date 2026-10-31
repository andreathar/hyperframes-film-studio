import { useState } from "react";
import type { CapabilitySnapshotV1, SceneBriefV1 } from "@hyperframes/film-production/browser";
import type { AccountModel } from "./contractTypes";
import { headingClass, selectClass } from "./chrome";
import { choicesForModel, type NativeChoice } from "./nativeChoices";

function commitChoice(
  value: string,
  choice: NativeChoice,
  brief: SceneBriefV1 | null,
  onBriefChange: (brief: SceneBriefV1) => void,
  setPicked: (value: string) => void,
) {
  setPicked(value);
  const apply = choice.apply;
  if (!brief || !apply) return;
  onBriefChange(apply(brief, value));
}

function ChoiceSelect({
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
  const [picked, setPicked] = useState(choice.selected);
  const known = choice.options.some((opt) => opt.value === picked);
  const value = known ? picked : choice.selected;
  return (
    <label className="flex flex-col gap-1">
      <span className={headingClass}>{choice.label}</span>
      <select
        aria-label={`${modelId} ${choice.label}`}
        className={selectClass}
        value={value}
        onChange={(event) =>
          commitChoice(event.target.value, choice, brief, onBriefChange, setPicked)
        }
      >
        {choice.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SlotList({ model }: { model: AccountModel }) {
  if (model.slots.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-[10px] text-neutral-400">
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
    <ul className="flex flex-col gap-1 text-amber-400/90">
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
      <h4 className="text-neutral-100">{model.id}</h4>
      <p className="text-[10px] text-neutral-500">Up to {model.maxReferences} references.</p>
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
