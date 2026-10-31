# Production inspector

The inspector is a local companion to Hyperframes Studio. Search imported film records, inspect direction and dialogue line IDs, preview eligible local references/takes, and make explicit review proposals. It uses the existing `film:review` service, including project identity, import fingerprint, revision checks and replayable history.

## Start a session

From this fork's checkout after installing workspace dependencies:

```sh
bun run film:inspect --import .film-workspace/import-v1/import.json --workspace /path/to/Movies_Projects --port 9362
```

Open the printed loopback URL. Choose a free port if 9362 is occupied. `--import` is required. `--workspace` is optional: without it the review works, but media previews are unavailable. To resume a downloaded review against the same import, add `--state .film-workspace/review.json`.

Add `--jobs <existing-store>` to connect durable local job controls. Add `--results-workspace <existing-directory>` to allow saved receipt recording; this flag requires `--jobs`. Both roots are fixed at startup. See [job controls](JOB-CONTROLS.md) for setup, video intent and recovery. Job records save automatically; review proposals still need Download review.

The server binds to `127.0.0.1` only. Its configured import and review files are read at startup. The browser cannot choose arbitrary filesystem paths. Stop this process with Ctrl+C when finished.

Each server captures the complete inspector HTML, JavaScript and stylesheet when it is created. Later checkout or asset changes take effect in a new server instance; refreshing the browser keeps the running server's UI version. A missing required UI asset prevents startup. Download any unsaved review before stopping a session to load an updated version.

## Review records

1. Search shots by ID, title or direction, or filter by source.
2. Select a visual-plan shot and propose its equivalent legacy shot. Supply a reason; mapping is never inferred from similar IDs.
3. Assign an eligible reference using its declared role and observed hash. Supply a reason for each assignment or removal.
4. Select a compatible candidate take, or remove a selection, with a reason. Changing a mapping clears its dependent take selection.
5. Download the review JSON to save the current session. Keep the downloaded file under your private workspace.

Each accepted proposal advances the session revision. If another tab changes it, a stale proposal is refused; use **Reload session**, inspect the latest state and decide again. Reloading the browser or using Reload session retains the server's in-memory changes. Stopping/restarting the server loses unsaved changes; resume explicitly with `--state` to restore a saved review. The input files are never overwritten.

Source declarations, including an imported status such as accepted, remain source evidence. A candidate selection grants no creative approval or execution permission. The reconciliation findings describe the imported snapshot; they are not recomputed as live source findings when a review proposal changes.

## Local media

Previews are limited to known available, non-archived records in the configured workspace. Before serving bytes, the server resolves the real path inside that workspace, checks a regular file and a supported media type, and matches the imported observed SHA-256. Changed bytes are refused until a fresh import is made. Supported formats are PNG, JPEG, WebP, GIF, MP4, WebM, WAV, MP3 and M4A, up to 128 MiB per file. Playback depends on the browser's codecs; this first version serves whole files without range requests.

The inspector does not fetch provider URLs, submit jobs, load models, mutate source records or write the edit timeline. Use `film:prepare` separately for composition preparation. Claude Code and Codex can work with the local project files through their existing sessions; this inspector does not consume HeyGen generation credits.

## Verification

```sh
bun run film:test
node scripts/film-production/inspector-browser.mjs
node scripts/film-production/inspector-jobs-browser.mjs
```

The browser runner uses the repository's headless Chrome helper and isolated synthetic records. It checks keyboard access, mapping, take selection/removal, download contents, session reload, stale-revision recovery and desktop/mobile overflow. It closes its temporary server and browser. Screenshots and its result JSON go under ignored `.film-workspace/inspector-browser/`. These checks exercise software behavior; the producer still reviews actual film content.
