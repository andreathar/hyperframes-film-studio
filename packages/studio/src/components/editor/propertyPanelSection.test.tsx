// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Section } from "./propertyPanelPrimitives";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
const host = document.createElement("div");

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host.remove();
});

function render(node: React.ReactNode) {
  if (!host.isConnected) document.body.appendChild(host);
  root ??= createRoot(host);
  act(() => root?.render(node));
}

function toggle(): HTMLButtonElement {
  const button = host.querySelector("button[aria-expanded]");
  if (!(button instanceof HTMLButtonElement)) throw new Error("missing toggle");
  return button;
}

describe("Section fold state", () => {
  it("stays uncontrolled by default and reads defaultCollapsed on mount", () => {
    render(
      <Section title="Alpha" icon={null} defaultCollapsed>
        <p>Inside</p>
      </Section>,
    );
    expect(host.textContent).not.toContain("Inside");
    act(() => toggle().click());
    expect(host.textContent).toContain("Inside");
    expect(toggle().getAttribute("aria-label")).toBeNull();
  });

  it("follows a controlled collapsed prop and reports the maker's toggle", () => {
    const onCollapsedChange = vi.fn();
    render(
      <Section title="Alpha" icon={null} collapsed onCollapsedChange={onCollapsedChange}>
        <p>Inside</p>
      </Section>,
    );
    act(() => toggle().click());
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(host.textContent).not.toContain("Inside");
  });
});
