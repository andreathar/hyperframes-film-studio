// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { StepSection } from "./StepSection";
import type { StepState, StepView } from "./steps";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
const host = document.createElement("div");

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host.remove();
});

function step(state: StepState, blockedBy: StepView["blockedBy"] = null): StepView {
  return { id: "prompt", state, summary: "Summary text", hint: "Hint text", blockedBy };
}

function render(view: StepView) {
  if (!host.isConnected) document.body.appendChild(host);
  root ??= createRoot(host);
  act(() => {
    root?.render(
      <StepSection step={view}>
        <p>Body content</p>
      </StepSection>,
    );
  });
}

describe("StepSection", () => {
  it("opens the current step and folds done and later steps", () => {
    render(step("current"));
    expect(host.textContent).toContain("Body content");
    expect(host.querySelector('[aria-label="Current step"]')).not.toBeNull();
    render(step("done"));
    expect(host.textContent).not.toContain("Body content");
    expect(host.querySelector('[aria-label="Done"]')).not.toBeNull();
    render(step("later"));
    expect(host.textContent).not.toContain("Body content");
    expect(host.querySelector('[aria-label="Later"]')).not.toBeNull();
  });

  it("re-folds when the state changes after mount", () => {
    render(step("later"));
    expect(host.textContent).not.toContain("Body content");
    render(step("current"));
    expect(host.textContent).toContain("Body content");
    render(step("done"));
    expect(host.textContent).not.toContain("Body content");
  });

  it("shows the summary on the header and names what blocks a step", () => {
    render(step("blocked", "shot"));
    expect(host.textContent).toContain("Summary text");
    expect(host.querySelector('[aria-label="Blocked by Film project"]')).not.toBeNull();
  });
});
