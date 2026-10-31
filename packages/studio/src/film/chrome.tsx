import type { ReactNode } from "react";

export const panelClass =
  "flex h-full flex-col gap-3 overflow-y-auto p-3 text-[11px] leading-relaxed text-neutral-300";

export const headingClass = "text-[10px] font-medium uppercase tracking-wide text-neutral-500";

export const textAreaClass =
  "w-full resize-y rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-[11px] text-neutral-100 outline-hidden focus:border-studio-accent/60";

export const selectClass =
  "h-ctl w-full rounded-md border border-neutral-700 bg-neutral-800 px-2 text-[11px] text-neutral-100 outline-hidden focus:border-studio-accent/60";

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 border-t border-neutral-800 pt-2">
      <h3 className={headingClass}>{title}</h3>
      {children}
    </section>
  );
}
