import { BlockedButton } from "./BlockedButton";
import { mutedClass } from "./chrome";
import type { NextAction } from "./steps";

/** The one thing to do now. The primary action is the only one on the card. */
export function NextStep({ next, onAct }: { next: NextAction; onAct: () => void }) {
  return (
    <section aria-label="Next step" className="flex flex-col gap-1.5">
      <h3 className="text-step-12 font-semibold text-panel-text-0">{next.title}</h3>
      <p className={mutedClass}>{next.hint}</p>
      <div>
        <BlockedButton
          type="button"
          size="sm"
          variant="primary"
          reason={next.reason}
          onClick={onAct}
        >
          {next.actionLabel}
        </BlockedButton>
      </div>
    </section>
  );
}
