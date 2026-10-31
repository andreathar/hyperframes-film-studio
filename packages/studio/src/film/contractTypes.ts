import type {
  CapabilitySnapshotV1,
  ReferenceRole,
  SceneBriefV1,
  SoundStrategyV1,
} from "@hyperframes/film-production/browser";

export type AccountModel = CapabilitySnapshotV1["models"][number];
export type SceneReferenceBinding = SceneBriefV1["references"][number];
export type { ReferenceRole };
export type SoundStrategy = SoundStrategyV1;
