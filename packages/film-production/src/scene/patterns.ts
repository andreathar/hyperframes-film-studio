import { scenePattern, type ScenePatternId, type ScenePatternV1 } from "../model.js";

/**
 * Prompt text for a pattern, plus the locked-path rule.
 * The pattern catalog itself stays on SCENE_PATTERNS.
 */

const TRAVEL_WORDS = ["dolly", "orbit", "push", "pan", "track", "crane"] as const;

export function patternOf(id: ScenePatternId | null): ScenePatternV1 | null {
  if (id === null) return null;
  return scenePattern(id);
}

export function patternPrompt(
  id: ScenePatternId | null,
): { summary: string; camera: string; sound: string } | null {
  const pattern = patternOf(id);
  if (!pattern) return null;
  return {
    summary: `${pattern.title}. ${pattern.summary}`,
    camera: pattern.cameraConstraint,
    sound: pattern.soundConstraint,
  };
}

export function cameraPathContradicts(path: string): boolean {
  const text = path.toLowerCase();
  if (!text.includes("lock")) return false;
  return TRAVEL_WORDS.some((word) => text.includes(word));
}
