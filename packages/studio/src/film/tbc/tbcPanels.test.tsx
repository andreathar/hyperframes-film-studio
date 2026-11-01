// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TbcError, type TbcClient } from "./client";
import { TbcAssistantPanel } from "./TbcAssistantPanel";
import { TbcProductionPanel } from "./TbcProductionPanel";
import { BATCH, CONTEXT, HEALTH, PRESET_EDIT, TURN, fakeTbc } from "./tbcFixtures";
import type { TbcTurnV1 } from "./types";
import { staleReasonOf, useTbcSession } from "./useTbcSession";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function Harness({ client }: { client: TbcClient }) {
  const session = useTbcSession(client);
  if (session.kind !== "connected") return <p data-session={session.kind}>{session.kind}</p>;
  return (
    <>
      <TbcProductionPanel {...session.production} />
      <TbcAssistantPanel {...session.assistant} />
    </>
  );
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

async function mount(client: TbcClient): Promise<HTMLDivElement> {
  host = document.createElement("div");
  document.body.append(host);
  const created = createRoot(host);
  root = created;
  await act(async () => created.render(<Harness client={client} />));
  return host;
}

async function waitFor(check: () => boolean, label: string): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    if (check()) return;
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
  }
  throw new Error(`timed out waiting for ${label}`);
}

function text(el: Element | null | undefined): string {
  return el?.textContent ?? "";
}

function button(scope: ParentNode, label: string): HTMLButtonElement {
  const found = [...scope.querySelectorAll("button")].find(
    (el) => el.textContent?.trim() === label,
  );
  if (!(found instanceof HTMLButtonElement)) throw new Error(`no button ${label}`);
  return found;
}

async function click(el: HTMLElement) {
  await act(async () => el.click());
}

