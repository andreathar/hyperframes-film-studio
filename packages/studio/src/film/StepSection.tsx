import type { ReactNode } from "react";
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
 * steps fold. Section reads defaultCollapsed only on mount, so the state is
 * its key: a state change remounts it and re-folds it.
 */
export function StepSection({ step, children }: { step: StepView; children: ReactNode }) {
  const glyph = glyphFor(step);
  return (
    <Section
      key={step.state}
      title={STEP_TERMS[step.id].label}
      icon={null}
      defaultCollapsed={step.state !== "current"}
      accessory={
        <span className="flex items-center gap-1.5">
          <span role="img" aria-label={glyph.label} data-step-glyph={step.state}>
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
