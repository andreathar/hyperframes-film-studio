// @vitest-environment happy-dom
/** TextArea: blur commits, Escape reverts, live drafts, unmount commits, external updates keep a dirty draft. */
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TextArea } from "./Input";
import { cleanupMounted, mountHost as render, trackedRoot } from "./mountHost.testHelpers";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanupMounted);

function area(host: HTMLElement): HTMLTextAreaElement {
  const el = host.querySelector("textarea");
  if (!el) throw new Error("missing textarea");
  return el;
}

function type(el: HTMLTextAreaElement, text: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.bind(el);
    setter(text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function blur(el: HTMLTextAreaElement) {
  act(() => {
    el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  });
}

function escape(el: HTMLTextAreaElement) {
  act(() => void el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })));
}

describe("TextArea", () => {
  it("sets data-ui-input", () => {
    const host = render(<TextArea value="a" onCommit={() => {}} />);
    expect(area(host).hasAttribute("data-ui-input")).toBe(true);
  });

  it("commits the draft on blur", () => {
    const onCommit = vi.fn();
    const host = render(<TextArea value="a" onCommit={onCommit} />);
    type(area(host), "ab");
    expect(onCommit).not.toHaveBeenCalled();
    blur(area(host));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("ab");
  });

  it("does not commit an unchanged value", () => {
    const onCommit = vi.fn();
    const host = render(<TextArea value="a" onCommit={onCommit} />);
    type(area(host), "ab");
    type(area(host), "a");
    blur(area(host));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("reverts on Escape and does not commit", () => {
    const onCommit = vi.fn();
    const host = render(<TextArea value="a" onCommit={onCommit} />);
    type(area(host), "abc");
    escape(area(host));
    expect(area(host).value).toBe("a");
    blur(area(host));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("reports every keystroke through onDraft, and Escape does not revert then", () => {
    const onDraft = vi.fn();
    const onCommit = vi.fn();
    const host = render(<TextArea value="a" onDraft={onDraft} onCommit={onCommit} />);
    type(area(host), "ab");
    type(area(host), "abc");
    expect(onDraft.mock.calls.map(([text]) => text)).toEqual(["ab", "abc"]);
    escape(area(host));
    expect(area(host).value).toBe("abc");
  });

  it("keeps a dirty draft when the prop changes during an edit", () => {
    const onCommit = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const root = trackedRoot(host);
    act(() => root.render(<TextArea value="a" onCommit={onCommit} />));
    type(area(host), "mine");
    act(() => root.render(<TextArea value="theirs" onCommit={onCommit} />));
    expect(area(host).value).toBe("mine");
  });

  it("follows the prop when the draft is clean", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = trackedRoot(host);
    act(() => root.render(<TextArea value="a" onCommit={() => {}} />));
    act(() => root.render(<TextArea value="b" onCommit={() => {}} />));
    expect(area(host).value).toBe("b");
  });

  it("commits a dirty draft on unmount, since no blur fires", () => {
    const onCommit = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const root = trackedRoot(host);
    act(() => root.render(<TextArea value="a" onCommit={onCommit} />));
    type(area(host), "ab");
    act(() => root.render(<div />));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("ab");
  });

  it("does not commit on unmount when nothing changed", () => {
    const onCommit = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const root = trackedRoot(host);
    act(() => root.render(<TextArea value="a" onCommit={onCommit} />));
    act(() => root.render(<div />));
    expect(onCommit).not.toHaveBeenCalled();
  });
});
