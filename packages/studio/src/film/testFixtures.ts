import { act } from "react";
import type { CapabilitySnapshotV1, SceneBriefV1 } from "@hyperframes/film-production/browser";
import type { ProductionShot } from "./types";

export const dialogue = "Já chega — fica.";

export function shot(line = dialogue): ProductionShot {
  return {
    shotKey: "plan:S1",
    title: "The table",
    direction: {
      camera: "Locked medium close-up",
      acting: "She finishes the sentence",
      dialogue: line,
      lighting: "Window from frame left",
      continuity: "Still seated",
    },
    lineIds: ["L12"],
    references: [{ id: "ref-face", role: "identity", sha256: "a".repeat(64), mediaKind: "image" }],
  };
}

export function sceneBrief(
  line = dialogue,
  producer: "human" | "assistant" = "human",
): SceneBriefV1 {
  return {
    version: 1,
    projectId: "table",
    shotKey: "plan:S1",
    sourceRevisionId: "source1",
    reviewRevision: 2,
    authoring: { producer, turnId: "turn-1", patternId: "restrained-dialogue" },
    subjects: [{ id: "ada", facts: "The woman already cast for this shot." }],
    references: [
      {
        referenceId: "ref-face",
        sha256: "a".repeat(64),
        mediaKind: "image",
        subjectId: "ada",
        role: "identity",
        control: "native",
        exclusions: [],
      },
    ],
    camera: {
      framing: "Medium close-up",
      angle: "Eye level",
      lensIntent: "A short lens",
      focusIntent: "Eyes",
      opening: "She is already looking off-screen left",
      ending: "She is still looking off-screen left",
      path: "Locked",
      screenDirection: "Looks left",
      axis: "Hold the line",
    },
    setting: {
      place: "A quiet room",
      lightSources: "Window",
      lightDirection: "From frame left",
      materials: "Wood",
      palette: "Warm shadow",
      atmosphere: "Still",
    },
    beats: [
      {
        id: "beat1",
        startFrame: 0,
        endFrame: 48,
        subjectMotion: "She finishes the sentence.",
        cameraMotion: "The frame stays put.",
        environmentMotion: "Dust in the window light.",
        observableEnd: "Her mouth is closed.",
      },
    ],
    dialogue: [
      {
        speakerId: "ada",
        language: "pt",
        text: line,
        delivery: "Quiet, no smile",
        voiceId: "",
        startFrame: 12,
        endFrame: 40,
      },
    ],
    sound: { strategy: "separate-edit", ambience: "Room tone", sfx: "", music: "" },
    continuity: {
      locks: ["Look left"],
      allowedChanges: [],
      exclusions: ["No second person"],
      entryAnchor: "Already seated",
      exitAnchor: "Still seated",
    },
    output: {
      kind: "video",
      width: 1920,
      height: 1080,
      fps: 24,
      durationFrames: 96,
      routePreference: "kling",
    },
  };
}

export function snapshot(): CapabilitySnapshotV1 {
  return {
    version: 1,
    route: "kling",
    runtimeIdentity: "runtime-fixture",
    schemaDigest: "digest",
    models: [
      {
        id: "account-model-a",
        durationFrames: [72, 120],
        ratios: ["16:9"],
        resolutions: [{ width: 1280, height: 720 }],
        counts: [1],
        enums: { mode: ["fixture-mode"] },
        slots: [{ name: "image_1", mediaKinds: ["image"], required: true }],
        maxReferences: 1,
        unsupportedCombinations: [],
      },
    ],
  };
}

/** Opens every folded section, nested ones included, as a person would. */
export function expandAll(host: ParentNode): void {
  for (let pass = 0; pass < 4; pass += 1) {
    const folded = [...host.querySelectorAll<HTMLElement>('button[aria-expanded="false"]')];
    if (folded.length === 0) return;
    act(() => {
      for (const control of folded) control.click();
    });
  }
}
