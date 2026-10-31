import type {
  ActionBeatV1,
  CompileContextV1,
  DiagnosticV1,
  DialogueLineV1,
  FilmReleaseProfileV1,
  ProfileRestrictionV1,
  ProviderRouteV1,
  SceneBriefV1,
  ScenePatternId,
  ScenePatternV1,
  SceneReferenceBindingV1,
  SoundStrategyV1,
  VerifiedReferenceV1,
} from "../model.js";
import { cameraPathContradicts, patternOf } from "./patterns.js";

/**
 * Field-level compiler diagnostics. Nothing here clamps, drops, or substitutes a model.
 */

export interface RestrictionFacts {
  referenceCount: number;
  soundStrategy: SoundStrategyV1 | null;
  patternId: ScenePatternId | null;
}

export function diagnostic(
  code: string,
  path: string,
  message: string,
  severity: DiagnosticV1["severity"] = "error",
): DiagnosticV1 {
  return { code, severity, path, message };
}

export function creativeDiagnostics(
  brief: SceneBriefV1,
  context: CompileContextV1,
): DiagnosticV1[] {
  return [
    ...revisionDiagnostics(brief, context),
    ...beatDiagnostics(brief),
    ...cameraDiagnostics(brief),
    ...roleDiagnostics(brief, context),
    ...referenceDiagnostics(brief, context),
    ...voiceDiagnostics(brief, context),
    ...speakerDiagnostics(brief),
    ...soundDiagnostics(brief),
    ...routeDiagnostics(brief),
  ];
}

export function briefProfileDiagnostics(
  brief: SceneBriefV1,
  profile: FilmReleaseProfileV1,
): DiagnosticV1[] {
  return restrictionDiagnostics(briefFacts(brief), profile, "kling");
}

export function restrictionDiagnostics(
  facts: RestrictionFacts,
  profile: FilmReleaseProfileV1,
  route: ProviderRouteV1,
): DiagnosticV1[] {
  return profile.restrictions
    .filter((item) => restrictionFits(item, facts, route))
    .map((item) => restrictionDiagnostic(item));
}

export function unsupportedSoundDiagnostic(): DiagnosticV1 {
  return diagnostic("unsupported-sound", "scene.sound.strategy", "Sound strategy is unsupported");
}

export function slotAlias(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, "");
}

export function slotAliasDiagnostics(slots: readonly { slot: string }[]): DiagnosticV1[] {
  const seen = new Set<string>();
  return slots.flatMap((binding) => noteSlot(seen, binding.slot));
}

function noteSlot(seen: Set<string>, slot: string): DiagnosticV1[] {
  const key = slotAlias(slot);
  const duplicate = seen.has(key);
  seen.add(key);
  if (!duplicate) return [];
  return [
    diagnostic("slot-alias-collision", `slots.${slot}`, "Two references claim the same slot alias"),
  ];
}

function restrictionFits(
  restriction: ProfileRestrictionV1,
  facts: RestrictionFacts,
  route: ProviderRouteV1,
): boolean {
  return restriction.route === route && restrictionMatches(facts, restriction);
}

function restrictionDiagnostic(restriction: ProfileRestrictionV1): DiagnosticV1 {
  return diagnostic(restriction.code, "profile", restriction.message);
}

function restrictionMatches(facts: RestrictionFacts, restriction: ProfileRestrictionV1): boolean {
  if (!hasCondition(restriction.when)) return false;
  if (belowMinimum(facts, restriction.when)) return false;
  if (soundDiffers(facts, restriction.when)) return false;
  if (patternDiffers(facts, restriction.when)) return false;
  return true;
}

function hasCondition(when: ProfileRestrictionV1["when"]): boolean {
  if (when.minReferences !== undefined) return true;
  if (when.soundStrategy !== undefined) return true;
  if (when.patternId !== undefined) return true;
  return false;
}

function belowMinimum(facts: RestrictionFacts, when: ProfileRestrictionV1["when"]): boolean {
  if (when.minReferences === undefined) return false;
  return facts.referenceCount < when.minReferences;
}

function soundDiffers(facts: RestrictionFacts, when: ProfileRestrictionV1["when"]): boolean {
  if (when.soundStrategy === undefined) return false;
  return facts.soundStrategy !== when.soundStrategy;
}

function patternDiffers(facts: RestrictionFacts, when: ProfileRestrictionV1["when"]): boolean {
  if (when.patternId === undefined) return false;
  return facts.patternId !== when.patternId;
}

function briefFacts(brief: SceneBriefV1): RestrictionFacts {
  return {
    referenceCount: brief.references.length,
    soundStrategy: brief.sound.strategy,
    patternId: brief.authoring.patternId,
  };
}

function revisionDiagnostics(brief: SceneBriefV1, context: CompileContextV1): DiagnosticV1[] {
  if (sameRevision(brief, context)) return [];
  return [
    diagnostic(
      "revision-mismatch",
      "scene.sourceRevisionId",
      "Source or review revision does not match the compile context",
    ),
  ];
}

function sameRevision(brief: SceneBriefV1, context: CompileContextV1): boolean {
  return (
    brief.sourceRevisionId === context.sourceRevisionId &&
    brief.reviewRevision === context.reviewRevision
  );
}

