// @vitest-environment happy-dom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CapabilitySnapshotV1,
  CompilationV1,
  SceneBriefV1,
} from "@hyperframes/film-production/browser";
import { AssistantPanel, ProductionPanel } from "./index";
import type { AssistantPanelProps, ProductionPanelProps, ProductionShot } from "./types";
import { resolveVisibleProposal, type ProposalMemory } from "./visibleProposal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const dialogue = "Já chega — fica.";

function shot(line = dialogue): ProductionShot {
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

function sceneBrief(line = dialogue, producer: "human" | "assistant" = "human"): SceneBriefV1 {
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

function compilation(message: string): CompilationV1 {
  return {
    prompt: "Hold the face.",
    nativeCandidate: null,
    diagnostics: [{ code: "malformed", severity: "error", path: "beats.1", message }],
    sceneSha256: "ab",
    compilationSha256: "cd",
    capabilitySnapshotSha256: null,
    executable: false,
  };
}

function snapshot(): CapabilitySnapshotV1 {
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

const bannedModels = [
  "kling-v1",
  "kling-v1-6",
  "kling-v2",
  "kling-v2-master",
  "omni",
  "kling-video",
];

function productionProps(overrides: Partial<ProductionPanelProps> = {}): ProductionPanelProps {
  return {
    shot: shot(),
    brief: sceneBrief(),
    compilation: null,
    snapshot: null,
    onBriefChange: vi.fn(),
    onApplyProposal: vi.fn(),
    onPrepare: vi.fn(),
    ...overrides,
  };
}

function assistantProps(overrides: Partial<AssistantPanelProps> = {}): AssistantPanelProps {
  return {
    contextLabel: "Table · plan:S1 · rev 2",
    readiness: { state: "external-handoff", evidence: "Signed-in CLI is not running." },
    proposal: sceneBrief(dialogue, "assistant"),
    shotDialogue: "A line already in the cut.",
    draftInstruction: "Hold the look left.",
    onInstructionChange: vi.fn(),
    onSend: vi.fn(),
    onApply: vi.fn(),
    onCancel: vi.fn(),
    onCopyHandoff: vi.fn(),
    ...overrides,
  };
}

let root: Root | null = null;

function cleanup() {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
}

afterEach(cleanup);

async function mount(node: ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root?.render(node);
  });
  return {
    host,
    render: async (next: ReactNode) => {
      await act(async () => {
        root?.render(next);
      });
    },
  };
}

async function click(el: Element | null) {
  if (!(el instanceof HTMLElement)) throw new Error("missing control");
  await act(async () => {
    el.click();
  });
}

function button(host: ParentNode, name: string) {
  return [...host.querySelectorAll("button")].find((el) => el.textContent?.trim() === name) ?? null;
}

function expectOrder(text: string, markers: string[]) {
  let at = -1;
  for (const marker of markers) {
    const next = text.indexOf(marker, at + 1);
    expect(next, marker).toBeGreaterThan(at);
    at = next;
  }
}

describe("resolveVisibleProposal", () => {
  const proposal = sceneBrief();
  const memory = (label: string, hidden: SceneBriefV1 | null): ProposalMemory => ({
    label,
    hidden,
  });

  it("hides the proposal that was on screen when the context changes", () => {
    const first = resolveVisibleProposal("A", proposal, memory("A", null));
    expect(first.visible).toBe(proposal);
    const switched = resolveVisibleProposal("B", proposal, first.memory);
    expect(switched.visible).toBeNull();
    const still = resolveVisibleProposal("B", proposal, switched.memory);
    expect(still.visible).toBeNull();
    const cleared = resolveVisibleProposal("B", null, switched.memory);
    expect(cleared.visible).toBeNull();
    const next = sceneBrief("Outra fala.");
    expect(resolveVisibleProposal("B", next, cleared.memory).visible).toBe(next);
  });
});

describe("ProductionPanel", () => {
  it("renders the shot dialogue unchanged, including accents", async () => {
    const { host } = await mount(<ProductionPanel {...productionProps()} />);
    expect(host.querySelector("[data-shot-dialogue]")?.textContent).toBe(dialogue);
    expectOrder(host.textContent ?? "", [
      dialogue,
      "Reference roles",
      "Restrained dialogue coverage",
      "Reference grounding",
      "Opening composition",
      "Timed action",
      "Camera rhythm",
      "Environment and light",
      "Dialogue and sound",
      "Continuity and exclusions",
      "Diagnostics",
      "Native parameters",
      "Prepare",
    ]);
  });

  it("keeps the dialogue exact when a pattern is chosen", async () => {
    const brief = sceneBrief();
    const onBriefChange = vi.fn<(brief: SceneBriefV1) => void>();
    const { host } = await mount(
      <ProductionPanel {...productionProps({ brief, onBriefChange })} />,
    );
    await click(button(host, "Listening reaction"));
    expect(host.querySelector("[data-shot-dialogue]")?.textContent).toBe(dialogue);
    expect(host.textContent).toContain("Stay on the listener. Do not whip back to the speaker.");
    expect(host.textContent).toContain(
      "The incoming line can be off-screen. Do not invent a reply.",
    );
    expect(onBriefChange).toHaveBeenCalledTimes(1);
    const next = onBriefChange.mock.calls[0]?.[0];
    expect(next?.dialogue).toBe(brief.dialogue);
    expect(next?.dialogue[0]?.text).toBe(dialogue);
    expect(next.authoring.patternId).toBe("listening-reaction");
  });

  it("does not render a model name when the account snapshot is unresolved", async () => {
    const { host } = await mount(
      <ProductionPanel {...productionProps({ brief: null, snapshot: null })} />,
    );
    const html = host.innerHTML.toLowerCase();
    for (const name of bannedModels) expect(html).not.toContain(name);
    expect(host.textContent).toContain("The account snapshot is unresolved.");
    expect(host.textContent).not.toContain("account-model-a");
    expect(host.textContent).not.toContain("Ready");
  });

  it("shows native fields from the snapshot model only", async () => {
    const { host } = await mount(
      <ProductionPanel {...productionProps({ snapshot: snapshot(), brief: sceneBrief() })} />,
    );
    expect(host.textContent).toContain("account-model-a");
    expect(host.textContent).toContain("fixture-mode");
    expect(host.textContent).not.toContain("The account snapshot is unresolved.");
    const duration = host.querySelector('[aria-label="account-model-a Duration frames"]');
    expect(duration).toBeInstanceOf(HTMLSelectElement);
    if (!(duration instanceof HTMLSelectElement)) return;
    expect(duration.options).toHaveLength(2);
  });

  it("shows compilation diagnostics the parent passed in", async () => {
    const message = "Malformed scene: beats overlap.";
    const { host } = await mount(
      <ProductionPanel {...productionProps({ compilation: compilation(message) })} />,
    );
    expect(host.textContent).toContain(message);
    expect(host.textContent).toContain("malformed");
  });

  it("does not prepare because a proposal brief arrived", async () => {
    const onPrepare = vi.fn();
    const onApplyProposal = vi.fn();
    const props = productionProps({ brief: null, onPrepare, onApplyProposal });
    const { render } = await mount(<ProductionPanel {...props} />);
    await render(<ProductionPanel {...props} brief={sceneBrief(dialogue, "assistant")} />);
    expect(onPrepare).not.toHaveBeenCalled();
    expect(onApplyProposal).not.toHaveBeenCalled();
  });
});

describe("AssistantPanel", () => {
  it("does not apply a proposal when Send is clicked", async () => {
    const onApply = vi.fn();
    const onSend = vi.fn();
    const { host } = await mount(<AssistantPanel {...assistantProps({ onApply, onSend })} />);
    expect(host.querySelector("[data-proposal-dialogue]")?.textContent).toBe(dialogue);
    expect(host.querySelector("[data-current-dialogue]")?.textContent).toBe(
      "A line already in the cut.",
    );
    await click(button(host, "Send"));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("drops the visible proposal when the context changes and keeps the instruction", async () => {
    const onApply = vi.fn();
    const onInstructionChange = vi.fn();
    const props = assistantProps({ onApply, onInstructionChange });
    const { host, render } = await mount(<AssistantPanel {...props} />);
    expect(host.textContent).toContain(dialogue);
    await render(<AssistantPanel {...props} contextLabel="Table · plan:S2 · rev 2" />);
    expect(host.textContent).not.toContain(dialogue);
    expect(host.querySelector("textarea")?.value).toBe("Hold the look left.");
    expect(onApply).not.toHaveBeenCalled();
    expect(onInstructionChange).not.toHaveBeenCalled();
    expect(button(host, "Apply")?.hasAttribute("disabled")).toBe(true);
  });

  it("keeps Apply disabled until a proposal exists", async () => {
    const onApply = vi.fn();
    const { host } = await mount(
      <AssistantPanel {...assistantProps({ proposal: null, onApply })} />,
    );
    expect(button(host, "Apply")?.hasAttribute("disabled")).toBe(true);
    await click(button(host, "Apply"));
    expect(onApply).not.toHaveBeenCalled();
  });
});

describe("Production and Assistant actions", () => {
  it("keeps Prepare a different control from Send", async () => {
    const onPrepare = vi.fn();
    const onSend = vi.fn();
    const onApply = vi.fn();
    const { host } = await mount(
      <>
        <ProductionPanel {...productionProps({ onPrepare })} />
        <AssistantPanel {...assistantProps({ onSend, onApply })} />
      </>,
    );
    const prepare = button(host, "Prepare");
    const send = button(host, "Send");
    expect(prepare).not.toBe(send);
    expect(prepare?.tagName).toBe("BUTTON");
    expect(send?.tagName).toBe("BUTTON");
    expect(button(host, "Cancel")?.tagName).toBe("BUTTON");
    expect(button(host, "Copy handoff")?.tagName).toBe("BUTTON");
    await click(prepare);
    expect(onPrepare).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
    await click(send);
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onPrepare).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });
});
