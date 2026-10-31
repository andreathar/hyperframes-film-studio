import {
  SCENE_PATTERNS,
  type ScenePatternId,
  type ScenePatternV1,
} from "@hyperframes/film-production/browser";
import { Button } from "../components/ui";
import { Section } from "../components/editor/propertyPanelPrimitives";
import { mutedClass } from "./chrome";

function PatternButton({
  id,
  title,
  pressed,
  onPick,
}: {
  id: ScenePatternId;
  title: string;
  pressed: boolean;
  onPick: (id: ScenePatternId) => void;
}) {
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={pressed}
      size="sm"
      variant={pressed ? "secondary" : "ghost"}
      onClick={() => onPick(id)}
    >
      {title}
    </Button>
  );
}

function PatternButtons({
  selected,
  onPick,
}: {
  selected: string | null;
  onPick: (id: ScenePatternId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Scene pattern" className="flex flex-wrap gap-1.5">
      {SCENE_PATTERNS.map((pattern) => (
        <PatternButton
          key={pattern.id}
          id={pattern.id}
          title={pattern.title}
          pressed={selected === pattern.id}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

function PatternHelp({ pattern }: { pattern: ScenePatternV1 | null }) {
  if (!pattern) {
    return (
      <p className={mutedClass}>
        Choose a pattern to apply its constraints. The line stays as written.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1 text-step-11 leading-relaxed text-panel-text-3">
      <p>{pattern.summary}</p>
      <p>{pattern.cameraConstraint}</p>
      <p>{pattern.soundConstraint}</p>
      <p>Requires {pattern.requiredReferenceRoles.join(", ")}.</p>
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
    <Section title="Pattern" icon={null}>
      <PatternButtons selected={pattern?.id ?? null} onPick={onPick} />
      <PatternHelp pattern={pattern} />
    </Section>
  );
}
