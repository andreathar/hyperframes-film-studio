import { describe, expect, it } from "vitest";
import { sendReason } from "./actionReasons";
import { READINESS_TERMS } from "./glossary";
import type { AssistantReadinessView } from "./types";

const STATES: AssistantReadinessView["state"][] = [
  "missing-cli",
  "unauthenticated",
  "unsupported-protocol",
  "unavailable",
  "limited",
  "ready",
  "external-handoff",
];

describe("sendReason", () => {
  it("covers all seven readiness states", () => {
    expect([...STATES].sort()).toEqual(Object.keys(READINESS_TERMS).sort());
  });

  it.each(STATES)("%s", (state) => {
    const reason = sendReason({ provider: "claude-external", state, evidence: "x" });
    const open = state === "ready" || state === "limited";
    if (open) {
      expect(reason).toBeNull();
      return;
    }
    const term = READINESS_TERMS[state];
    expect(reason).toBe(`${term.label}. ${term.action ?? term.hint}`);
  });
});
