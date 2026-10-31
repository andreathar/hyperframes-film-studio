import type { CapabilitySnapshotV1, SceneBriefV1 } from "@hyperframes/film-production/browser";

/** Indexed from the browser contracts. The package does not re-export these names. */
export type AccountModel = CapabilitySnapshotV1["models"][number];
export type SceneReferenceBinding = SceneBriefV1["references"][number];
export type ReferenceRole = SceneReferenceBinding["role"];
export type SoundStrategy = SceneBriefV1["sound"]["strategy"];
