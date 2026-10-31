import {
  PROMPT_SECTIONS,
  SOUND_STRATEGIES,
  type PromptSectionId,
  type SceneBriefV1,
} from "@hyperframes/film-production/browser";
import { isSoundStrategy, withSoundStrategy } from "./briefEdit";
import { Select } from "../components/ui";
import { headingClass, mutedClass } from "./chrome";
import { SOUND_STRATEGY_TERMS } from "./glossary";
import { FieldControl } from "./FieldControl";
import { sectionFields } from "./sectionFields";
import type { ProductionShot } from "./types";

const STRATEGY_OPTIONS = SOUND_STRATEGIES.map((strategy) => ({
  value: strategy,
  label: SOUND_STRATEGY_TERMS[strategy].label,
}));

function SoundStrategyField({
  brief,
  onBriefChange,
}: {
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  if (!brief) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>Sound strategy</span>
      <Select
        label="Sound strategy"
        value={brief.sound.strategy}
        options={STRATEGY_OPTIONS}
        onCommit={(value) => {
          if (!isSoundStrategy(value)) return;
          onBriefChange(withSoundStrategy(brief, value));
        }}
      />
      <span className={mutedClass}>{SOUND_STRATEGY_TERMS[brief.sound.strategy].hint}</span>
    </div>
  );
}

function SectionBody({
  id,
  shot,
  brief,
  onBriefChange,
}: {
  id: PromptSectionId;
  shot: ProductionShot;
  brief: SceneBriefV1 | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  const fields = sectionFields(id, shot, brief);
  return (
    <div className="flex flex-col gap-2">
      {fields.map((field) => (
        <FieldControl key={field.key} field={field} brief={brief} onBriefChange={onBriefChange} />
      ))}
      {id === "dialogue-sound" ? (
        <SoundStrategyField brief={brief} onBriefChange={onBriefChange} />
      ) : null}
    </div>
  );
}

function CompiledPrompt({ prompt }: { prompt: string | null }) {
  if (!prompt) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className={headingClass}>Compiled prompt</span>
      <pre className="font-mono text-step-11 whitespace-pre-wrap text-panel-text-3">{prompt}</pre>
    </div>
  );
}

export function PromptSections({
  shot,
  brief,
  prompt,
  onBriefChange,
}: {
  shot: ProductionShot;
  brief: SceneBriefV1 | null;
  prompt: string | null;
  onBriefChange: (brief: SceneBriefV1) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-panel-border pt-2">
      <p className={mutedClass}>Prose intent for the shot. Dialogue is exact.</p>
      {PROMPT_SECTIONS.map((section) => (
        <section key={section.id} aria-label={section.title} className="flex flex-col gap-1.5">
          <h3 className={headingClass}>{section.title}</h3>
          <SectionBody id={section.id} shot={shot} brief={brief} onBriefChange={onBriefChange} />
        </section>
      ))}
      <CompiledPrompt prompt={prompt} />
    </div>
  );
}
