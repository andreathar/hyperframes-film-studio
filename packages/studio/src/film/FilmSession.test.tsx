// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantPanel } from "./AssistantPanel";
import { ProductionPanel } from "./ProductionPanel";
import { expandAll } from "./testFixtures";
import { useFilmSession } from "./useFilmSession";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function DisconnectedFilmPanels({
  showToast,
}: {
  showToast: (message: string, tone?: "error" | "info") => void;
}) {
  const { production, assistant } = useFilmSession(showToast);
  return (
    <>
      <ProductionPanel {...production} />
      <AssistantPanel {...assistant} />
    </>
  );
}

describe("disconnected film panels", () => {
  let root: Root | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";
  });

  it("says to connect a film project, with one primary action and only the current step open", () => {
    const showToast = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root?.render(<DisconnectedFilmPanels showToast={showToast} />);
    });
    const card = host.querySelector('section[aria-label="Next step"]');
    expect(card?.textContent).toContain("Next: connect a film project");
    expect(card?.querySelectorAll("button")).toHaveLength(1);
    const open = host.querySelectorAll('button[aria-expanded="true"]');
    expect(open).toHaveLength(1);
    expect(open[0]?.textContent).toContain("Film project");
    act(() => {
      card?.querySelector("button")?.click();
    });
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("Needs a film project"), "info");
  });

  it("keeps Prepare and Send blocked while no film host is connected", () => {
    const showToast = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root?.render(<DisconnectedFilmPanels showToast={showToast} />);
    });
    expect(host.textContent).toContain("No shot connected");
    expect(host.textContent).toContain("unavailable");
    expandAll(host);
    const prepare = buttonNamed(host, "Prepare");
    const send = buttonNamed(host, "Send");
    act(() => {
      prepare.click();
      send.click();
    });
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining("Prepare stays blocked"),
      "info",
    );
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("Send stays blocked"), "info");
    expect(showToast.mock.calls.some(([message]) => String(message).includes("Applied"))).toBe(
      false,
    );
  });
});

function buttonNamed(host: HTMLElement, name: string): HTMLButtonElement {
  const button = [...host.querySelectorAll("button")].find((item) => item.textContent === name);
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing ${name}`);
  return button;
}
