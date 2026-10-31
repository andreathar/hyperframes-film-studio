import type { FilmReleaseProfileV1 } from "../model.js";

/**
 * Release limits for The Table Between Centuries.
 * Omni, multishot, and native sound are profile diagnostics, not a Kling model catalog.
 */
export const TABLE_BETWEEN_CENTURIES_KLING_PROFILE: FilmReleaseProfileV1 = {
  id: "table-between-centuries",
  restrictions: [
    {
      code: "omni-multishot-limited",
      route: "kling",
      message:
        "The Table Between Centuries does not release Kling Omni or multishot. More than one reference is a film profile limit, not a Kling model list.",
      when: { minReferences: 2 },
    },
    {
      code: "native-sound-limited",
      route: "kling",
      message:
        "The Table Between Centuries does not release Kling native sound. Dialogue and score stay in the edit. This is a film profile limit, not a Kling model list.",
      when: { soundStrategy: "native" },
    },
  ],
};
