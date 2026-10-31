// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockedButton } from "./BlockedButton";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
});

function mount(reason: string | null, onClick: () => void) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <BlockedButton reason={reason} onClick={onClick} type="button">
        Go
      </BlockedButton>,
    );
  });
  const button = host.querySelector("button");
  if (!button) throw new Error("missing button");
  return { host, button };
}

describe("BlockedButton", () => {
  it("is inert on click when blocked, and says why next to the button", () => {
    const onClick = vi.fn();
    const { host, button } = mount("Needs a thing", onClick);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.hasAttribute("disabled")).toBe(false);
    act(() => button.click());
    expect(onClick).not.toHaveBeenCalled();
    const reason = host.querySelector("p");
    expect(reason?.textContent).toBe("Needs a thing");
    expect(button.getAttribute("aria-describedby")).toBe(reason?.id);
  });

  it("stays focusable and ignores Enter and Space", () => {
    const onClick = vi.fn();
    const { button } = mount("Needs a thing", onClick);
    button.focus();
    expect(document.activeElement).toBe(button);
    for (const key of ["Enter", " "]) {
      act(() => {
        button.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        button.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      });
    }
    expect(onClick).not.toHaveBeenCalled();
  });

  it("wraps the button in a tooltip trigger when blocked", () => {
    const { button } = mount("Needs a thing", vi.fn());
    expect(button.parentElement?.className).toContain("contents");
  });

  it("behaves like Button when reason is null", () => {
    const onClick = vi.fn();
    const { host, button } = mount(null, onClick);
    expect(button.hasAttribute("aria-disabled")).toBe(false);
    expect(host.querySelector("p")).toBeNull();
    act(() => button.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
