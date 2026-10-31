/**
 * Browser-safe film production records.
 * Parsers live beside this module and are re-exported from contracts.ts.
 */

export const PROMPT_SECTIONS = [
  { id: "reference-grounding", title: "Reference grounding" },
  { id: "opening-composition", title: "Opening composition" },
  { id: "timed-action", title: "Timed action" },
  { id: "camera-rhythm", title: "Camera rhythm" },
  { id: "environment-light", title: "Environment and light" },
  { id: "dialogue-sound", title: "Dialogue and sound" },
  { id: "continuity-exclusions", title: "Continuity and exclusions" },
] as const;

export type PromptSectionId = (typeof PROMPT_SECTIONS)[number]["id"];

export const SCENE_PATTERNS = [
  {
    id: "restrained-dialogue",
    title: "Restrained dialogue coverage",
    summary:
      "Hold a readable face, let the line land, and keep the camera from competing with the words.",
    requiredReferenceRoles: ["identity"],
    requiresDialogue: true,
    requiresVoice: true,
    cameraConstraint: "One lock or one gentle move. A locked frame does not also travel.",
    soundConstraint: "The line stays exact. Ambience sits under it.",
  },
  {
    id: "listening-reaction",
    title: "Listening reaction",
    summary: "Show who hears the line, and the change in them, without restaging the speaker.",
    requiredReferenceRoles: ["identity"],
    requiresDialogue: false,
    requiresVoice: false,
    cameraConstraint: "Stay on the listener. Do not whip back to the speaker.",
    soundConstraint: "The incoming line can be off-screen. Do not invent a reply.",
  },
  {
    id: "prop-hand-insert",
    title: "Prop and hand insert",
    summary: "A hand and a prop complete one visible action in a tight frame.",
    requiredReferenceRoles: ["prop"],
    requiresDialogue: false,
    requiresVoice: false,
    cameraConstraint: "The insert is stable enough to read the prop. No scenic orbit.",
    soundConstraint: "Foley or silence. No new spoken line.",
  },
  {
    id: "establishing-continuity",
    title: "Establishing continuity",
    summary: "Place the room, the light and the screen direction the next shot has to match.",
    requiredReferenceRoles: ["environment"],
    requiresDialogue: false,
    requiresVoice: false,
    cameraConstraint: "One establishing path with a declared entry and exit.",
    soundConstraint: "Room tone and score stay separate from dialogue.",
  },
  {
    id: "reference-led-motion",
    title: "Reference-led motion",
    summary: "Follow the supplied motion reference. Do not invent a second camera idea.",
    requiredReferenceRoles: ["motion"],
    requiresDialogue: false,
    requiresVoice: false,
    cameraConstraint:
      "Motion comes from the reference. Prose only describes what that reference already shows.",
    soundConstraint: "Do not add a native soundtrack the reference does not contain.",
  },
] as const satisfies readonly ScenePatternV1[];

export type ScenePatternId = (typeof SCENE_PATTERNS)[number]["id"];

export interface ScenePatternV1 {
  id: string;
  title: string;
  summary: string;
  requiredReferenceRoles: readonly ReferenceRole[];
  requiresDialogue: boolean;
  requiresVoice: boolean;
  cameraConstraint: string;
  soundConstraint: string;
}

export const SCENE_AUTHORING_INSTRUCTIONS = [
  "You are the scene author for a short film being cut in HyperFrames.",
  "Return one SceneBrief JSON object and no surrounding prose.",
  "The brief is a proposal. It does not approve a reference, choose a take, spend money, or release a provider.",
  "Copy dialogue text exactly, including punctuation, accents and spaces. Do not translate, paraphrase, or add a speaker.",
  "Use only reference IDs, shot keys and voice IDs that appear in the supplied context. Omit any that are absent.",
  "Do not invent durations, frame rates, prices, model names, approvals, or measured facts.",
  "A pattern is a constraint, not a promise that a physical camera will obey.",
  "Write lens, mood and acting as prose intent. Native controls belong only where the context marks a field as native.",
  "Time every action in integer frames. Each beat needs a beginning, a progression and an observable end. Beats do not overlap.",
  "Prefer one camera idea. A locked frame does not also dolly, orbit, pan, or crane.",
  "Name continuity locks, allowed changes and exclusions so the next shot can match.",
  "When a prose fact is unknown, use an empty string. Do not fill the gap with a plausible guess.",
].join("\n");

export const REFERENCE_ROLES = [
  "identity",
  "wardrobe",
  "prop",
  "start-frame",
  "end-frame",
  "motion",
  "environment",
  "style",
  "exclusion",
] as const;

export type ReferenceRole = (typeof REFERENCE_ROLES)[number];

export const PROVIDER_ROUTES = ["kling", "higgsfield", "comfyui", "local"] as const;
export type ProviderRouteV1 = (typeof PROVIDER_ROUTES)[number];

export const LEGACY_JOB_ROUTES = [
  "kling-cli",
  "higgsfield-manual",
  "comfyui-manual",
  "local-manual",
] as const;
export type LegacyJobRouteV1 = (typeof LEGACY_JOB_ROUTES)[number];

