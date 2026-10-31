import {
  SCENE_PATTERNS,
  SOUND_STRATEGIES,
  type CapabilityModelV1,
  type CapabilitySlotV1,
  type CapabilitySnapshotV1,
  type CompileContextV1,
  type DiagnosticV1,
  type NativeArgumentV1,
  type NativeCandidateV1,
  type NativeValidationV1,
  type ScenePatternId,
  type SoundStrategyV1,
  type VerifiedReferenceV1,
} from "../model.js";
import {
  diagnostic,
  restrictionDiagnostics,
  slotAlias,
  slotAliasDiagnostics,
  unsupportedSoundDiagnostic,
  type RestrictionFacts,
} from "../scene/diagnostics.js";
import { serializeCanonicalArgs, sha256Hex } from "./serialize.js";

/**
 * A candidate is executable only when this snapshot accepts every output
 * argument, slot, and reference cap, and the film profile adds no error.
 */

const POLICY_ARGS = new Set([
  "durationFrames",
  "ratio",
  "resolution",
  "count",
  "soundStrategy",
  "patternId",
  "cameraPath",
]);

type ReferenceSlot = NativeCandidateV1["referenceSlots"][number];

export function validateNativeCandidate(
  candidate: NativeCandidateV1,
  snapshot: CapabilitySnapshotV1,
  context: CompileContextV1,
): NativeValidationV1 {
  const diagnostics = validationDiagnostics(candidate, snapshot, context);
  const canonicalArgs = serializeCanonicalArgs(candidate.args);
  return {
    executable: diagnostics.length === 0,
    diagnostics,
    canonicalArgs,
    canonicalSha256: sha256Hex(canonicalArgs),
  };
}

function validationDiagnostics(
  candidate: NativeCandidateV1,
  snapshot: CapabilitySnapshotV1,
  context: CompileContextV1,
): DiagnosticV1[] {
  return [
    ...schemaDiagnostics(candidate, snapshot),
    ...modelDiagnostics(candidate, snapshot, context),
    ...soundArgDiagnostics(candidate),
    ...restrictionDiagnostics(candidateFacts(candidate), context.profile, candidate.route),
  ];
}

function schemaDiagnostics(
  candidate: NativeCandidateV1,
  snapshot: CapabilitySnapshotV1,
): DiagnosticV1[] {
  if (candidate.schemaDigest === snapshot.schemaDigest) return [];
  return [
    diagnostic(
      "schema-drift",
      "snapshot.schemaDigest",
      "Candidate schema digest does not match the snapshot",
    ),
  ];
}

function modelDiagnostics(
  candidate: NativeCandidateV1,
  snapshot: CapabilitySnapshotV1,
  context: CompileContextV1,
): DiagnosticV1[] {
  const models = modelList(snapshot);
  if (models.length === 0) return [incompleteSnapshot()];
  const model = findModel(candidate, models);
  if (!model) return [unresolvedModel(candidate)];
  return acceptModel(candidate, model, context);
}

function modelList(snapshot: CapabilitySnapshotV1): readonly CapabilityModelV1[] {
  if (!Array.isArray(snapshot.models)) return [];
  return snapshot.models;
}

function incompleteSnapshot(): DiagnosticV1 {
  return diagnostic(
    "incomplete-snapshot",
    "snapshot.models",
    "The capability snapshot lists no models",
  );
}

function findModel(
  candidate: NativeCandidateV1,
  models: readonly CapabilityModelV1[],
): CapabilityModelV1 | null {
  if (candidate.model === null) return null;
  return models.find((item) => item.id === candidate.model) ?? null;
}

function unresolvedModel(candidate: NativeCandidateV1): DiagnosticV1 {
  if (candidate.model === null) {
    return diagnostic(
      "unresolved-capability",
      "snapshot.models",
      "The snapshot does not select one model",
    );
  }
  return diagnostic(
    "unknown-model",
    "nativeCandidate.model",
    "The candidate model is not in the snapshot",
  );
}

function acceptModel(
  candidate: NativeCandidateV1,
  model: CapabilityModelV1,
  context: CompileContextV1,
): DiagnosticV1[] {
  return [
    ...outputDiagnostics(model, candidate.args),
    ...enumDiagnostics(model, candidate.args),
    ...combinationDiagnostics(model, candidate),
    ...slotDiagnostics(model, candidate, context),
  ];
}

