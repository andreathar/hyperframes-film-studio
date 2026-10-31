import type { GsapAnimation } from "./gsapSerialize.js";

/** Marker on Studio-emitted pre-keyframe hold `set`s. `data` is a GSAP-reserved
 * config key (attached to the tween, never applied to the target). */
export const STUDIO_HOLD_MARKER = "hf-hold";

/** True for a `tl.set(...)` emitted to hold a keyframe before its tween.
 * Studio filters these out so they never appear as user keyframes. */
export function isStudioHoldSet(anim: GsapAnimation): boolean {
  return anim.method === "set" && anim.properties?.data === STUDIO_HOLD_MARKER;
}
