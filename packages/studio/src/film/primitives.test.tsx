// @vitest-environment happy-dom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SceneBriefV1 } from "@hyperframes/film-production/browser";
import { NativeParameters } from "./NativeParameters";
import { ProductionPanel } from "./index";
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
});