function outputDiagnostics(
  model: CapabilityModelV1,
  args: readonly NativeArgumentV1[],
): DiagnosticV1[] {
  return [
    ...outputMember(
      argNumber(args, "durationFrames"),
      model.durationFrames,
      "duration-mismatch",
      "scene.output.durationFrames",
      "Duration is not in the selected model",
    ),
    ...outputMember(
      argString(args, "ratio"),
      model.ratios,
      "ratio-mismatch",
      "scene.output",
      "Ratio is not in the selected model",
    ),
    ...outputMember(
      argString(args, "resolution"),
      resolutionNames(model),
      "resolution-mismatch",
      "scene.output",
      "Resolution is not in the selected model",
    ),
    ...outputMember(
      argNumber(args, "count"),
      model.counts,
      "count-mismatch",
      "scene.output",
      "Count is not in the selected model",
    ),
  ];
}

function resolutionNames(model: CapabilityModelV1): string[] {
  return model.resolutions.map((item) => `${item.width}x${item.height}`);
}

function outputMember(
  value: string | number | null,
  allowed: readonly (string | number)[],
  code: string,
  path: string,
  message: string,
): DiagnosticV1[] {
  if (value !== null && allowed.some((item) => item === value)) return [];
  return [diagnostic(code, path, message)];
}

function enumDiagnostics(
  model: CapabilityModelV1,
  args: readonly NativeArgumentV1[],
): DiagnosticV1[] {
  return args.flatMap((arg) => enumDiagnostic(model, arg));
}

function enumDiagnostic(model: CapabilityModelV1, arg: NativeArgumentV1): DiagnosticV1[] {
  const allowed = enumValues(model, arg.name);
  if (allowed) return enumValue(arg, allowed);
  if (POLICY_ARGS.has(arg.name)) return [];
  return [
    diagnostic("unaccepted-arg", `args.${arg.name}`, "The snapshot does not accept this argument"),
  ];
}

function enumValues(model: CapabilityModelV1, name: string): readonly string[] | undefined {
  if (!Object.hasOwn(model.enums, name)) return undefined;
  return model.enums[name];
}

function enumValue(arg: NativeArgumentV1, allowed: readonly string[]): DiagnosticV1[] {
  if (typeof arg.value === "string" && allowed.includes(arg.value)) return [];
  return [diagnostic("enum-mismatch", `args.${arg.name}`, "Enum value is not in the snapshot")];
}

function combinationDiagnostics(
  model: CapabilityModelV1,
  candidate: NativeCandidateV1,
): DiagnosticV1[] {
  const sound = argString(candidate.args, "soundStrategy");
  const motion = argString(candidate.args, "cameraPath");
  return combinationList(model).flatMap((combination) =>
    combinationDiagnostic(combination, sound, motion),
  );
}

function combinationList(model: CapabilityModelV1): CapabilityModelV1["unsupportedCombinations"] {
  if (!Array.isArray(model.unsupportedCombinations)) return [];
  return model.unsupportedCombinations;
}

function combinationDiagnostic(
  combination: { sound: string; motion: string; reason: string },
  sound: string | null,
  motion: string | null,
): DiagnosticV1[] {
  if (combination.sound !== sound || combination.motion !== motion) return [];
  return [diagnostic("unsupported-combination", "scene.sound", combination.reason)];
}

function slotDiagnostics(
  model: CapabilityModelV1,
  candidate: NativeCandidateV1,
  context: CompileContextV1,
): DiagnosticV1[] {
  return [
    ...slotAliasDiagnostics(candidate.referenceSlots),
    ...candidate.referenceSlots.flatMap((binding) => bindingDiagnostic(model, binding, context)),
    ...requiredSlotDiagnostics(model, candidate),
    ...capDiagnostics(model, candidate),
  ];
}

function bindingDiagnostic(
  model: CapabilityModelV1,
  binding: ReferenceSlot,
  context: CompileContextV1,
): DiagnosticV1[] {
  const slot = findSlot(model, binding.slot);
  if (!slot) return [unknownSlot(binding.slot)];
  const verified = findVerified(context, binding.referenceId);
  const issue = referenceIssue(binding, verified);
  if (issue) return [issue];
  if (!verified) return [];
  return mediaIssue(slot, verified.mediaKind, binding.slot);
}

