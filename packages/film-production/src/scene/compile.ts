import {
  PROMPT_SECTIONS,
  type ActionBeatV1,
  type CapabilityModelV1,
  type CapabilitySnapshotV1,
  type CompilationV1,
  type CompileContextV1,
  type DiagnosticV1,
  type DialogueLineV1,
  type NativeArgumentV1,
  type NativeCandidateV1,
  type PromptSectionId,
  type SceneBriefV1,
  type SceneReferenceBindingV1,
} from "../model.js";
import { canonicalJson, sha256Hex } from "../native/serialize.js";
import { validateNativeCandidate } from "../native/validate.js";
import {
  briefProfileDiagnostics,
  creativeDiagnostics,
  diagnostic,
  slotAliasDiagnostics,
} from "./diagnostics.js";
import { patternPrompt } from "./patterns.js";

/**
 * Deterministic Kling scene compiler.
 * Compilation is never executable. Native validation is a separate decision.
 */

const SECTION_BODIES: Record<PromptSectionId, (brief: SceneBriefV1) => string> = {
  "reference-grounding": groundingBody,
  "opening-composition": openingBody,
  "timed-action": actionBody,
  "camera-rhythm": cameraBody,
  "environment-light": environmentBody,
  "dialogue-sound": dialogueBody,
  "continuity-exclusions": continuityBody,
};

export function compileScene(brief: SceneBriefV1, context: CompileContextV1): CompilationV1 {
  const draft = compileDraft(brief, context);
  return { ...draft, compilationSha256: sha256Hex(canonicalJson(draft)) };
}

function compileDraft(
  brief: SceneBriefV1,
  context: CompileContextV1,
): Omit<CompilationV1, "compilationSha256"> {
  const nativeCandidate = buildCandidate(brief, context);
  return {
    prompt: renderPrompt(brief),
    nativeCandidate,
    diagnostics: compileDiagnostics(brief, context, nativeCandidate),
    sceneSha256: sha256Hex(canonicalJson(brief)),
    capabilitySnapshotSha256: capabilityHash(context.snapshot),
    executable: false,
  };
}

function compileDiagnostics(
  brief: SceneBriefV1,
  context: CompileContextV1,
  candidate: NativeCandidateV1,
): DiagnosticV1[] {
  return uniqueDiagnostics([
    ...creativeDiagnostics(brief, context),
    ...nativeDiagnostics(brief, context, candidate),
  ]);
}

function nativeDiagnostics(
  brief: SceneBriefV1,
  context: CompileContextV1,
  candidate: NativeCandidateV1,
): DiagnosticV1[] {
  const snapshot = context.snapshot;
  if (!snapshot) return unboundDiagnostics(brief, context, candidate);
  return validateNativeCandidate(candidate, snapshot, context).diagnostics;
}

function unboundDiagnostics(
  brief: SceneBriefV1,
  context: CompileContextV1,
  candidate: NativeCandidateV1,
): DiagnosticV1[] {
  return [
    diagnostic(
      "unresolved-capability",
      "snapshot",
      "No capability snapshot is available for native parameters",
    ),
    ...briefProfileDiagnostics(brief, context.profile),
    ...slotAliasDiagnostics(candidate.referenceSlots),
  ];
}

function uniqueDiagnostics(diagnostics: DiagnosticV1[]): DiagnosticV1[] {
  const seen = new Set<string>();
  return diagnostics.filter((item) => keepDiagnostic(seen, item));
}

function keepDiagnostic(seen: Set<string>, item: DiagnosticV1): boolean {
  const key = `${item.severity}\n${item.code}\n${item.path}\n${item.message}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

function buildCandidate(brief: SceneBriefV1, context: CompileContextV1): NativeCandidateV1 {
  return {
    route: "kling",
    model: selectedModelId(context.snapshot),
    args: sceneArgs(brief),
    referenceSlots: referenceSlots(brief),
    schemaDigest: snapshotDigest(context.snapshot),
    executable: false,
  };
}

function selectedModelId(snapshot: CapabilitySnapshotV1 | null): string | null {
  const model = onlyModel(snapshot);
  if (!model) return null;
  return model.id;
}

function onlyModel(snapshot: CapabilitySnapshotV1 | null): CapabilityModelV1 | null {
  if (!snapshot) return null;
  if (snapshot.models.length !== 1) return null;
  return snapshot.models[0] ?? null;
}

function snapshotDigest(snapshot: CapabilitySnapshotV1 | null): string | null {
  if (!snapshot) return null;
  return snapshot.schemaDigest;
}

function capabilityHash(snapshot: CapabilitySnapshotV1 | null): string | null {
  if (!snapshot) return null;
  return sha256Hex(canonicalJson(snapshot));
}

/** Count stays 1. A snapshot that omits 1 is a mismatch, not a different count. */
function sceneArgs(brief: SceneBriefV1): NativeArgumentV1[] {
  return [
    sceneArg("durationFrames", brief.output.durationFrames),
    sceneArg("ratio", reducedRatio(brief.output.width, brief.output.height)),
    sceneArg("resolution", `${brief.output.width}x${brief.output.height}`),
    sceneArg("count", 1),
    sceneArg("soundStrategy", brief.sound.strategy),
    sceneArg("patternId", patternArg(brief)),
    sceneArg("cameraPath", brief.camera.path),
  ];
}

function sceneArg(name: string, value: string | number): NativeArgumentV1 {
  return { name, value, source: "scene" };
}

function patternArg(brief: SceneBriefV1): string {
  if (brief.authoring.patternId === null) return "";
  return brief.authoring.patternId;
}

function referenceSlots(brief: SceneBriefV1): NativeCandidateV1["referenceSlots"] {
  return brief.references.map((reference) => ({
    slot: reference.role,
    referenceId: reference.referenceId,
    sha256: reference.sha256,
    role: reference.role,
  }));
}

function reducedRatio(width: number, height: number): string {
  const divisor = greatestDivisor(width, height);
  return `${Math.trunc(width / divisor)}:${Math.trunc(height / divisor)}`;
}

function greatestDivisor(left: number, right: number): number {
  let width = Math.abs(left);
  let height = Math.abs(right);
  while (height !== 0) {
    const next = width % height;
    width = height;
    height = next;
  }
  if (width === 0) return 1;
  return width;
}

function renderPrompt(brief: SceneBriefV1): string {
  return PROMPT_SECTIONS.map((item) => `## ${item.title}\n${SECTION_BODIES[item.id](brief)}`).join(
    "\n\n",
  );
}

