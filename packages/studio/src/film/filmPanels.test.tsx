// @vitest-environment happy-dom

import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CompilationV1, SceneBriefV1 } from "@hyperframes/film-production/browser";
import {
  SCENE_PATTERNS,
  scenePattern,
  type ScenePatternId,
} from "@hyperframes/film-production/browser";
import { AssistantPanel, ProductionPanel } from "./index";
import { PatternChoice } from "./PatternChoice";
import type { AssistantPanelProps, ProductionPanelProps } from "./types";
import { dialogue, expandAll, sceneBrief, shot, snapshot } from "./testFixtures";
import { resolveVisibleProposal, type ProposalMemory } from "./visibleProposal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

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

const readyReadiness = {
  provider: "claude-external",
  state: "ready",
  evidence: "Signed in.",
} as const;

function assistantProps(overrides: Partial<AssistantPanelProps> = {}): AssistantPanelProps {
  return {
    contextLabel: "Table · plan:S1 · rev 2",
    readiness: {
      provider: "claude-external",
      state: "external-handoff",
      evidence: "Signed-in CLI is not running.",
    },
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
  // Base UI mounts popups after a frame.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
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
    expandAll(host);
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
    ]);
    // Actions sit above the steps so they never fold away.
    const actions = host.querySelector('[role="group"][aria-label="Production actions"]');
    const firstStep = host.querySelector("button[aria-expanded]");
    if (!actions || !firstStep) throw new Error("missing actions or first step");
    expect(actions.compareDocumentPosition(firstStep) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(
      0,
    );
  });

  it("keeps the dialogue exact when a pattern is chosen", async () => {
    const brief = sceneBrief();
    const onBriefChange = vi.fn<(brief: SceneBriefV1) => void>();
    const { host } = await mount(
      <ProductionPanel {...productionProps({ brief, onBriefChange })} />,
    );
    expandAll(host);
    await click(button(host, "Listening reaction"));
    expect(host.querySelector("[data-shot-dialogue]")?.textContent).toBe(dialogue);
    await click(host.querySelector('button[aria-label="More about scene patterns"]'));
    const popup = document.querySelector('[role="dialog"]')?.textContent;
    expect(popup).toContain("Stay on the listener. Do not whip back to the speaker.");
    expect(popup).toContain("The incoming line can be off-screen. Do not invent a reply.");
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
    expandAll(host);
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
    expect(duration?.getAttribute("role")).toBe("combobox");
    expect(duration?.textContent).toContain("72");
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
  it("shows readiness in plain words, not the raw state", async () => {
    const { host } = await mount(<AssistantPanel {...assistantProps()} />);
    expect(host.textContent).toContain("Claude works in your own session");
    expect(host.textContent).not.toContain("external-handoff");
  });

  it("does not apply a proposal when Send is clicked", async () => {
    const onApply = vi.fn();
    const onSend = vi.fn();
    const { host } = await mount(
      <AssistantPanel {...assistantProps({ onApply, onSend, readiness: readyReadiness })} />,
    );
    expect(host.querySelector("[data-proposal-dialogue]")?.textContent).toBe(dialogue);
    expect(host.querySelector("[data-current-dialogue]")?.textContent).toBe(
      "A line already in the cut.",
    );
    await click(button(host, "Send"));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("blocks Send with the readiness words until the assistant is ready", async () => {
    const onSend = vi.fn();
    const { host } = await mount(<AssistantPanel {...assistantProps({ onSend })} />);
    const send = button(host, "Send");
    expect(send?.getAttribute("aria-disabled")).toBe("true");
    expect(send?.closest("div")?.textContent).toContain("Claude works in your own session");
    await click(send);
    expect(onSend).not.toHaveBeenCalled();
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
    expect(button(host, "Apply")?.getAttribute("aria-disabled")).toBe("true");
  });

  it("keeps Apply disabled until a proposal exists", async () => {
    const onApply = vi.fn();
    const { host } = await mount(
      <AssistantPanel {...assistantProps({ proposal: null, onApply })} />,
    );
    expect(button(host, "Apply")?.getAttribute("aria-disabled")).toBe("true");
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
        <AssistantPanel {...assistantProps({ onSend, onApply, readiness: readyReadiness })} />
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

describe("dirty draft across shots", () => {
  async function type(el: HTMLTextAreaElement, text: string) {
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    await act(async () => {
      set?.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("never writes a draft typed on shot A into shot B's brief", async () => {
    const briefA = sceneBrief();
    const briefB: SceneBriefV1 = { ...sceneBrief("Another line."), shotKey: "plan:S2" };
    const shotB = { ...shot("Another line."), shotKey: "plan:S2" };
    const onBriefChange = vi.fn<(brief: SceneBriefV1) => void>();
    const { host, render } = await mount(
      <ProductionPanel {...productionProps({ brief: briefA, onBriefChange })} />,
    );
    expandAll(host);
    const area = host.querySelector<HTMLTextAreaElement>('textarea[aria-label="Framing"]');
    if (!area) throw new Error("missing framing field");
    await type(area, "Typed on shot A");
    await render(
      <ProductionPanel {...productionProps({ shot: shotB, brief: briefB, onBriefChange })} />,
    );
    expandAll(host);
    const next = host.querySelector<HTMLTextAreaElement>('textarea[aria-label="Framing"]');
    await act(async () => {
      next?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      next?.blur();
    });
    await act(async () => {
      root?.unmount();
      root = null;
    });
    for (const [written] of onBriefChange.mock.calls) {
      expect(written.shotKey).toBe("plan:S1");
    }
    expect(next?.value).not.toContain("Typed on shot A");
  });
});

describe("film text size", () => {
  // The text size lives on the control or its wrapper box; the nearest step class wins.
  function stepOf(el: Element): string | null {
    const owner = el.closest('[class*="text-step-"]');
    return owner?.className.match(/text-step-\d+/)?.[0] ?? null;
  }
  const controls = (root: ParentNode) => [
    ...root.querySelectorAll('textarea, [role="combobox"], [role="option"]'),
  ];

  it("sets every production field and select to 12px", async () => {
    const { host } = await mount(
      <ProductionPanel {...productionProps({ snapshot: snapshot(), brief: sceneBrief() })} />,
    );
    expandAll(host);
    const found = controls(host);
    expect(found.some((el) => el.tagName === "TEXTAREA")).toBe(true);
    expect(found.some((el) => el.getAttribute("role") === "combobox")).toBe(true);
    expect(found.map(stepOf).filter((step) => step !== "text-step-12")).toEqual([]);
    expect(host.querySelector('[class~="text-[11px]"]')).toBeNull();
  });

  it("sets the assistant instruction to 12px", async () => {
    const { host } = await mount(<AssistantPanel {...assistantProps()} />);
    const found = controls(host);
    expect(found.length).toBeGreaterThan(0);
    expect(found.map(stepOf).filter((step) => step !== "text-step-12")).toEqual([]);
  });

  it("sets open Select popup items to 12px", async () => {
    const { host } = await mount(
      <ProductionPanel {...productionProps({ snapshot: snapshot(), brief: sceneBrief() })} />,
    );
    expandAll(host);
    await click(host.querySelector('[aria-label="Sound strategy"]'));
    const items = [...document.querySelectorAll('[role="option"]')];
    expect(items.length).toBeGreaterThan(0);
    expect(items.map(stepOf).filter((step) => step !== "text-step-12")).toEqual([]);
  });
});

describe("PatternChoice heading", () => {
  it("is a plain headed group, not a collapsible section", async () => {
    const { host } = await mount(<PatternChoice pattern={null} onPick={vi.fn()} />);
    const heading = [...host.querySelectorAll("h4")].find((h) => h.textContent === "Pattern");
    expect(heading).toBeDefined();
    expect(host.querySelector("[aria-expanded]")).toBeNull();
  });
});

describe("PatternChoice keyboard", () => {
  const ids = SCENE_PATTERNS.map((pattern) => pattern.id);
  const last = ids.length - 1;

  function radios(host: ParentNode): HTMLElement[] {
    return [...host.querySelectorAll<HTMLElement>('[role="radio"]')];
  }

  async function press(el: Element, key: string, mods: KeyboardEventInit = {}) {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...mods });
    await act(async () => {
      el.dispatchEvent(event);
    });
    return event;
  }

  async function mountChoice(initial: ScenePatternId | null) {
    const picks: ScenePatternId[] = [];
    function Harness() {
      const [id, setId] = useState<ScenePatternId | null>(initial);
      return (
        <PatternChoice
          pattern={id ? scenePattern(id) : null}
          onPick={(next) => {
            picks.push(next);
            setId(next);
          }}
        />
      );
    }
    const { host } = await mount(<Harness />);
    return { host, picks };
  }

  function focused(host: ParentNode, index: number): HTMLElement {
    const node = radios(host)[index];
    if (!node) throw new Error("missing radio");
    node.focus();
    return node;
  }

  function tabStops(host: ParentNode): number[] {
    return radios(host).flatMap((el, i) => (el.tabIndex === 0 ? [i] : []));
  }

  it.each([
    ["ArrowDown", 1],
    ["ArrowRight", 1],
    ["ArrowUp", last],
    ["ArrowLeft", last],
  ])("%s from the first option focuses and picks index %i", async (key, to) => {
    const { host, picks } = await mountChoice(ids[0] ?? null);
    await press(focused(host, 0), key);
    expect(document.activeElement).toBe(radios(host)[to]);
    expect(picks).toEqual([ids[to]]);
    expect(tabStops(host)).toEqual([to]);
  });

  it.each([
    ["ArrowDown", 0],
    ["ArrowRight", 0],
    ["ArrowUp", last - 1],
    ["ArrowLeft", last - 1],
  ])("%s from the last option focuses and picks index %i", async (key, to) => {
    const { host, picks } = await mountChoice(ids[last] ?? null);
    await press(focused(host, last), key);
    expect(document.activeElement).toBe(radios(host)[to]);
    expect(picks).toEqual([ids[to]]);
    expect(tabStops(host)).toEqual([to]);
  });

  it("keeps one tab stop: the selected option, or the first when none is selected", async () => {
    const chosen = await mountChoice(ids[2] ?? null);
    expect(tabStops(chosen.host)).toEqual([2]);
    const none = await mountChoice(null);
    expect(tabStops(none.host)).toEqual([0]);
  });

  it("walks the whole ring once per keypress", async () => {
    const { host, picks } = await mountChoice(ids[0] ?? null);
    let current: Element = focused(host, 0);
    for (let i = 1; i <= ids.length; i++) {
      await press(current, "ArrowDown");
      current = radios(host)[i % ids.length] ?? current;
      expect(document.activeElement).toBe(radios(host)[i % ids.length]);
    }
    expect(picks).toEqual([...ids.slice(1), ids[0]]);
  });

  it("ignores other keys", async () => {
    const { host, picks } = await mountChoice(ids[0] ?? null);
    const start = focused(host, 0);
    const event = await press(start, "a");
    expect(picks).toEqual([]);
    expect(document.activeElement).toBe(start);
    expect(event.defaultPrevented).toBe(false);
  });

  it("marks handled arrows as default-prevented", async () => {
    const { host } = await mountChoice(ids[0] ?? null);
    const event = await press(focused(host, 0), "ArrowDown");
    expect(event.defaultPrevented).toBe(true);
  });

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])(
    "leaves %s plus an arrow to the browser",
    async (mod) => {
      const { host, picks } = await mountChoice(ids[0] ?? null);
      const start = focused(host, 0);
      for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
        const event = await press(start, key, { [mod]: true });
        expect(event.defaultPrevented).toBe(false);
      }
      expect(picks).toEqual([]);
      expect(document.activeElement).toBe(start);
    },
  );

  it("shows one plain line, and the full text only behind a named More button", async () => {
    const { host } = await mountChoice("listening-reaction");
    const pattern = scenePattern("listening-reaction");
    expect(host.textContent).toContain(pattern.summary);
    expect(host.textContent).not.toContain(pattern.cameraConstraint);
    const more = host.querySelector('button[aria-label="More about scene patterns"]');
    expect(more?.textContent?.trim()).toBe("More");
    await click(more);
    const popup = document.querySelector('[role="dialog"]');
    expect(popup?.textContent).toContain(pattern.cameraConstraint);
    expect(popup?.textContent).toContain(pattern.soundConstraint);
    expect(popup?.textContent).toContain("Who it is");
    expect(popup?.textContent).not.toContain("identity");
  });
});
