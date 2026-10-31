import { useRef, useState } from "react";
import type { ScenePatternId } from "@hyperframes/film-production/browser";

/** A pattern picked in this panel, cleared when the shot changes. */
export function usePinnedPattern(
  shotKey: string,
): [ScenePatternId | null, (patternId: ScenePatternId) => void] {
  const pin = useRef<{ shotKey: string; patternId: ScenePatternId | null }>({
    shotKey,
    patternId: null,
  });
  const [, redraw] = useState(0);
  if (pin.current.shotKey !== shotKey) pin.current = { shotKey, patternId: null };
  const pick = (patternId: ScenePatternId) => {
    pin.current = { shotKey, patternId };
    redraw((count) => count + 1);
  };
  return [pin.current.patternId, pick];
}
