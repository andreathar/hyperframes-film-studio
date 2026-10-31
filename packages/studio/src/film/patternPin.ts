import { useCallback, useState } from "react";
import type { ScenePatternId } from "@hyperframes/film-production/browser";

/** A pattern picked in this panel, cleared when the shot changes. */
export function usePinnedPattern(
  shotKey: string,
): [ScenePatternId | null, (patternId: ScenePatternId) => void] {
  const [pin, setPin] = useState<{ shotKey: string; patternId: ScenePatternId | null }>({
    shotKey,
    patternId: null,
  });
  if (pin.shotKey !== shotKey) setPin({ shotKey, patternId: null });
  const patternId = pin.shotKey === shotKey ? pin.patternId : null;
  const pick = useCallback((id: ScenePatternId) => setPin({ shotKey, patternId: id }), [shotKey]);
  return [patternId, pick];
}
