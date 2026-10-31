import {
  REFERENCE_ROLES,
  SOUND_STRATEGIES,
  type SceneBriefV1,
  type ScenePatternId,
} from "@hyperframes/film-production/browser";
import type { ReferenceRole, SoundStrategy } from "./contractTypes";

/** Pattern choice records a constraint. Dialogue bytes stay on the same array. */
export function withPattern(brief: SceneBriefV1, patternId: ScenePatternId): SceneBriefV1 {
  return { ...brief, authoring: { ...brief.authoring, patternId } };
}

export function isReferenceRole(value: string): value is ReferenceRole {
  for (const role of REFERENCE_ROLES) {
    if (role === value) return true;
  }
  return false;
}

export function withReferenceRole(
  brief: SceneBriefV1,
  referenceId: string,
  role: ReferenceRole,
): SceneBriefV1 {
  return {
    ...brief,
    references: brief.references.map((ref) =>
      ref.referenceId === referenceId ? { ...ref, role } : ref,
    ),
  };
}

export function isSoundStrategy(value: string): value is SoundStrategy {
  for (const strategy of SOUND_STRATEGIES) {
    if (strategy === value) return true;
  }
  return false;
}

export function withSoundStrategy(brief: SceneBriefV1, strategy: SoundStrategy): SceneBriefV1 {
  return { ...brief, sound: { ...brief.sound, strategy } };
}

type CameraKey = "opening" | "framing" | "angle" | "path" | "screenDirection";

export function writeCamera(key: CameraKey) {
  return (brief: SceneBriefV1, text: string): SceneBriefV1 => ({
    ...brief,
    camera: { ...brief.camera, [key]: text },
  });
}

type SettingKey = "place" | "lightDirection" | "atmosphere";

export function writeSetting(key: SettingKey) {
  return (brief: SceneBriefV1, text: string): SceneBriefV1 => ({
    ...brief,
    setting: { ...brief.setting, [key]: text },
  });
}

export function writeAmbience(brief: SceneBriefV1, text: string): SceneBriefV1 {
  return { ...brief, sound: { ...brief.sound, ambience: text } };
}

function linesOf(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function writeLocks(brief: SceneBriefV1, text: string): SceneBriefV1 {
  return { ...brief, continuity: { ...brief.continuity, locks: linesOf(text) } };
}

export function writeExclusions(brief: SceneBriefV1, text: string): SceneBriefV1 {
  return { ...brief, continuity: { ...brief.continuity, exclusions: linesOf(text) } };
}

type AnchorKey = "entryAnchor" | "exitAnchor";

export function writeAnchor(key: AnchorKey) {
  return (brief: SceneBriefV1, text: string): SceneBriefV1 => ({
    ...brief,
    continuity: { ...brief.continuity, [key]: text },
  });
}
