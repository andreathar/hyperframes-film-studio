// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantPanel } from "./AssistantPanel";
import { ProductionPanel } from "./ProductionPanel";
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