async function type(el: HTMLTextAreaElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  await act(async () => {
    set?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function instruction(scope: ParentNode): HTMLTextAreaElement {
  const el = scope.querySelector('textarea[aria-label="Instruction"]');
  if (!(el instanceof HTMLTextAreaElement)) throw new Error("no instruction field");
  return el;
}

async function connected(client: TbcClient): Promise<HTMLDivElement> {
  const el = await mount(client);
  await waitFor(() => text(el).includes(CONTEXT.shot.description), "the shot context");
  return el;
}

const DONE: TbcTurnV1 = {
  ...TURN,
  state: "done",
  events: [
    ...TURN.events,
    { kind: "delta", text: "Let the silence " },
    { kind: "delta", text: "carry it." },
    { kind: "result", reply: "Let the silence carry it." },
  ],
  reply: "Let the silence carry it.",
  proposals: [PRESET_EDIT, BATCH],
  endedAt: "2026-11-01T10:00:05.000Z",
};

describe("staleReasonOf", () => {
  it("lets a reply apply only to the shot and revision it was written for", () => {
    expect(staleReasonOf(DONE, CONTEXT)).toBeNull();
    expect(staleReasonOf(DONE, { ...CONTEXT, revision: "rev-2" })).toContain("changed");
    expect(staleReasonOf(DONE, { ...CONTEXT, shot: { ...CONTEXT.shot, id: "G-01" } })).toContain(
      "G-02",
    );
    expect(staleReasonOf(DONE, null)).toContain("G-02");
    expect(staleReasonOf(null, CONTEXT)).toBeNull();
  });
});

describe("tbc session", () => {
  it("stays on the disconnected panels when tbc serve does not answer", async () => {
    const { client, calls } = fakeTbc({ health: new Error("connection refused") });
    const el = await mount(client);
    await waitFor(() => el.querySelector('[data-session="offline"]') !== null, "offline");
    expect(calls).toEqual(["health"]);
  });

  it("shows the shot: beat, feeling, eyeline, continuity set, checks and the explained prompt", async () => {
    const { client, calls } = fakeTbc({});
    const el = await connected(client);
    expect(calls).toEqual(["health", "shots", "context G-01"]);
    const production = el.querySelector('[aria-label="Production"]');
    expect(text(production)).toContain("tbc");
    const shot = el.querySelector('[aria-label="Shot details"]');
    expect(text(shot)).toContain("Beat E2");
    expect(text(shot)).toContain("Feeling pride -> restraint");
    expect(text(shot)).toContain("Eyeline camera-left");
    expect(text(shot)).toContain("And yet it moves.");
    const states = [...el.querySelectorAll("[data-state]")].map((badge) =>
      badge.getAttribute("data-state"),
    );
    expect(states).toEqual(["locked", "none"]);
    const thumb = el.querySelector('[data-entity="GALILEO"] img');
    expect(thumb?.getAttribute("src")).toBe("http://tbc.test/api/media/look/GALILEO/back");
    expect(el.querySelector('[data-entity="TABLE"] img')).toBeNull();
    expect(text(el.querySelector('ul[aria-label="Checks"]'))).toContain("look-missing");
    expect(text(el.querySelector('ol[aria-label="Prompt"]'))).toContain("acting/answer#sound");
  });

  it("sends a turn frozen to the shown revision, streams the reply and applies one proposal", async () => {
    const applied = {
      applied: {
        kind: "preset-edited" as const,
        preset: "acting/answer",
        field: "sound",
        file: "acting/answer.yaml",
      },
      context: CONTEXT,
    };
    const { client, calls } = fakeTbc({ turns: [TURN, DONE], apply: applied });
    const el = await connected(client);
    const assistant = el.querySelector('[aria-label="Assistant"]');
    if (assistant === null) throw new Error("no assistant panel");
    expect(text(assistant)).toContain("Write an instruction first.");

    await type(instruction(assistant), "quieter");
    await click(button(assistant, "Send"));
    expect(calls).toContain(`start G-01 ${CONTEXT.revision} quieter`);
    await waitFor(() => text(assistant).includes("Done."), "the finished turn");
    expect(calls).toContain("turn t1 after=1");
    expect(text(assistant)).toContain("Let the silence carry it.");

    const edit = assistant.querySelector('[data-kind="preset-edit"]');
    const batch = assistant.querySelector('[data-kind="batch-draft"]');
    if (edit === null || batch === null) throw new Error("missing proposal cards");
    expect(text(edit.querySelector('[aria-label="Before"]'))).toContain("A chair creaks once.");
    expect(text(edit.querySelector('[aria-label="After"]'))).toContain(
      "Silence, then a chair creaks.",
    );
    expect(text(batch)).toContain("Batches are drafted with tbc batch");
    await click(button(batch, "Apply"));
    expect(calls.some((call) => call.startsWith("apply"))).toBe(false);

    await click(button(edit, "Apply"));
    expect(calls).toContain(`apply t1 0 ${CONTEXT.revision}`);
    await waitFor(() => text(edit).includes("Rewrote sound"), "the apply outcome");
    expect(text(edit)).toContain("Applied.");
  });

  it("keeps a reply for another revision as a read-only draft that cannot be applied", async () => {
    const stale: TbcTurnV1 = { ...DONE, revision: "rev-0-old" };
    const { client, calls } = fakeTbc({ turns: [stale] });
    const el = await connected(client);
    const assistant = el.querySelector('[aria-label="Assistant"]');
    if (assistant === null) throw new Error("no assistant panel");
    await type(instruction(assistant), "quieter");
    await click(button(assistant, "Send"));
    await waitFor(() => text(assistant).includes("Read-only draft."), "the stale note");
    const edit = assistant.querySelector('[data-kind="preset-edit"]');
    if (edit === null) throw new Error("no preset edit");
    expect(text(edit)).toContain("The shot changed since this reply");
    await click(button(edit, "Apply"));
    expect(calls.some((call) => call.startsWith("apply"))).toBe(false);
  });

  it("shows why tbc serve refused an apply", async () => {
    const refused = new TbcError(422, "this proposal cannot be applied now", [
      { code: "face-rule", severity: "error", where: "G-02", message: "full face in frame" },
    ]);
    const { client } = fakeTbc({ turns: [DONE], apply: refused });
    const el = await connected(client);
    const assistant = el.querySelector('[aria-label="Assistant"]');
    if (assistant === null) throw new Error("no assistant panel");
    await type(instruction(assistant), "quieter");
    await click(button(assistant, "Send"));
    await waitFor(() => assistant.querySelector('[data-kind="preset-edit"]') !== null, "proposals");
    const edit = assistant.querySelector('[data-kind="preset-edit"]');
    if (edit === null) throw new Error("no preset edit");
    await click(button(edit, "Apply"));
    await waitFor(() => text(edit).includes("face-rule"), "the refusal");
    expect(text(edit)).toContain("this proposal cannot be applied now");
  });

  it("cancels a running reply", async () => {
    const { client, calls } = fakeTbc({ turns: [TURN] });
    const el = await connected(client);
    const assistant = el.querySelector('[aria-label="Assistant"]');
    if (assistant === null) throw new Error("no assistant panel");
    await type(instruction(assistant), "quieter");
    await click(button(assistant, "Send"));
    await click(button(assistant, "Cancel reply"));
    expect(calls).toContain("cancel t1");
    await waitFor(() => text(assistant).includes("Cancelled."), "the cancelled turn");
  });

  it("says why Send is blocked when tbc serve runs without the assistant", async () => {
    const { client, calls } = fakeTbc({
      health: { ...HEALTH, assistant: { available: false, reason: "claude is not installed" } },
    });
    const el = await connected(client);
    const assistant = el.querySelector('[aria-label="Assistant"]');
    if (assistant === null) throw new Error("no assistant panel");
    await type(instruction(assistant), "quieter");
    expect(text(assistant)).toContain("claude is not installed");
    await click(button(assistant, "Send"));
    expect(calls.some((call) => call.startsWith("start"))).toBe(false);
  });
});