function beatDiagnostics(brief: SceneBriefV1): DiagnosticV1[] {
  if (beatsDoNotAdvance(brief.beats)) {
    return [diagnostic("overlapping-beats", "scene.beats", "A beat must end after it starts")];
  }
  if (beatRangesOverlap(brief.beats)) {
    return [diagnostic("overlapping-beats", "scene.beats", "Action beats overlap")];
  }
  return [];
}

function beatsDoNotAdvance(beats: readonly ActionBeatV1[]): boolean {
  return beats.some((beat) => beat.endFrame <= beat.startFrame);
}

function beatRangesOverlap(beats: readonly ActionBeatV1[]): boolean {
  const ordered = [...beats].sort((left, right) => left.startFrame - right.startFrame);
  return ordered.some((beat, index) => overlapsPrevious(ordered[index - 1], beat));
}

function overlapsPrevious(previous: ActionBeatV1 | undefined, beat: ActionBeatV1): boolean {
  return previous !== undefined && beat.startFrame < previous.endFrame;
}

function cameraDiagnostics(brief: SceneBriefV1): DiagnosticV1[] {
  if (!cameraPathContradicts(brief.camera.path)) return [];
  return [
    diagnostic("contradictory-camera", "scene.camera.path", "A locked path cannot also travel"),
  ];
}

function roleDiagnostics(brief: SceneBriefV1, context: CompileContextV1): DiagnosticV1[] {
  const pattern = patternOf(brief.authoring.patternId);
  if (!pattern) return [];
  return missingRoles(pattern, context.verifiedReferences);
}

function missingRoles(
  pattern: ScenePatternV1,
  verified: readonly VerifiedReferenceV1[],
): DiagnosticV1[] {
  return pattern.requiredReferenceRoles
    .filter((role) => !verified.some((item) => item.role === role))
    .map((role) =>
      diagnostic(
        "missing-reference-role",
        "scene.references",
        `Verified references are missing the ${role} role`,
      ),
    );
}

function referenceDiagnostics(brief: SceneBriefV1, context: CompileContextV1): DiagnosticV1[] {
  return brief.references.flatMap((reference, index) =>
    referenceHashDiagnostic(reference, index, context.verifiedReferences),
  );
}

function referenceHashDiagnostic(
  reference: SceneReferenceBindingV1,
  index: number,
  verified: readonly VerifiedReferenceV1[],
): DiagnosticV1[] {
  const match = verified.find((item) => item.referenceId === reference.referenceId);
  if (match && match.sha256 === reference.sha256) return [];
  return [
    diagnostic(
      "reference-hash-mismatch",
      `scene.references.${index}.sha256`,
      "Reference hash does not match a verified reference",
    ),
  ];
}

function voiceDiagnostics(brief: SceneBriefV1, context: CompileContextV1): DiagnosticV1[] {
  const pattern = patternOf(brief.authoring.patternId);
  const lines = brief.dialogue.flatMap((line, index) =>
    lineVoiceDiagnostics(line, index, context.knownVoices, pattern),
  );
  return [...missingVoiceWhenSilent(brief, pattern), ...lines];
}

function missingVoiceWhenSilent(
  brief: SceneBriefV1,
  pattern: ScenePatternV1 | null,
): DiagnosticV1[] {
  if (!pattern || !pattern.requiresVoice || brief.dialogue.length > 0) return [];
  return [diagnostic("missing-voice", "scene.dialogue", "This pattern needs a voice id")];
}

function lineVoiceDiagnostics(
  line: DialogueLineV1,
  index: number,
  knownVoices: readonly string[],
  pattern: ScenePatternV1 | null,
): DiagnosticV1[] {
  const path = `scene.dialogue.${index}.voiceId`;
  return [...missingVoice(line, path, pattern), ...unknownVoice(line, path, knownVoices)];
}

function missingVoice(
  line: DialogueLineV1,
  path: string,
  pattern: ScenePatternV1 | null,
): DiagnosticV1[] {
  if (!pattern || !pattern.requiresVoice || line.voiceId !== "") return [];
  return [diagnostic("missing-voice", path, "This pattern needs a voice id")];
}

function unknownVoice(
  line: DialogueLineV1,
  path: string,
  knownVoices: readonly string[],
): DiagnosticV1[] {
  if (line.voiceId === "" || knownVoices.includes(line.voiceId)) return [];
  return [diagnostic("unknown-voice", path, "Voice id is not in the known voices")];
}

function speakerDiagnostics(brief: SceneBriefV1): DiagnosticV1[] {
  const ids = new Set(brief.subjects.map((subject) => subject.id));
  return brief.dialogue.flatMap((line, index) => speakerDiagnostic(line, index, ids));
}

function speakerDiagnostic(
  line: DialogueLineV1,
  index: number,
  ids: ReadonlySet<string>,
): DiagnosticV1[] {
  if (ids.has(line.speakerId)) return [];
  return [
    diagnostic(
      "unknown-speaker",
      `scene.dialogue.${index}.speakerId`,
      "Dialogue speaker is not a subject",
    ),
  ];
}

function soundDiagnostics(brief: SceneBriefV1): DiagnosticV1[] {
  if (brief.sound.strategy !== "unsupported") return [];
  return [unsupportedSoundDiagnostic()];
}

function routeDiagnostics(brief: SceneBriefV1): DiagnosticV1[] {
  const route = brief.output.routePreference;
  if (route === null || route === "kling") return [];
  return [
    diagnostic(
      "route-mismatch",
      "scene.output.routePreference",
      "This compiler prepares a Kling candidate",
    ),
  ];
}
