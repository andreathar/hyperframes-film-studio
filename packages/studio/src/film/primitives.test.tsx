// @vitest-environment happy-dom

import { act, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SceneBriefV1 } from "@hyperframes/film-production/browser";
import { ChoiceSelect, NativeParameters } from "./NativeParameters";
import { ProductionPanel } from "./index";
import type { NativeChoice } from "./nativeChoices";
import { sceneBrief, shot, snapshot } from "./testFixtures";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
});

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

function panelProps(overrides: Partial<ComponentProps<typeof ProductionPanel>> = {}) {
  return {
    shot: shot(),
    brief: sceneBrief(),
    compilation: null,
    snapshot: snapshot(),
    onBriefChange: vi.fn(),
    onApplyProposal: vi.fn(),
    onPrepare: vi.fn(),
    ...overrides,
  } satisfies ComponentProps<typeof ProductionPanel>;
}

function firstField(host: HTMLElement): HTMLTextAreaElement {
  const el = host.querySelector("textarea[data-ui-input]");
  if (!(el instanceof HTMLTextAreaElement)) throw new Error("missing film field");
  return el;
}

async function typeInto(el: HTMLTextAreaElement, text: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function withDuration(brief: SceneBriefV1, durationFrames: number): SceneBriefV1 {
  return { ...brief, output: { ...brief.output, durationFrames } };
}

describe("film panels on Studio primitives", () => {
  it("shows the new brief's value after the brief changes (no stale copy)", async () => {
    const noop = vi.fn();
    const a = withDuration(sceneBrief(), 72);
    const b = withDuration(sceneBrief(), 120);
    const { host, render } = await mount(
      <NativeParameters snapshot={snapshot()} brief={a} onBriefChange={noop} />,
    );
    const trigger = () => host.querySelector('[aria-label="account-model-a Duration frames"]');
    expect(trigger()?.getAttribute("role")).toBe("combobox");
    expect(trigger()?.textContent).toContain("72");
    await render(<NativeParameters snapshot={snapshot()} brief={b} onBriefChange={noop} />);
    expect(trigger()?.textContent).toContain("120");
    expect(trigger()?.textContent).not.toContain("72");
  });

  it("uses no raw select and no bare textarea in the Production panel", async () => {
    const { host } = await mount(
      <ProductionPanel
        shot={shot()}
        brief={sceneBrief()}
        compilation={null}
        snapshot={snapshot()}
        onBriefChange={vi.fn()}
        onApplyProposal={vi.fn()}
        onPrepare={vi.fn()}
      />,
    );
    expect(host.querySelector("textarea[data-ui-input]")).not.toBeNull();
    expect(document.querySelectorAll("select, textarea:not([data-ui-input])")).toHaveLength(0);
  });

  it("commits a typed film field into the brief when Prepare is pressed", async () => {
    const onBriefChange = vi.fn<(brief: SceneBriefV1) => void>();
    const onPrepare = vi.fn();
    const { host } = await mount(<ProductionPanel {...panelProps({ onBriefChange, onPrepare })} />);
    const field = firstField(host);
    await typeInto(field, "A new visible line.");
    const prepare = [...host.querySelectorAll("button")].find(
      (el) => el.textContent?.trim() === "Prepare",
    );
    if (!prepare) throw new Error("missing Prepare");
    // A pointer press moves focus off the field first, which blurs it.
    await act(async () => {
      field.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      prepare.click();
    });
    expect(onBriefChange).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(onBriefChange.mock.calls[0]?.[0])).toContain("A new visible line.");
    expect(onPrepare).toHaveBeenCalledTimes(1);
  });

  it("commits a typed film field when the panel unmounts without a blur", async () => {
    const onBriefChange = vi.fn<(brief: SceneBriefV1) => void>();
    const props = panelProps({ onBriefChange });
    const { host, render } = await mount(<ProductionPanel {...props} />);
    await typeInto(firstField(host), "Typed then switched away.");
    expect(onBriefChange).not.toHaveBeenCalled();
    await render(<div />);
    expect(onBriefChange).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(onBriefChange.mock.calls[0]?.[0])).toContain("Typed then switched away.");
  });

  it("shows an unchoosable option as disabled with its reason", async () => {
    const choice: NativeChoice = {
      key: "ratio",
      label: "Ratio",
      selected: "16:9",
      options: [
        { value: "16:9", label: "16:9" },
        { value: "1:1", label: "1:1", disabled: true, reason: "Not offered at this length" },
      ],
    };
    await mount(
      <ChoiceSelect
        modelId="account-model-a"
        choice={choice}
        brief={sceneBrief()}
        onBriefChange={vi.fn()}
      />,
    );
    const trigger = document.querySelector('[aria-label="account-model-a Ratio"]');
    if (!(trigger instanceof HTMLElement)) throw new Error("missing trigger");
    await act(async () => {
      trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
      trigger.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));
      trigger.click();
      await new Promise((r) => setTimeout(r, 0));
    });
    const options = [...document.querySelectorAll('[role="option"]')];
    const blocked = options.find((el) => el.textContent?.includes("1:1"));
    expect(blocked?.textContent).toContain("Not offered at this length");
    expect(
      blocked?.hasAttribute("data-disabled") || blocked?.getAttribute("aria-disabled"),
    ).toBeTruthy();
    const open = options.find((el) => el.textContent === "16:9");
    expect(open?.hasAttribute("data-disabled")).toBe(false);
  });
});
