import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GSAP_MUTATION_CAPABILITIES,
  behavioralParityOps,
  renderGsapMutationCapabilityReport,
} from "./gsapMutationCapabilities.js";

const source = readFileSync(resolve(process.cwd(), "src/routes/files.ts"), "utf8");

function dispatcherCases(startMarker: string, endMarker: string): string[] {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Could not locate dispatcher ${startMarker}`);
  return [...source.slice(start, end).matchAll(/case\s+"([^"]+)"/g)].map((match) => match[1]!);
}

describe("GSAP writer capability matrix", () => {
  const operations = Object.keys(GSAP_MUTATION_CAPABILITIES).sort();

  it("matches the Acorn dispatcher and has no recast writer", () => {
    expect(
      dispatcherCases("function executeGsapMutationAcorn", "function foldAtomicCutFile").sort(),
    ).toEqual(operations);
    expect(source).not.toContain("executeGsapMutationRecast");
    expect(source).not.toContain("loadGsapParser");
    expect(source).not.toContain("gsap-parser-recast");
    expect(source).not.toContain("HYPERFRAMES_GSAP_WRITER");
  });

  it("syncs holds with the acorn writer", () => {
    const mutationHelperBody = source.slice(
      source.indexOf("async function applyGsapMutations"),
      source.indexOf("function executeGsapMutationAcorn"),
    );
    const atomicCutHelperBody = source.slice(
      source.indexOf("function foldAtomicCutFile"),
      source.indexOf("function registerFileRoutes"),
    );
    expect(mutationHelperBody).toContain(
      "syncPositionHoldsBeforeKeyframes(newScript, previousScript)",
    );
    expect(atomicCutHelperBody).toContain(
      "syncPositionHoldsBeforeKeyframes(script, block.scriptText)",
    );
    expect(mutationHelperBody).not.toContain('writer === "acorn"');
    expect(atomicCutHelperBody).not.toContain('writer === "recast"');
  });

  it("renders every classified operation and names the behavioral-only ops", () => {
    const report = renderGsapMutationCapabilityReport();
    for (const operation of operations) expect(report).toContain(`| ${operation} |`);
    expect(report).toContain("Behavioral-only parity");
    expect(behavioralParityOps().sort()).toEqual(
      [
        "add-with-keyframes",
        "consolidate-position-writes",
        "convert-to-keyframes",
        "delete-all-for-selector",
        "materialize-keyframes",
        "move-keyframe",
        "remove-all-keyframes",
        "remove-arc-path",
        "replace-with-keyframes",
        "resize-keyframed-tween",
        "scale-positions",
        "set-arc-path",
        "shift-positions",
        "shift-positions-batch",
        "split-animations",
        "split-into-property-groups",
        "unroll-timeline",
        "update-arc-segment",
      ].sort(),
    );
  });

  it("names acorn as the only writer", () => {
    expect(renderGsapMutationCapabilityReport()).toContain("Writer: acorn");
    expect(renderGsapMutationCapabilityReport()).not.toContain("HYPERFRAMES_GSAP_WRITER");
  });
});
