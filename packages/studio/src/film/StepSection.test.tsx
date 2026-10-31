// @vitest-environment happy-dom

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
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

function Field({ onUnmount }: { onUnmount: () => void }) {
  useEffect(() => onUnmount, [onUnmount]);
  return <textarea defaultValue="draft" />;
}

function render(view: StepView, onUnmount: () => void = () => {}, tick = 0) {
  if (!host.isConnected) document.body.appendChild(host);
  root ??= createRoot(host);
  act(() => {
    root?.render(
      <StepSection step={view}>
        <Field onUnmount={onUnmount} />
        <p data-tick={tick}>Body content</p>
      </StepSection>,
    );
  });
}

function toggle(): HTMLButtonElement {
  const button = host.querySelector("button[aria-expanded]");
  if (!(button instanceof HTMLButtonElement)) throw new Error("missing toggle");
  return button;
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

  it("keeps the same text field node when the step state changes", () => {
    const onUnmount = vi.fn();
    render(step("later"), onUnmount);
    act(() => toggle().click());
    const before = host.querySelector("textarea");
    expect(before).not.toBeNull();
    render(step("current"), onUnmount);
    expect(host.querySelector("textarea")).toBe(before);
    expect(onUnmount).not.toHaveBeenCalled();
  });

  it("keeps a section the maker opened open across an unrelated rerender", () => {
    render(step("done"));
    expect(host.textContent).not.toContain("Body content");
    act(() => toggle().click());
    expect(host.textContent).toContain("Body content");
    render(step("done"), () => {}, 1);
    expect(host.textContent).toContain("Body content");
  });

  it("puts the state in the toggle's accessible name", () => {
    render(step("current"));
    expect(toggle().getAttribute("aria-label")).toBe("Prompt, current step");
  });
});
