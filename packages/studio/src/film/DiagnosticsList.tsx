import type { CompilationV1, DiagnosticV1 } from "@hyperframes/film-production/browser";
import { Section } from "../components/editor/propertyPanelPrimitives";
import { mutedClass, warnClass } from "./chrome";

function DiagnosticItem({ item }: { item: DiagnosticV1 }) {
  const tone = item.severity === "error" ? warnClass : "text-panel-text-3";
  return (
    <li className={tone}>
      <span className="font-mono">{item.code}</span>
      <span> {item.message}</span>
    </li>
  );
}

function DiagnosticItems({ compilation }: { compilation: CompilationV1 | null }) {
  if (!compilation) return <p className={mutedClass}>No compilation yet.</p>;
  if (compilation.diagnostics.length === 0) {
    return <p className={mutedClass}>No diagnostics.</p>;
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
    <Section title="Diagnostics" icon={null}>
      <DiagnosticItems compilation={compilation} />
    </Section>
  );
}
