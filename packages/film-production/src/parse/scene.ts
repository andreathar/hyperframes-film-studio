import {
  REFERENCE_ROLES,
  SOUND_STRATEGIES,
  PROVIDER_ROUTES,
  SCENE_PATTERNS,
  type ActionBeatV1,
  type DialogueLineV1,
  type SceneBriefV1,
  type ScenePatternId,
  type SceneReferenceBindingV1,
} from "../model.js";
import {
  FilmContractError,
  mapObjects,
  objectAt,
  oneOf,
  readInt,
  readNullableInt,
  readHash,
  readProducerId,
  readShotKey,
  readString,
  readStringList,
} from "./common.js";

const BRIEF_KEYS = [
  "version",
  "projectId",
  "shotKey",
  "sourceRevisionId",
  "reviewRevision",
  "authoring",
  "subjects",
  "references",
  "camera",
  "setting",
  "beats",
  "dialogue",
  "sound",
  "continuity",
  "output",
] as const;

const PATTERN_IDS = SCENE_PATTERNS.map((pattern) => pattern.id);

function patternId(value: unknown, fieldPath: string): ScenePatternId | null {
  if (value === null) return null;
  return oneOf(value, fieldPath, PATTERN_IDS);
}

function prose(record: Record<string, unknown>, fieldPath: string, key: string): string {
  return readString(record, fieldPath, key, { required: true, allowEmpty: true });
}

function references(value: unknown, fieldPath: string): SceneReferenceBindingV1[] {
  return mapObjects(
    value,
    fieldPath,
    ["referenceId", "sha256", "mediaKind", "subjectId", "role", "control", "exclusions"],
    (record, path) => ({
      referenceId: readProducerId(record, path, "referenceId"),
      sha256: readHash(record, path, "sha256"),
      mediaKind: oneOf(record.mediaKind, `${path}.mediaKind`, ["image", "video", "audio"] as const),
      subjectId: readString(record, path, "subjectId", {
        required: true,
        allowEmpty: true,
        max: 120,
      }),
      role: oneOf(record.role, `${path}.role`, REFERENCE_ROLES),
      control: oneOf(record.control, `${path}.control`, ["native", "prose"] as const),
      exclusions: readStringList(record, path, "exclusions"),
    }),
  );
}

function beats(value: unknown, fieldPath: string, durationFrames: number): ActionBeatV1[] {
  if (!Array.isArray(value)) {
    throw new FilmContractError("malformed", fieldPath, `${fieldPath} must be a list`);
  }
  const parsed = value.map((item, index) => {
    const path = `${fieldPath}.${index}`;
    const record = objectAt(item, path, [
      "id",
      "startFrame",
      "endFrame",
      "subjectMotion",
      "cameraMotion",
      "environmentMotion",
      "observableEnd",
    ]);
    const startFrame = readInt(record, path, "startFrame", { min: 0, max: durationFrames });
    const endFrame = readInt(record, path, "endFrame", { min: 0, max: durationFrames });
    if (endFrame <= startFrame) {
      throw new FilmContractError("invalid", `${path}.endFrame`, "A beat must end after it starts");
    }
    return {
      id: readProducerId(record, path, "id"),
      startFrame,
      endFrame,
      subjectMotion: prose(record, path, "subjectMotion"),
      cameraMotion: prose(record, path, "cameraMotion"),
      environmentMotion: prose(record, path, "environmentMotion"),
      observableEnd: prose(record, path, "observableEnd"),
    };
  });
  const ordered = [...parsed].sort((left, right) => left.startFrame - right.startFrame);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous && current && current.startFrame < previous.endFrame) {
      throw new FilmContractError("invalid", fieldPath, "Action beats overlap");
    }
  }
  return parsed;
}

function dialogue(value: unknown, fieldPath: string, durationFrames: number): DialogueLineV1[] {
  return mapObjects(
    value,
    fieldPath,
    ["speakerId", "language", "text", "delivery", "voiceId", "startFrame", "endFrame"],
    (record, path) => {
      const text = readString(record, path, "text", { required: true, max: 20_000 });
      const startFrame = readNullableInt(record, path, "startFrame", {
        min: 0,
        max: durationFrames,
      });
      const endFrame = readNullableInt(record, path, "endFrame", { min: 0, max: durationFrames });
      if (startFrame !== null && endFrame !== null && endFrame <= startFrame) {
        throw new FilmContractError(
          "invalid",
          `${path}.endFrame`,
          "Dialogue must end after it starts",
        );
      }
      return {
        speakerId: readProducerId(record, path, "speakerId"),
        language: readString(record, path, "language", { required: true, max: 32 }),
        text,
        delivery: prose(record, path, "delivery"),
        voiceId: readString(record, path, "voiceId", {
          required: true,
          allowEmpty: true,
          max: 120,
        }),
        startFrame,
        endFrame,
      };
    },
  );
}

