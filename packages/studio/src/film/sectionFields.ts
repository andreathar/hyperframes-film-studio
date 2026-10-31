import type { SceneBriefV1 } from "@hyperframes/film-production/browser";
import {
  writeAmbience,
  writeAnchor,
  writeCamera,
  writeExclusions,
  writeLocks,
  writeSetting,
} from "./briefEdit";
import type { ProductionShot } from "./types";

export interface SectionField {
  key: string;
  label: string;
  text: string;
  /** Exact bytes. Rendered as text, never a field the pattern can rewrite. */
  exact?: boolean;
  write?: (brief: SceneBriefV1, text: string) => SceneBriefV1;
}

interface Binding {
  key: string;
  label: string;
  read: (brief: SceneBriefV1) => string;
  write?: (brief: SceneBriefV1, text: string) => SceneBriefV1;
}

function prose(
  key: string,
  label: string,
  text: string,
  write?: SectionField["write"],
): SectionField {
  return { key, label, text, write };
}

function bound(
  brief: SceneBriefV1 | null,
  fallback: SectionField,
  bindings: readonly Binding[],
): SectionField[] {
  if (!brief) return [fallback];
  return bindings.map((binding) =>
    prose(binding.key, binding.label, binding.read(brief), binding.write),
  );
}

const OPENING: readonly Binding[] = [
  {
    key: "opening",
    label: "Opening",
    read: (b) => b.camera.opening,
    write: writeCamera("opening"),
  },
  {
    key: "framing",
    label: "Framing",
    read: (b) => b.camera.framing,
    write: writeCamera("framing"),
  },
  { key: "angle", label: "Angle", read: (b) => b.camera.angle, write: writeCamera("angle") },
];

const CAMERA: readonly Binding[] = [
  { key: "path", label: "Path", read: (b) => b.camera.path, write: writeCamera("path") },
  {
    key: "screen",
    label: "Screen direction",
    read: (b) => b.camera.screenDirection,
    write: writeCamera("screenDirection"),
  },
];

const LIGHT: readonly Binding[] = [
  { key: "place", label: "Place", read: (b) => b.setting.place, write: writeSetting("place") },
  {
    key: "light-direction",
    label: "Light direction",
    read: (b) => b.setting.lightDirection,
    write: writeSetting("lightDirection"),
  },
  {
    key: "atmosphere",
    label: "Atmosphere",
    read: (b) => b.setting.atmosphere,
    write: writeSetting("atmosphere"),
  },
];

const CONTINUITY: readonly Binding[] = [
  { key: "locks", label: "Locks", read: (b) => b.continuity.locks.join("\n"), write: writeLocks },
  {
    key: "exclusions",
    label: "Exclusions",
    read: (b) => b.continuity.exclusions.join("\n"),
    write: writeExclusions,
  },
  {
    key: "entry",
    label: "Entry",
    read: (b) => b.continuity.entryAnchor,
    write: writeAnchor("entryAnchor"),
  },
  {
    key: "exit",
    label: "Exit",
    read: (b) => b.continuity.exitAnchor,
    write: writeAnchor("exitAnchor"),
  },
];

function referenceFields(shot: ProductionShot, brief: SceneBriefV1 | null): SectionField[] {
  const supplied = shot.references.map((ref) => `${ref.role} · ${ref.id}`).join("\n");
  const fields = [prose("supplied", "Supplied", supplied)];
  if (!brief) return fields;
  const facts = brief.subjects
    .map((subject) => subject.facts)
    .filter((facts) => facts.length > 0)
    .join("\n");
  fields.push(prose("facts", "Subject facts", facts));
  return fields;
}

function actionFields(shot: ProductionShot, brief: SceneBriefV1 | null): SectionField[] {
  if (!brief || brief.beats.length === 0) {
    return [prose("acting", "Acting", shot.direction.acting)];
  }
  return brief.beats.map((beat) =>
    prose(beat.id, `${beat.startFrame}-${beat.endFrame}`, beat.subjectMotion),
  );
}

function dialogueFields(shot: ProductionShot, brief: SceneBriefV1 | null): SectionField[] {
  const fields: SectionField[] = [
    { key: "shot-dialogue", label: "Dialogue", text: shot.direction.dialogue, exact: true },
  ];
  if (!brief) return fields;
  brief.dialogue.forEach((line, index) => {
    fields.push({
      key: `brief-line-${index}`,
      label: line.speakerId || "Brief line",
      text: line.text,
      exact: true,
    });
  });
  fields.push(prose("ambience", "Ambience", brief.sound.ambience, writeAmbience));
  return fields;
}

const READERS = {
  "reference-grounding": referenceFields,
  "opening-composition": (shot: ProductionShot, brief: SceneBriefV1 | null) =>
    bound(brief, prose("camera", "Camera", shot.direction.camera), OPENING),
  "timed-action": actionFields,
  "camera-rhythm": (shot: ProductionShot, brief: SceneBriefV1 | null) =>
    bound(brief, prose("camera-direction", "Camera", shot.direction.camera), CAMERA),
  "environment-light": (shot: ProductionShot, brief: SceneBriefV1 | null) =>
    bound(brief, prose("lighting", "Lighting", shot.direction.lighting), LIGHT),
  "dialogue-sound": dialogueFields,
  "continuity-exclusions": (shot: ProductionShot, brief: SceneBriefV1 | null) =>
    bound(brief, prose("continuity", "Continuity", shot.direction.continuity), CONTINUITY),
} as const;

export function sectionFields(
  id: keyof typeof READERS,
  shot: ProductionShot,
  brief: SceneBriefV1 | null,
): SectionField[] {
  return READERS[id](shot, brief);
}