function groundingBody(brief: SceneBriefV1): string {
  return [
    ...patternSummary(brief),
    ...brief.subjects.map((subject) => `Subject ${subject.id}: ${subject.facts}`),
    ...brief.references.map((reference) => referenceLine(reference)),
  ].join("\n");
}

function patternSummary(brief: SceneBriefV1): string[] {
  const pattern = patternPrompt(brief.authoring.patternId);
  if (!pattern) return [];
  return [pattern.summary];
}

function referenceLine(reference: SceneReferenceBindingV1): string {
  return [
    `Reference ${reference.referenceId}`,
    `role ${reference.role}`,
    `sha256 ${reference.sha256}`,
    `media ${reference.mediaKind}`,
    `subject ${reference.subjectId}`,
    `control ${reference.control}`,
    `exclusions ${reference.exclusions.join("; ")}`,
  ].join(" | ");
}

function openingBody(brief: SceneBriefV1): string {
  return [
    `Opening: ${brief.camera.opening}`,
    `Framing: ${brief.camera.framing}`,
    `Angle: ${brief.camera.angle}`,
    `Entry anchor: ${brief.continuity.entryAnchor}`,
  ].join("\n");
}

function actionBody(brief: SceneBriefV1): string {
  return brief.beats.map((beat) => beatLine(beat)).join("\n");
}

function beatLine(beat: ActionBeatV1): string {
  return [
    `Frames ${beat.startFrame}-${beat.endFrame}`,
    `subject ${beat.subjectMotion}`,
    `environment ${beat.environmentMotion}`,
    `end ${beat.observableEnd}`,
  ].join(" | ");
}

function cameraBody(brief: SceneBriefV1): string {
  const lines = [
    proseIntent("Lens intent", brief.camera.lensIntent),
    proseIntent("Path", brief.camera.path),
    "Native camera control: none",
    `Focus intent: ${brief.camera.focusIntent}`,
    `Ending: ${brief.camera.ending}`,
    `Screen direction: ${brief.camera.screenDirection}`,
    `Axis: ${brief.camera.axis}`,
    ...brief.beats.map((beat) => `Beat ${beat.id} camera: ${beat.cameraMotion}`),
  ];
  const pattern = patternPrompt(brief.authoring.patternId);
  if (pattern) lines.push(`Pattern camera constraint: ${pattern.camera}`);
  return lines.join("\n");
}

function proseIntent(label: string, value: string): string {
  return `${label} (prose intent): ${value}`;
}

function environmentBody(brief: SceneBriefV1): string {
  const setting = brief.setting;
  return [
    `Place: ${setting.place}`,
    `Light sources: ${setting.lightSources}`,
    `Light direction: ${setting.lightDirection}`,
    `Materials: ${setting.materials}`,
    `Palette: ${setting.palette}`,
    proseIntent("Mood", setting.atmosphere),
  ].join("\n");
}

function dialogueBody(brief: SceneBriefV1): string {
  const lines = brief.dialogue.flatMap((spoken) => dialogueLines(spoken));
  lines.push(`Sound strategy: ${brief.sound.strategy}`);
  lines.push(`Ambience: ${brief.sound.ambience}`);
  lines.push(`SFX: ${brief.sound.sfx}`);
  lines.push(`Music: ${brief.sound.music}`);
  const pattern = patternPrompt(brief.authoring.patternId);
  if (pattern) lines.push(`Pattern sound constraint: ${pattern.sound}`);
  return lines.join("\n");
}

function dialogueLines(spoken: DialogueLineV1): string[] {
  return [
    spoken.text,
    `language ${spoken.language}`,
    `delivery ${spoken.delivery}`,
    `voiceId ${spoken.voiceId}`,
    `speakerId ${spoken.speakerId}`,
    frameLine(spoken),
  ];
}

function frameLine(spoken: DialogueLineV1): string {
  if (spoken.startFrame === null || spoken.endFrame === null) return "frames";
  return `frames ${spoken.startFrame}-${spoken.endFrame}`;
}

function continuityBody(brief: SceneBriefV1): string {
  const continuity = brief.continuity;
  return [
    `Locks: ${continuity.locks.join("; ")}`,
    `Allowed changes: ${continuity.allowedChanges.join("; ")}`,
    `Exclusions: ${continuity.exclusions.join("; ")}`,
    `Exit anchor: ${continuity.exitAnchor}`,
    `Reference exclusions: ${referenceExclusions(brief)}`,
  ].join("\n");
}

function referenceExclusions(brief: SceneBriefV1): string {
  return brief.references.flatMap((reference) => reference.exclusions).join("; ");
}