export function parseSceneBrief(value: unknown): SceneBriefV1 {
  const record = objectAt(value, "scene", [...BRIEF_KEYS]);
  if (record.version !== 1) {
    throw new FilmContractError("invalid", "scene.version", "Scene briefs are version 1");
  }
  const authoring = objectAt(record.authoring, "scene.authoring", [
    "producer",
    "turnId",
    "patternId",
  ]);
  const camera = objectAt(record.camera, "scene.camera", [
    "framing",
    "angle",
    "lensIntent",
    "focusIntent",
    "opening",
    "ending",
    "path",
    "screenDirection",
    "axis",
  ]);
  const setting = objectAt(record.setting, "scene.setting", [
    "place",
    "lightSources",
    "lightDirection",
    "materials",
    "palette",
    "atmosphere",
  ]);
  const sound = objectAt(record.sound, "scene.sound", ["strategy", "ambience", "sfx", "music"]);
  const continuity = objectAt(record.continuity, "scene.continuity", [
    "locks",
    "allowedChanges",
    "exclusions",
    "entryAnchor",
    "exitAnchor",
  ]);
  const output = objectAt(record.output, "scene.output", [
    "kind",
    "width",
    "height",
    "fps",
    "durationFrames",
    "routePreference",
  ]);
  const kind = oneOf(output.kind, "scene.output.kind", ["video", "image"] as const);
  const width = readInt(output, "scene.output", "width", { min: 1, max: 16384 });
  const height = readInt(output, "scene.output", "height", { min: 1, max: 16384 });
  const fps = readInt(output, "scene.output", "fps", { min: kind === "image" ? 0 : 1, max: 120 });
  const durationFrames = readInt(output, "scene.output", "durationFrames", {
    min: kind === "image" ? 0 : 1,
    max: Math.max(fps, 1) * 3600,
  });
  if (kind === "image" && (fps !== 0 || durationFrames !== 0)) {
    throw new FilmContractError(
      "invalid",
      "scene.output",
      "Image output cannot carry video timing",
    );
  }
  const subjectsValue = record.subjects;
  if (!Array.isArray(subjectsValue)) {
    throw new FilmContractError("malformed", "scene.subjects", "scene.subjects must be a list");
  }
  const routePreference =
    output.routePreference === null
      ? null
      : oneOf(output.routePreference, "scene.output.routePreference", PROVIDER_ROUTES);
  return {
    version: 1,
    projectId: readProducerId(record, "scene", "projectId"),
    shotKey: readShotKey(record, "scene", "shotKey"),
    sourceRevisionId: readProducerId(record, "scene", "sourceRevisionId"),
    reviewRevision: readInt(record, "scene", "reviewRevision", { min: 0, max: 1_000_000 }),
    authoring: {
      producer: oneOf(authoring.producer, "scene.authoring.producer", [
        "human",
        "assistant",
      ] as const),
      turnId: readString(authoring, "scene.authoring", "turnId", {
        required: true,
        allowEmpty: true,
        max: 120,
      }),
      patternId: patternId(authoring.patternId, "scene.authoring.patternId"),
    },
    subjects: subjectsValue.map((item, index) => {
      const path = `scene.subjects.${index}`;
      const subject = objectAt(item, path, ["id", "facts"]);
      return {
        id: readProducerId(subject, path, "id"),
        facts: prose(subject, path, "facts"),
      };
    }),
    references: references(record.references, "scene.references"),
    camera: {
      framing: prose(camera, "scene.camera", "framing"),
      angle: prose(camera, "scene.camera", "angle"),
      lensIntent: prose(camera, "scene.camera", "lensIntent"),
      focusIntent: prose(camera, "scene.camera", "focusIntent"),
      opening: prose(camera, "scene.camera", "opening"),
      ending: prose(camera, "scene.camera", "ending"),
      path: prose(camera, "scene.camera", "path"),
      screenDirection: prose(camera, "scene.camera", "screenDirection"),
      axis: prose(camera, "scene.camera", "axis"),
    },
    setting: {
      place: prose(setting, "scene.setting", "place"),
      lightSources: prose(setting, "scene.setting", "lightSources"),
      lightDirection: prose(setting, "scene.setting", "lightDirection"),
      materials: prose(setting, "scene.setting", "materials"),
      palette: prose(setting, "scene.setting", "palette"),
      atmosphere: prose(setting, "scene.setting", "atmosphere"),
    },
    beats: beats(record.beats, "scene.beats", kind === "image" ? 1 : durationFrames),
    dialogue: dialogue(record.dialogue, "scene.dialogue", kind === "image" ? 1 : durationFrames),
    sound: {
      strategy: oneOf(sound.strategy, "scene.sound.strategy", SOUND_STRATEGIES),
      ambience: prose(sound, "scene.sound", "ambience"),
      sfx: prose(sound, "scene.sound", "sfx"),
      music: prose(sound, "scene.sound", "music"),
    },
    continuity: {
      locks: readStringList(continuity, "scene.continuity", "locks"),
      allowedChanges: readStringList(continuity, "scene.continuity", "allowedChanges"),
      exclusions: readStringList(continuity, "scene.continuity", "exclusions"),
      entryAnchor: prose(continuity, "scene.continuity", "entryAnchor"),
      exitAnchor: prose(continuity, "scene.continuity", "exitAnchor"),
    },
    output: { kind, width, height, fps, durationFrames, routePreference },
  };
}
