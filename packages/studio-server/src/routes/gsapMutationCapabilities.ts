import type { GsapMutationRequest } from "./files.js";

export type GsapMutationType = GsapMutationRequest["type"];
type GsapMutationFamily = "animation" | "keyframe" | "motion_path" | "structure" | "timing";
type GsapParityEvidence = "differential" | "behavioral";

interface GsapMutationCapability {
  family: GsapMutationFamily;
  parity: GsapParityEvidence;
}

const differential = (family: GsapMutationFamily): GsapMutationCapability => ({
  family,
  parity: "differential",
});
const behavioral = (family: GsapMutationFamily): GsapMutationCapability => ({
  family,
  parity: "behavioral",
});

/** Compile-time exhaustive over the request union; runtime tests match both dispatchers. */
export const GSAP_MUTATION_CAPABILITIES = {
  "update-property": differential("animation"),
  "update-properties": differential("animation"),
  "update-from-property": differential("animation"),
  "update-meta": differential("animation"),
  add: differential("animation"),
  delete: differential("animation"),
  "add-property": differential("animation"),
  "add-from-property": differential("animation"),
  "remove-property": differential("animation"),
  "remove-from-property": differential("animation"),
  "add-keyframe": differential("keyframe"),
  "remove-keyframe": differential("keyframe"),
  "move-keyframe": behavioral("keyframe"),
  "resize-keyframed-tween": behavioral("keyframe"),
  "update-keyframe": differential("keyframe"),
  "convert-to-keyframes": behavioral("keyframe"),
  "remove-all-keyframes": behavioral("keyframe"),
  "materialize-keyframes": behavioral("keyframe"),
  "set-arc-path": behavioral("motion_path"),
  "update-arc-segment": behavioral("motion_path"),
  "update-motion-path-point": differential("motion_path"),
  "add-motion-path-point": differential("motion_path"),
  "remove-motion-path-point": differential("motion_path"),
  "add-motion-path": differential("motion_path"),
  "remove-arc-path": behavioral("motion_path"),
  "add-with-keyframes": behavioral("keyframe"),
  "replace-with-keyframes": behavioral("keyframe"),
  "split-animations": behavioral("structure"),
  "split-into-property-groups": behavioral("structure"),
  "delete-all-for-selector": behavioral("structure"),
  "consolidate-position-writes": behavioral("structure"),
  "unroll-timeline": behavioral("structure"),
  "shift-positions": behavioral("timing"),
  "shift-positions-batch": behavioral("timing"),
  "scale-positions": behavioral("timing"),
} as const satisfies Record<GsapMutationType, GsapMutationCapability>;

/** Ops whose parity rests on behavioral tests, not a byte-diff oracle. */
export function behavioralParityOps(): GsapMutationType[] {
  return (
    Object.entries(GSAP_MUTATION_CAPABILITIES) as Array<[GsapMutationType, GsapMutationCapability]>
  )
    .filter(([, capability]) => capability.parity !== "differential")
    .map(([type]) => type);
}

export function renderGsapMutationCapabilityReport(): string {
  const rows = (
    Object.entries(GSAP_MUTATION_CAPABILITIES) as Array<[GsapMutationType, GsapMutationCapability]>
  ).map(([type, capability]) => `| ${type} | ${capability.family} | ${capability.parity} |`);
  return [
    "# GSAP writer capability report",
    "",
    "Writer: acorn",
    "",
    "| Operation | Family | Parity evidence |",
    "| --- | --- | --- |",
    ...rows,
    "",
    `Behavioral-only parity (no byte-diff oracle): ${behavioralParityOps().join(", ") || "none"}`,
    "",
  ].join("\n");
}