function findSlot(model: CapabilityModelV1, name: string): CapabilitySlotV1 | undefined {
  const key = slotAlias(name);
  return model.slots.find((slot) => slotAlias(slot.name) === key);
}

function findVerified(
  context: CompileContextV1,
  referenceId: string,
): VerifiedReferenceV1 | undefined {
  return context.verifiedReferences.find((item) => item.referenceId === referenceId);
}

function referenceIssue(
  binding: ReferenceSlot,
  verified: VerifiedReferenceV1 | undefined,
): DiagnosticV1 | null {
  if (!verified || verified.sha256 !== binding.sha256) return hashMismatch(binding.referenceId);
  if (verified.role !== binding.role) return roleMismatch(binding.referenceId);
  return null;
}

function hashMismatch(referenceId: string): DiagnosticV1 {
  return diagnostic(
    "reference-hash-mismatch",
    `slots.${referenceId}`,
    "Reference hash does not match a verified reference",
  );
}

function roleMismatch(referenceId: string): DiagnosticV1 {
  return diagnostic(
    "reference-role-mismatch",
    `slots.${referenceId}`,
    "Reference role does not match the verified reference",
  );
}

function unknownSlot(slot: string): DiagnosticV1 {
  return diagnostic("unknown-slot", `slots.${slot}`, "The snapshot has no slot for this reference");
}

function mediaIssue(
  slot: CapabilitySlotV1,
  mediaKind: VerifiedReferenceV1["mediaKind"],
  name: string,
): DiagnosticV1[] {
  if (slot.mediaKinds.includes(mediaKind)) return [];
  return [
    diagnostic("slot-media-mismatch", `slots.${name}`, "The slot does not accept this media kind"),
  ];
}

function requiredSlotDiagnostics(
  model: CapabilityModelV1,
  candidate: NativeCandidateV1,
): DiagnosticV1[] {
  return model.slots
    .filter((slot) => missingRequired(slot, candidate))
    .map((slot) =>
      diagnostic("missing-slot", `slots.${slot.name}`, "A required snapshot slot is unbound"),
    );
}

function missingRequired(slot: CapabilitySlotV1, candidate: NativeCandidateV1): boolean {
  if (!slot.required) return false;
  return !claims(candidate, slot.name);
}

function claims(candidate: NativeCandidateV1, name: string): boolean {
  const key = slotAlias(name);
  return candidate.referenceSlots.some((binding) => slotAlias(binding.slot) === key);
}

function capDiagnostics(model: CapabilityModelV1, candidate: NativeCandidateV1): DiagnosticV1[] {
  if (candidate.referenceSlots.length <= model.maxReferences) return [];
  return [diagnostic("reference-cap", "slots", "Combined reference count is above the model cap")];
}

function soundArgDiagnostics(candidate: NativeCandidateV1): DiagnosticV1[] {
  if (argString(candidate.args, "soundStrategy") !== "unsupported") return [];
  return [unsupportedSoundDiagnostic()];
}

function candidateFacts(candidate: NativeCandidateV1): RestrictionFacts {
  return {
    referenceCount: candidate.referenceSlots.length,
    soundStrategy: knownSound(argString(candidate.args, "soundStrategy")),
    patternId: knownPattern(argString(candidate.args, "patternId")),
  };
}

function knownSound(value: string | null): SoundStrategyV1 | null {
  if (value === null) return null;
  for (const strategy of SOUND_STRATEGIES) {
    if (strategy === value) return strategy;
  }
  return null;
}

function knownPattern(value: string | null): ScenePatternId | null {
  if (value === null) return null;
  for (const pattern of SCENE_PATTERNS) {
    if (pattern.id === value) return pattern.id;
  }
  return null;
}

function namedArg(args: readonly NativeArgumentV1[], name: string): NativeArgumentV1 | undefined {
  return args.find((arg) => arg.name === name);
}

function argString(args: readonly NativeArgumentV1[], name: string): string | null {
  const value = namedArg(args, name)?.value;
  if (typeof value !== "string") return null;
  return value;
}

function argNumber(args: readonly NativeArgumentV1[], name: string): number | null {
  const value = namedArg(args, name)?.value;
  if (typeof value !== "number") return null;
  return value;
}
