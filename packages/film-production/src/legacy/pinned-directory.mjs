import { constants } from "node:fs";
import { open } from "node:fs/promises";

const DIRECTORY_FLAGS =
  constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NONBLOCK | constants.O_NOFOLLOW;

/** Open a directory and pin that descriptor with `/proc/self/fd`. Caller closes `handle`. */
export async function openPinnedDirectory(path) {
  const handle = await open(path, DIRECTORY_FLAGS);
  return { handle, pinned: `/proc/self/fd/${handle.fd}` };
}