export const SOUND_STRATEGIES = ["native", "separate-edit", "silence", "unsupported"] as const;
export type SoundStrategyV1 = (typeof SOUND_STRATEGIES)[number];

export interface SceneReferenceBindingV1 {
  referenceId: string;
  sha256: string;
  mediaKind: "image" | "video" | "audio";
  subjectId: string;
  role: ReferenceRole;
  control: "native" | "prose";
  exclusions: string[];
}

export interface ActionBeatV1 {
  id: string;
  startFrame: number;
  endFrame: number;
  subjectMotion: string;
  cameraMotion: string;
  environmentMotion: string;
  observableEnd: string;
}

export interface DialogueLineV1 {
  speakerId: string;
  language: string;
  text: string;
  delivery: string;
  voiceId: string;
  startFrame: number | null;
  endFrame: number | null;
}

export interface SceneBriefV1 {
  version: 1;
  projectId: string;
  shotKey: string;
  sourceRevisionId: string;
  reviewRevision: number;
  authoring: {
    producer: "human" | "assistant";
    turnId: string;
    patternId: ScenePatternId | null;
  };
  subjects: Array<{ id: string; facts: string }>;
  references: SceneReferenceBindingV1[];
  camera: {
    framing: string;
    angle: string;
    lensIntent: string;
    focusIntent: string;
    opening: string;
    ending: string;
    path: string;
    screenDirection: string;
    axis: string;
  };
  setting: {
    place: string;
    lightSources: string;
    lightDirection: string;
    materials: string;
    palette: string;
    atmosphere: string;
  };
  beats: ActionBeatV1[];
  dialogue: DialogueLineV1[];
  sound: {
    strategy: SoundStrategyV1;
    ambience: string;
    sfx: string;
    music: string;
  };
  continuity: {
    locks: string[];
    allowedChanges: string[];
    exclusions: string[];
    entryAnchor: string;
    exitAnchor: string;
  };
  output: {
    kind: "video" | "image";
    width: number;
    height: number;
    fps: number;
    durationFrames: number;
    routePreference: ProviderRouteV1 | null;
  };
}

export interface DiagnosticV1 {
  code: string;
  severity: "error" | "warning";
  path: string;
  message: string;
}

export interface NativeArgumentV1 {
  name: string;
  value: string | number | boolean;
  source: "scene" | "snapshot-enum" | "profile";
}

export interface NativeCandidateV1 {
  route: "kling";
  model: string | null;
  args: NativeArgumentV1[];
  referenceSlots: Array<{
    slot: string;
    referenceId: string;
    sha256: string;
    role: ReferenceRole;
  }>;
  schemaDigest: string | null;
  executable: false;
}

export interface CompilationV1 {
  prompt: string;
  nativeCandidate: NativeCandidateV1 | null;
  diagnostics: DiagnosticV1[];
  sceneSha256: string;
  compilationSha256: string;
  capabilitySnapshotSha256: string | null;
  /** Compilation never authorizes a provider release. */
  executable: false;
}

export interface CapabilitySlotV1 {
  name: string;
  mediaKinds: Array<"image" | "video" | "audio">;
  required: boolean;
}

export interface CapabilityModelV1 {
  id: string;
  durationFrames: number[];
  ratios: string[];
  resolutions: Array<{ width: number; height: number }>;
  counts: number[];
  enums: Record<string, string[]>;
  slots: CapabilitySlotV1[];
  maxReferences: number;
  unsupportedCombinations: Array<{ sound: string; motion: string; reason: string }>;
}

export interface CapabilitySnapshotV1 {
  version: 1;
  route: "kling";
  runtimeIdentity: string;
  schemaDigest: string;
  models: CapabilityModelV1[];
}

export interface ProfileRestrictionV1 {
  code: string;
  message: string;
  route: ProviderRouteV1;
  when: {
    minReferences?: number;
    soundStrategy?: SoundStrategyV1;
    patternId?: ScenePatternId;
  };
}

export interface FilmReleaseProfileV1 {
  id: string;
  restrictions: ProfileRestrictionV1[];
}

export interface VerifiedReferenceV1 {
  referenceId: string;
  sha256: string;
  mediaKind: "image" | "video" | "audio";
  role: ReferenceRole;
}

export interface CompileContextV1 {
  verifiedReferences: VerifiedReferenceV1[];
  sourceRevisionId: string;
  reviewRevision: number;
  knownVoices: string[];
  snapshot: CapabilitySnapshotV1 | null;
  profile: FilmReleaseProfileV1;
}

export interface NativeValidationV1 {
  executable: boolean;
  diagnostics: DiagnosticV1[];
  canonicalArgs: string;
  canonicalSha256: string | null;
}

export interface OutputSpecV1 {
  kind: "video" | "image";
  width: number;
  height: number;
  fps: number | null;
  durationFrames: number | null;
}

