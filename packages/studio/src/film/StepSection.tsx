import { useState, type ReactNode } from "react";
import { Section } from "../components/editor/propertyPanelPrimitives";
import { mutedClass } from "./chrome";
import { STEP_TERMS } from "./glossary";
import type { StepState, StepView } from "./steps";

function glyphFor(step: StepView): { mark: string; label: string } {
  const state: StepState = step.state;
  if (state === "done") return { mark: "✓", label: "Done" };
  if (state === "current") return { mark: "●", label: "Current step" };
  if (state === "blocked" && step.blockedBy) {
    return { mark: "○", label: `Blocked by ${STEP_TERMS[step.blockedBy].label}` };
  }
  return { mark: "○", label: "Later" };
}

/**
 * One step of the Production panel. The current step is open; done and later
 * steps fold. Section reads defaultCollapsed only on mount, so the fold is controlled here: it opens when the step becomes current and
 * folds when it becomes done, on that transition only. Otherwise the maker's
 * own toggle wins. Nothing remounts, so typing is never interrupted.
 */
export function StepSection({ step, children }: { step: StepView; children?: ReactNode }) {
  const glyph = glyphFor(step);
  const [fold, setFold] = useState({ state: step.state, collapsed: step.state !== "current" });
  if (fold.state !== step.state) {
    const collapsed =
      step.state === "current" ? false : step.state === "done" ? true : fold.collapsed;
    setFold({ state: step.state, collapsed });
  }
  const label = STEP_TERMS[step.id].label;
  return (
    <Section
      title={label}
      icon={null}
      collapsed={fold.collapsed}
      onCollapsedChange={(collapsed) => setFold({ state: step.state, collapsed })}
      toggleLabel={`${label}, ${glyph.label.toLowerCase()}`}
      accessory={
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" data-step-glyph={step.state}>
            {glyph.mark}
          </span>
          <span className={mutedClass}>{step.summary}</span>
        </span>
      }
    >
      <p className={mutedClass}>{step.hint}</p>
      {children}
    </Section>
  );
}
