// @vitest-environment happy-dom

import { act, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import type { SceneBriefV1, ScenePatternId } from "@hyperframes/film-production/browser";
import { usePinnedPattern } from "./patternPin";
import { useVisibleProposal } from "./visibleProposal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const roots: Root[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
});

function brief(line: string): SceneBriefV1 {
  return {
    version: 1,
    projectId: "table",
    shotKey: "plan:S1",
    sourceRevisionId: "source1",
    reviewRevision: 2,
    authoring: { producer: "assistant", turnId: "turn-1", patternId: "restrained-dialogue" },
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

function mount(): { render: (node: ReactNode) => void } {
  const container = document.createElement("div");
  const root = createRoot(container);
  roots.push(root);
  return {
    render: (node) => act(() => root.render(<StrictMode>{node}</StrictMode>)),
  };
}

describe("usePinnedPattern under StrictMode", () => {
  let pick: ((id: ScenePatternId) => void) | null = null;
  let seen: ScenePatternId | null = null;
  function Probe({ shotKey }: { shotKey: string }) {
    const [pattern, pickPattern] = usePinnedPattern(shotKey);
    seen = pattern;
    pick = pickPattern;
    return null;
  }

  it("keeps a pick on the same shot and clears it on another shot", () => {
    const view = mount();
    view.render(<Probe shotKey="A" />);
    const id: ScenePatternId = "restrained-dialogue";
    act(() => pick?.(id));
    expect(seen).toBe(id);
    view.render(<Probe shotKey="A" />);
    expect(seen).toBe(id);
    view.render(<Probe shotKey="B" />);
    expect(seen).toBeNull();
    view.render(<Probe shotKey="A" />);
    expect(seen).toBeNull();
  });
});

describe("useVisibleProposal under StrictMode", () => {
  let visible: SceneBriefV1 | null = null;
  function Probe({ label, proposal }: { label: string; proposal: SceneBriefV1 | null }) {
    visible = useVisibleProposal(label, proposal);
    return null;
  }

  it("keeps a proposal hidden by a context switch hidden, and shows a new one", () => {
    const view = mount();
    const first = brief("one");
    view.render(<Probe label="IN-03" proposal={null} />);
    view.render(<Probe label="IN-04" proposal={first} />);
    expect(visible).toBeNull();
    view.render(<Probe label="IN-04" proposal={first} />);
    expect(visible).toBeNull();
    const second = brief("two");
    view.render(<Probe label="IN-04" proposal={second} />);
    expect(visible).toBe(second);
    view.render(<Probe label="IN-04" proposal={second} />);
    expect(visible).toBe(second);
  });
});
