# Prepare and record jobs in the inspector

The selected-shot inspector can now prepare durable local **video intent** and record saved external receipts in an existing project job store. No provider transport is enabled. Use Claude Code or Codex through the sessions you already have; these controls require no HeyGen generation credits.

## Connect a store

Initialize a new store once using the same import as the inspector. Its parent directory must exist:

```sh
bun run film:jobs --import .film-workspace/import-v1/import.json --store .film-workspace/jobs-v1 --operation init
```

Then start a separate inspector on a free loopback port. Keep an existing running session until you have downloaded its review:

```sh
bun run film:inspect --import .film-workspace/import-v1/import.json --state .film-workspace/review.json --workspace /path/to/Movies_Projects --jobs .film-workspace/jobs-v1 --results-workspace /path/to/owned-results --port 9363
```

Omit `--state` to start a new empty review; omit `--workspace` if source previews are unnecessary. `--jobs` must name an existing valid store for the exact project/import. `--results-workspace` is optional and must be an existing directory; it requires `--jobs`. The browser cannot change either configured root. Without a results root, preparation works and receipt recording is unavailable. Without a store, the original review-only inspector still works.

## Prepare video intent

1. Choose the exact shot. Review its direction and explicitly assign references as needed.
2. Open **Prepare video job intent**. Enter a unique job ID, route intent, model intent, prompt and reason. Check the editable width, height, frame rate and duration defaults before saving.
3. Choose **Save video job intent**. The server captures its own current review snapshot and writes the job ledger using current review and store revisions.

Route/model labels do not qualify live capabilities. Notes are retained as provenance; dialogue, acting and camera notes are not automatically compiled into the prompt. The browser creates video intent only; the existing CLI also supports image intent. Duplicate effective intent is refused even with a different job ID. No generation, upload, model loading or approval occurs.

## Record a saved receipt

For a nonterminal job, open **Record a saved receipt**, enter a path relative to the fixed results workspace and a reason, then record it. Use the existing [receipt schema](JOBS.md). The receipt must name the selected job, matching project, request fingerprint and route. Success requires matching local output hashes; escaped paths, changed bytes and receipts for another job are refused before publication. Raw receipt/output paths and contents are not exposed in the browser job list.

Reported running, failed, succeeded and unknown states describe external observations. Success outputs remain candidates, with no automatic take registration, approval or timeline placement. Terminal jobs cannot accept another receipt. A successful receipt does not qualify the adapter or authorize another request.

## Save and recover

**Jobs save automatically** to the configured durable store. **Review proposals stay in server memory** until you use Download review. Restarting the inspector restores jobs from disk; resume the saved review with `--state` separately.

A refused write preserves the current typed form. Read the error before choosing **Reload session**, which refreshes both revisions and rebuilds the forms; copy any draft you want to keep before reloading or choosing another shot. If another client advanced the review/store, inspect the refreshed state before deciding again. A job-store read failure leaves shot review available and offers a reload. Existing writer locks are not stolen.

The browser shares the inspector's loopback Host/Origin/session-token/JSON checks and bounded UTF-8 request reader. Review/job writes within one server are serialized. The job store also guards against other writers using its exclusive lock and expected revision.

## Software verification

```sh
bun run film:test
node scripts/film-production/inspector-jobs-browser.mjs
```

The browser runner uses isolated synthetic records and a temporary store/results directory. It verifies preparation, receipt recording, refusal with drafts preserved, reload persistence, shot filtering, keyboard access, desktop/mobile layouts, dark mode and no horizontal overflow. Artifacts go under ignored `.film-workspace/inspector-jobs-browser/`. Temporary servers, browser and data are closed/removed. Software checks do not approve the film or demonstrate live provider integration.
