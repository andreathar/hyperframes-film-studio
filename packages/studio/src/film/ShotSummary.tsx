import { headingClass, mutedClass } from "./chrome";
import type { ProductionShot } from "./types";

function Direction({ label, text }: { label: string; text: string }) {
  return (
    <p>
      <span className="text-panel-text-4">{label} </span>
      <span className="text-panel-text-1">{text}</span>
    </p>
  );
}

export function ShotSummary({ shot }: { shot: ProductionShot }) {
  return (
    <section aria-label="Shot" className="flex flex-col gap-1">
      <h3 className="text-step-12 font-medium text-panel-text-0">{shot.title}</h3>
      <p className="font-mono text-step-11 text-panel-text-4">{shot.shotKey}</p>
      <Direction label="Camera" text={shot.direction.camera} />
      <Direction label="Acting" text={shot.direction.acting} />
      <Direction label="Lighting" text={shot.direction.lighting} />
      <Direction label="Continuity" text={shot.direction.continuity} />
      <p className={mutedClass}>Lines {shot.lineIds.join(", ")}</p>
      <span className={headingClass}>Dialogue</span>
      <p data-shot-dialogue className="whitespace-pre-wrap text-panel-text-0">
        {shot.direction.dialogue}
      </p>
    </section>
  );
}
