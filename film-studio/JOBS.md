# Local provider job preparation and reconciliation

`film:jobs` records generation intent and externally supplied results in one private, durable job store. It keeps requests connected to imported shots, replay-checked review state and assigned reference hashes. It does not call a provider, compile a vendor API payload, check balances, start models or approve media.

This stage uses Node built-ins and the existing Bun workspace. Continue using Claude Code or Codex for local authoring through your existing sessions. No embedded paid agent API or HeyGen generation is required.

Use [inspector job controls](JOB-CONTROLS.md) for selected-shot video intent and saved receipt forms backed by this same store. The CLI remains available for image intent and operator inspection.

## Initialize and inspect

```sh
bun run film:jobs --import .film-workspace/import-v1/import.json --store .film-workspace/jobs-v1 --operation init
bun run film:jobs --import .film-workspace/import-v1/import.json --store .film-workspace/jobs-v1
```

The store must be new when initialized; its parent directory must exist. Default `show` only reads the ledger. Keep one canonical store for the project and retain the import that created it. Changed import bytes or another project are refused. There is no automatic migration between import snapshots.

## Prepare intent

Write a private request JSON using actual imported shot keys and your explicitly chosen model label:

```json
{
  "id": "reaction-1",
  "shotKey": "plan:S1",
  "route": "kling-cli",
  "model": "EXPLICIT_MODEL_LABEL",
  "prompt": "A quiet reaction, eye level. Pause before answering.",
  "output": {
    "kind": "video",
    "width": 1920,
    "height": 1080,
    "fps": 24,
    "durationFrames": 96
  }
}
```

```sh
bun run film:jobs --import .film-workspace/import-v1/import.json --store .film-workspace/jobs-v1 --operation prepare --review .film-workspace/review.json --request .film-workspace/request.json --expected-revision 0 --reason "Prepare reaction candidate"
```

The request saves the source shot, including its direction/line IDs, the complete review snapshot and the shot's assigned references with roles and hashes. References must remain eligible in the supplied import. This is captured provenance, not a check of current reference files or approval of the prompt.

Supported route labels are `kling-cli`, `higgsfield-manual`, `comfyui-manual` and `local-manual`. They describe intended handoff only; no adapter is enabled and the model label is not validated against live capabilities. `kling-cli` preserves the film's planned CLI route without bypassing its existing release process. Provider-specific settings, dialogue/motion compilation, external registrations and fresh generation authorization are subsequent integration work.

Output supports `video` with integer width/height (1–16384), fps (1–120) and durationFrames (1–fps×3600), or `image` with width/height only. These are local intent limits, not provider capabilities. Unknown fields are refused. The prompt is explicitly authored; direction notes are retained separately and are not silently compiled into it.

Duplicate intent is refused within this store. Its fingerprint uses route, model, exact prompt, output specification and distinct reference role/hash pairs. Renaming the job, changing the shot label, changing only review history/reasons or using aliases for the same reference bytes does not create a new intent. A changed effective prompt/settings/input can create a separate job. Identical intentional reruns, including failed requests, need a later retry policy; there is no retry command now. Copying stores defeats store-local duplicate protection, so this is not global exactly-once execution.

## Prepare a Kling producer handoff

Use [film:kling-handoff](KLING-HANDOFF.md) to export a prepared Kling video job with explicit native settings and verified canonical film references. It creates a blocked review packet and does not mutate this store or activate a provider.

## Record an external observation

An external tool or operator supplies a receipt JSON under an explicit workspace root. Use the exact `requestFingerprint` printed for the prepared job:

```json
{
  "version": 1,
  "projectId": "YOUR_IMPORTED_PROJECT_ID",
  "jobId": "reaction-1",
  "requestFingerprint": "EXACT_PREPARED_REQUEST_SHA256",
  "route": "kling-cli",
  "externalId": "EXTERNAL_TASK_ID",
  "status": "reported-running",
  "outputs": []
}
```

```sh
bun run film:jobs --import .film-workspace/import-v1/import.json --store .film-workspace/jobs-v1 --operation observe --workspace /path/to/owned-results --receipt receipts/reaction.json --expected-revision 1 --reason "Record external task receipt"
```

Every mutation requires the current ledger revision and a nonempty reason. A stale writer fails without changing the saved state. Receipt project/job/fingerprint/route must match. A route/external ID pair belongs to one job and cannot change after being recorded. For an uncertain outcome, use `status: "unknown"`; `externalId` may be null only while no ID is known. Reconcile that same job when evidence arrives.

States are `prepared`, `unknown`, `reported-running`, `reported-failed` and `reported-succeeded`. Unknown/running can be reconciled to either terminal result. Terminal states cannot regress or be rewritten. Repeated observations are explicit ledger transitions, not automated polling; rereading `show` never polls a vendor.

A success receipt requires 1–16 outputs, for example:

```json
{
  "path": "results/reaction.mp4",
  "kind": "video",
  "sha256": "ACTUAL_FILE_SHA256"
}
```

Put these records in the receipt's `outputs` array; other statuses require an empty array. Output kind must match the prepared kind. Receipt and output paths are relative to the workspace, confined after resolving symlinks. URLs, absolute paths and traversal are refused. Receipt bytes are hashed and bounded to 1 MiB. Each nonempty regular output is streamed and must match its declared SHA-256, up to 2 GiB per file. Media stays in place. Hash checks establish bytes; they do not probe the codec, timing, image identity or cinematic quality.

Receipt inspection currently requires **Linux with `/proc/self/fd` available**. It verifies the opened file descriptor inside the workspace, covering a replaced filename or parent directory between path checking and opening. Special files are opened without blocking and rejected before reading. The command fails closed when descriptor verification is unavailable. JSON inputs also require regular files; a final-entry symlink is refused.

Outputs are recorded as **candidates**, with `executionAllowed: false` throughout. They are not automatically imported as takes, selected, placed on the timeline or approved. Supplied receipt text is not authenticated provider evidence. Restoring history checks internal consistency against captured evidence; it does not reread historic media or authenticate the author of editable JSON.

## Persistence and recovery

The store writes the generated state.json file with private permissions, flushing the replacement file before atomic rename and syncing its directory. A writer holds `.write.lock`; concurrent writers fail rather than steal it. Invalid commands, missing/changed output bytes and stale revisions leave the published state unchanged. JSON inputs/state are capped at 32 MiB and history at 10,000 transitions.

A crash can leave a lock or an unreferenced temporary state file. Inspect the recorded PID and actual owner before manual recovery; the command never removes another writer's lock automatically. If a write reports an I/O failure, reread the store before deciding what happened: failure after publication can leave the new revision visible. These local safeguards do not provide provider submission authority or coordinate cloned stores.

Use `bun run film:test` for reducer, filesystem and actual CLI coverage. All fixtures are synthetic; these tests require no accounts, provider credits or GPU models.
