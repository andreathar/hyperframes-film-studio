import { memo } from "react";
import { Section } from "../../components/editor/propertyPanelPrimitives";
import { Button, Select } from "../../components/ui";
import { headingClass, mutedClass, panelClass, warnClass } from "../chrome";
import { LookBadge, TbcIssueList, TbcPromptList } from "./TbcParts";
import type { TbcShotContextV1, TbcShotRow } from "./types";
import type { TbcProductionProps } from "./useTbcSession";

function shotOption(row: TbcShotRow) {
  const ready = row.ready ? "" : " · blocked";
  return { value: row.id, label: `${row.id} · ${row.beat ?? "?"} · ${row.status}${ready}` };
}

function ShotLine({ context }: { context: TbcShotContextV1 }) {
  const { shot, neighbours } = context;
  return (
    <div className="flex flex-col gap-1" aria-label="Shot details">
      <p>
        <span className="text-panel-text-4">Beat </span>
        <span className="text-panel-text-0">{shot.beat ?? "?"}</span>
        <span className="text-panel-text-4"> · Feeling </span>
        <span className="text-panel-text-0">{shot.feeling ?? "none"}</span>
        <span className="text-panel-text-4"> · Eyeline </span>
        <span className="text-panel-text-0">{shot.eyeline ?? "none"}</span>
        <span className="text-panel-text-4"> · </span>
        <span className="text-panel-text-0">{shot.seconds}s</span>
      </p>
      <p className="text-panel-text-2">{shot.description}</p>
      {shot.lines.map((line) => (
        <p key={line.id}>
          <span className="font-mono text-panel-text-4">{line.id} </span>
          <span className="text-panel-text-3">{line.speaker}: </span>
          <span className="text-panel-text-0">{line.text}</span>
        </p>
      ))}
      <p className={mutedClass}>
        {neighbours.previous === undefined
          ? "First shot"
          : `After ${neighbours.previous.id} (${neighbours.previous.beat ?? "?"})`}
        {neighbours.next === undefined
          ? " · last shot"
          : ` · before ${neighbours.next.id} (${neighbours.next.beat ?? "?"})`}
      </p>
    </div>
  );
}

function ContinuitySet({
  context,
  mediaUrl,
}: {
  context: TbcShotContextV1;
  mediaUrl: TbcProductionProps["mediaUrl"];
}) {
  return (
    <Section title="Continuity set" icon={null}>
      {context.continuity.length === 0 ? (
        <p className={mutedClass}>No continuity entities for this shot.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Continuity set">
          {context.continuity.map((entity) => (
            <li key={entity.code} className="flex flex-col gap-1" data-entity={entity.code}>
              <p>
                <span className="text-panel-text-0">{entity.displayName}</span>
                <span className={mutedClass}>
                  {" "}
                  {entity.code} · {entity.kind}
                  {entity.inFrame ? "" : " · off frame"}{" "}
                </span>
                <LookBadge state={entity.state} />
              </p>
              <div className="flex flex-wrap gap-1">
                {entity.views.map((view) =>
                  entity.state === "locked" && view.sha256 !== undefined ? (
                    <img
                      key={view.name}
                      src={mediaUrl(entity.code, view.name)}
                      alt={`${entity.displayName} ${view.name}`}
                      className="h-16 w-16 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span key={view.name} className={mutedClass}>
                      {view.name}
                      {view.path === undefined ? " (missing)" : ""}
                    </span>
                  ),
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** The Production panel when `tbc serve` answers: one shot of the manifest, read-only. */
export const TbcProductionPanel = memo(function TbcProductionPanel({
  manifest,
  shots,
  shotId,
  context,
  error,
  onSelectShot,
  onReload,
  mediaUrl,
}: TbcProductionProps) {
  return (
    <div className={panelClass} aria-label="Production">
      <h2 className="text-step-12 font-medium text-panel-text-0">Production</h2>
      <p className={mutedClass}>
        Connected to tbc serve · <span className="font-mono">{manifest}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <span className={headingClass}>Shot</span>
        {shots.length === 0 ? (
          <span className={mutedClass}>No shots.</span>
        ) : (
          <Select
            label="Shot"
            value={shotId ?? ""}
            options={shots.map(shotOption)}
            onCommit={onSelectShot}
            className="text-step-12"
            itemClassName="text-step-12"
          />
        )}
        <Button type="button" size="sm" variant="ghost" className="text-step-12" onClick={onReload}>
          Reload
        </Button>
      </div>
      {error === null ? null : (
        <p className={warnClass} role="alert">
          {error}
        </p>
      )}
      {context === null ? null : (
        <>
          <ShotLine context={context} />
          <ContinuitySet context={context} mediaUrl={mediaUrl} />
          <TbcIssueList title="Checks" issues={context.issues} />
          <TbcPromptList title="Prompt" segments={context.prompt} />
        </>
      )}
    </div>
  );
});
