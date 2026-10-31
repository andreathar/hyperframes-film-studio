import type { SceneBriefV1 } from "@hyperframes/film-production/browser";
import type { AccountModel } from "./contractTypes";

export interface NativeChoice {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string;
  apply?: (brief: SceneBriefV1, value: string) => SceneBriefV1;
}

const MARK = "×";

function formatResolution(width: number, height: number): string {
  return `${width}${MARK}${height}`;
}

function applyDuration(brief: SceneBriefV1, value: string): SceneBriefV1 {
  const durationFrames = Number(value);
  if (!Number.isInteger(durationFrames)) return brief;
  return { ...brief, output: { ...brief.output, durationFrames } };
}

function applyResolution(brief: SceneBriefV1, value: string): SceneBriefV1 {
  const parts = value.split(MARK);
  const width = Number(parts[0]);
  const height = Number(parts[1]);
  if (parts.length !== 2 || !Number.isInteger(width) || !Number.isInteger(height)) return brief;
  return { ...brief, output: { ...brief.output, width, height } };
}

function fromValues(
  key: string,
  label: string,
  values: readonly string[],
  selected: string,
  apply?: NativeChoice["apply"],
): NativeChoice | null {
  if (values.length === 0) return null;
  const options = values.map((value) => ({ value, label: value }));
  const picked = options.some((opt) => opt.value === selected)
    ? selected
    : (options[0]?.value ?? "");
  return { key, label, options, selected: picked, apply };
}

function isPresent(choice: NativeChoice | null): choice is NativeChoice {
  return choice !== null;
}

function enumChoices(model: AccountModel): NativeChoice[] {
  const choices: NativeChoice[] = [];
  for (const name of Object.keys(model.enums)) {
    const values = model.enums[name];
    if (!values) continue;
    const choice = fromValues(`enum-${name}`, name, values, "");
    if (choice) choices.push(choice);
  }
  return choices;
}

function resolutionValues(model: AccountModel): string[] {
  return model.resolutions.map((item) => formatResolution(item.width, item.height));
}

/** Every option is copied from the account model. Nothing is filled in from a catalog. */
export function choicesForModel(model: AccountModel, brief: SceneBriefV1 | null): NativeChoice[] {
  const duration = brief ? String(brief.output.durationFrames) : "";
  const resolution = brief ? formatResolution(brief.output.width, brief.output.height) : "";
  return [
    fromValues(
      "duration-frames",
      "Duration frames",
      model.durationFrames.map(String),
      duration,
      applyDuration,
    ),
    fromValues("ratio", "Ratio", model.ratios, ""),
    fromValues("resolution", "Resolution", resolutionValues(model), resolution, applyResolution),
    fromValues("count", "Count", model.counts.map(String), ""),
    ...enumChoices(model),
  ].filter(isPresent);
}
