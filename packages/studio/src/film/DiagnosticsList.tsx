import type { CompilationV1, DiagnosticV1 } from "@hyperframes/film-production/browser";
import { Block } from "./chrome";

function DiagnosticItem({ item }: { item: DiagnosticV1 }) {
  const tone = item.severity === "error" ? "text-amber-400/90" : "text-neutral-400";
  return (
    <li className={tone}>
      <span className="font-mono">{item.code}</span>
      <span> {item.message}</span>
    </li>
  );
}

function DiagnosticItems({ compilation }: { compilation: CompilationV1 | null }) {
  if (!compilation) return <p className="text-neutral-500">No compilation yet.</p>;
  if (compilation.diagnostics.length === 0) {
    return <p className="text-neutral-500">No diagnostics.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {compilation.diagnostics.map((item) => (
        <DiagnosticItem key={`${item.path}:${item.code}`} item={item} />
      ))}
    </ul>
  );
}

export function DiagnosticsList({ compilation }: { compilation: CompilationV1 | null }) {
  return (
    <Block title="Diagnostics">
      <DiagnosticItems compilation={compilation} />
    </Block>
  );
}
