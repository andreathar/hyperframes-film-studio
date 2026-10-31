import { headingClass } from "./chrome";
import type { ProductionShot } from "./types";

function Direction({ label, text }: { label: string; text: string }) {
  return (
    <p>
      <span className="text-neutral-500">{label} </span>
      <span className="text-neutral-200">{text}</span>
    </p>
  );
}

export function ShotSummary({ shot }: { shot: ProductionShot }) {
  return (
    <section aria-label="Shot" className="flex flex-col gap-1">
      <h3 className="text-[12px] font-medium text-neutral-100">{shot.title}</h3>
      <p className="font-mono text-[10px] text-neutral-500">{shot.shotKey}</p>
      <Direction label="Camera" text={shot.direction.camera} />
      <Direction label="Acting" text={shot.direction.acting} />
      <Direction label="Lighting" text={shot.direction.lighting} />
      <Direction label="Continuity" text={shot.direction.continuity} />
      <p className="text-[10px] text-neutral-500">Lines {shot.lineIds.join(", ")}</p>
      <span className={headingClass}>Dialogue</span>
      <p data-shot-dialogue className="whitespace-pre-wrap text-neutral-100">
        {shot.direction.dialogue}
      </p>
    </section>
  );
}
