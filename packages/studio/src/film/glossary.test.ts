import {
  PROMPT_SECTIONS,
  REFERENCE_ROLES,
  SOUND_STRATEGIES,
} from "@hyperframes/film-production/browser";
import { describe, expect, it } from "vitest";
import {
  READINESS_TERMS,
  REFERENCE_ROLE_TERMS,
  SECTION_TERMS,
  SOUND_STRATEGY_TERMS,
} from "./glossary";

describe("glossary", () => {
  it.each([...REFERENCE_ROLES])("role %s reads as words", (role) => {
    const term = REFERENCE_ROLE_TERMS[role];
    expect(term.label).not.toMatch(/-/);
    expect(term.label).not.toBe(role);
    expect(term.hint.length).toBeGreaterThan(12);
  });
  it.each([...SOUND_STRATEGIES])("sound %s reads as words", (value) => {
    expect(SOUND_STRATEGY_TERMS[value].label).not.toMatch(/-/);
    expect(SOUND_STRATEGY_TERMS[value].label).not.toBe(value);
    expect(SOUND_STRATEGY_TERMS[value].hint.length).toBeGreaterThan(12);
  });
  it.each(PROMPT_SECTIONS.map((section) => section.id))("section %s reads as words", (id) => {
    expect(SECTION_TERMS[id].label).not.toMatch(/-/);
    expect(SECTION_TERMS[id].hint.length).toBeGreaterThan(12);
  });
  it.each(Object.entries(READINESS_TERMS))("readiness %s reads as words", (state, term) => {
    expect(term.label).not.toMatch(/-/);
    expect(term.label).not.toBe(state);
    expect(term.hint.length).toBeGreaterThan(12);
  });
  it("gives an action to every readiness state that needs one", () => {
    expect(READINESS_TERMS["missing-cli"].action).toBe("Install Codex, then reopen");
    expect(READINESS_TERMS["external-handoff"].action).toBe("Copy for Claude");
    expect(READINESS_TERMS.ready.action).toBeNull();
  });
});