export interface CandidateV1 {
  id: string;
  projectId: string;
  shotKey: string;
  attemptId: string | null;
  jobId: string | null;
  kind: "image" | "video" | "audio";
  sha256: string;
  mediaPath: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  durationFrames: number | null;
  imageMetadata: Record<string, string> | null;
  firstFrameSha256: string | null;
  selected: boolean;
  accepted: boolean;
  provenance: {
    route: ProviderRouteV1 | "owned-media";
    receiptId: string | null;
    originalOutputId: string | null;
  };
}

export interface AttemptV1 {
  id: string;
  jobId: string;
  projectRevision: number;
  compilationSha256: string;
  canonicalPayloadSha256: string | null;
  schemaDigest: string | null;
  status: "prepared" | "released" | "unknown" | "failed" | "succeeded";
  nativeTaskId: string | null;
  reason: string;
  supersedesAttemptId: string | null;
}

export interface JobIntentV2 {
  version: 2;
  id: string;
  shotKey: string;
  route: LegacyJobRouteV1;
  model: string;
  prompt: string;
  output: OutputSpecV1;
  requestFingerprint: string;
  legacyRevision: number | null;
}

export interface ProviderReceiptV1 {
  id: string;
  attemptId: string;
  route: ProviderRouteV1;
  status: "unknown" | "reported-running" | "reported-failed" | "reported-succeeded";
  nativeTaskId: string | null;
  traceId: string | null;
  outputSha256: string | null;
  evidencePath: string | null;
}

export interface ProjectDescriptorV1 {
  version: 1;
  projectId: string;
  title: string;
  filmRoot: string;
  dataDirectory: string;
}

export interface SourceRevisionV1 {
  id: string;
  fingerprint: string;
  importedAt: string;
  note: string;
}

export interface ReviewSnapshotV1 {
  version: 1;
  projectId: string;
  sourceFingerprint: string;
  revision: number;
  executionAllowed: false;
}

export interface ProjectShotViewV1 {
  shotKey: string;
  title: string;
  direction: {
    camera: string;
    acting: string;
    dialogue: string;
    lighting: string;
    continuity: string;
  };
  lineIds: string[];
  referenceIds: string[];
  selectedCandidateId: string | null;
}

export interface ProjectViewV1 {
  descriptor: ProjectDescriptorV1;
  revision: number;
  sourceRevision: SourceRevisionV1;
  review: ReviewSnapshotV1;
  shots: ProjectShotViewV1[];
  sceneDraft: SceneBriefV1 | null;
  compilation: CompilationV1 | null;
  jobs: JobIntentV2[];
  attempts: AttemptV1[];
  candidates: CandidateV1[];
}

export type FilmActionV1 =
  | { type: "save-scene-draft"; brief: SceneBriefV1 }
  | {
      type: "register-candidate";
      candidate: CandidateV1;
    }
  | {
      type: "create-attempt";
      attempt: AttemptV1;
    }
  | { type: "record-provider-receipt"; receipt: ProviderReceiptV1 }
  | { type: "select-candidate"; candidateId: string; shotKey: string }
  | { type: "record-source-revision"; revision: SourceRevisionV1 }
  | { type: "revalidate-proposals"; shotKey: string };

export interface FilmCommandV1 {
  requestId: string;
  projectId: string;
  expectedProjectRevision: number;
  reason: string;
  action: FilmActionV1;
}

export type AssistantProviderV1 = "codex" | "claude-external" | "local";

export type AssistantReadinessStateV1 =
  | "missing-cli"
  | "unauthenticated"
  | "unsupported-protocol"
  | "unavailable"
  | "limited"
  | "ready"
  | "external-handoff";

export interface AssistantReadinessV1 {
  provider: AssistantProviderV1;
  state: AssistantReadinessStateV1;
  evidence: string;
}

export interface AssistantContextV1 {
  projectId: string;
  shotKey: string;
  compositionPath: string | null;
  selectionId: string | null;
  playheadFrame: number | null;
  projectRevision: number;
  sourceRevisionId: string;
  reviewRevision: number;
}

export interface AssistantTurnV1 {
  id: string;
  provider: AssistantProviderV1;
  status: "ready" | "streaming" | "proposal" | "cancelled" | "failed" | "unsupported";
  context: AssistantContextV1;
  instruction: string;
  proposal: SceneBriefV1 | null;
  diagnostics: DiagnosticV1[];
}

export type AssistantEventKindV1 = "status" | "delta" | "proposal" | "diagnostic" | "done";

export interface AssistantEventV1 {
  projectId: string;
  turnId: string;
  sequence: number;
  version: 1;
  kind: AssistantEventKindV1;
  text: string;
  proposal: SceneBriefV1 | null;
  diagnostic: DiagnosticV1 | null;
}

export interface AssistantPort {
  inspect(provider: AssistantProviderV1): Promise<AssistantReadinessV1>;
  start(context: AssistantContextV1, instruction: string): Promise<AssistantTurnV1>;
  events(turnId: string, afterSequence: number): AsyncIterable<AssistantEventV1>;
  cancel(turnId: string): Promise<void>;
}

export function scenePattern(id: ScenePatternId): ScenePatternV1 {
  for (const pattern of SCENE_PATTERNS) {
    if (pattern.id === id) return pattern;
  }
  throw new Error(`Unknown scene pattern ${id}`);
}
