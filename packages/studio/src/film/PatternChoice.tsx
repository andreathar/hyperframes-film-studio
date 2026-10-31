import {
  SCENE_PATTERNS,
  type ScenePatternId,
  type ScenePatternV1,
} from "@hyperframes/film-production/browser";
import type { KeyboardEvent } from "react";
import { Button, Popover } from "../components/ui";
import { headingClass, mutedClass } from "./chrome";
import {
  PATTERN_MORE_TERM,
  PATTERN_NEEDS_LABEL,
  PATTERN_NONE_HINT,
  REFERENCE_ROLE_TERMS,
} from "./glossary";

function PatternButton({
  id,
  title,
  pressed,
  tabStop,
  onPick,
}: {
  id: ScenePatternId;
  title: string;
  pressed: boolean;
  tabStop: boolean;
  onPick: (id: ScenePatternId) => void;
}) {
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={pressed}
      tabIndex={tabStop ? 0 : -1}
      data-pattern-id={id}
      size="sm"
      variant={pressed ? "secondary" : "ghost"}
      onClick={() => onPick(id)}
    >
      {title}
    </Button>
  );
}

/** Index to move to for a key, wrapping at both ends; null for keys the group ignores. */
function targetIndex(key: string, from: number, count: number): number | null {
  if (key === "ArrowDown" || key === "ArrowRight") return (from + 1) % count;
  if (key === "ArrowUp" || key === "ArrowLeft") return (from - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

function PatternButtons({
  selected,
  onPick,
}: {
  selected: string | null;
  onPick: (id: ScenePatternId) => void;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const current = SCENE_PATTERNS.findIndex(
      (pattern) =>
        event.target instanceof HTMLElement && pattern.id === event.target.dataset.patternId,
    );
    if (current < 0) return;
    const to = targetIndex(event.key, current, SCENE_PATTERNS.length);
    const next = to === null ? undefined : SCENE_PATTERNS[to];
    if (!next) return;
    event.preventDefault();
    event.currentTarget.querySelector<HTMLElement>(`[data-pattern-id="${next.id}"]`)?.focus();
    onPick(next.id);
  };
  const tabbable = SCENE_PATTERNS.some((pattern) => pattern.id === selected)
    ? selected
    : (SCENE_PATTERNS[0]?.id ?? null);
  return (
    <div
      role="radiogroup"
      aria-label="Scene pattern"
      className="flex flex-wrap gap-1.5"
      onKeyDown={onKeyDown}
    >
      {SCENE_PATTERNS.map((pattern) => (
        <PatternButton
          key={pattern.id}
          id={pattern.id}
          title={pattern.title}
          pressed={selected === pattern.id}
          tabStop={tabbable === pattern.id}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

function PatternHelp({ pattern }: { pattern: ScenePatternV1 | null }) {
  if (!pattern) return <p className={mutedClass}>{PATTERN_NONE_HINT}</p>;
  const roles = pattern.requiredReferenceRoles.map((role) => REFERENCE_ROLE_TERMS[role].label);
  return (
    <div className="flex items-start gap-2 text-step-12 leading-relaxed text-panel-text-3">
      <p className="min-w-0 flex-1">{pattern.summary}</p>
      <Popover
        aria-label={PATTERN_MORE_TERM.hint}
        side="bottom"
        align="end"
        trigger={
          <Button type="button" size="sm" variant="ghost" aria-label={PATTERN_MORE_TERM.hint}>
            {PATTERN_MORE_TERM.label}
          </Button>
        }
      >
        <div className="flex max-w-64 flex-col gap-1 text-panel-text-3">
          <p>{pattern.summary}</p>
          <p>{pattern.cameraConstraint}</p>
          <p>{pattern.soundConstraint}</p>
          <p>
            {PATTERN_NEEDS_LABEL} {roles.join(", ")}.
          </p>
        </div>
      </Popover>
    </div>
  );
}

export function PatternChoice({
  pattern,
  onPick,
}: {
  pattern: ScenePatternV1 | null;
  onPick: (id: ScenePatternId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className={headingClass}>Pattern</h4>
      <PatternButtons selected={pattern?.id ?? null} onPick={onPick} />
      <PatternHelp pattern={pattern} />
    </div>
  );
}
