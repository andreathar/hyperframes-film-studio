# Film production in this fork

## Consolidation update — 2026-10-31

The producer requires one GitHub branch, `main`. The coordinator is consolidating existing heads and quality correction `48693f33f`; publication, remote branch cleanup and final integrated checks remain pending verification. Earlier branch/PR inventories are historical captures. [Project controls](PROJECT-CONTROL.md) and [the state register](archive/2026-10-31-stale-controls/PROJECT-STATE.json) record the verified backup and current policy. Recovery/input/descriptor findings, native offline acceptance, assistant/provider qualification and inspector activation remain open; consolidation does not close them.

Current management entrypoints: [quality/efficiency report](archive/2026-10-31-stale-controls/QUALITY-REPORT.md), [observed project state](archive/2026-10-31-stale-controls/PROJECT-STATE.json) and [operating contract](PROJECT-CONTROL.md). Remote PR #7 contains shared package/contracts not present in this checkout; review/reuse it before assigning new extraction work. These documents distinguish local, remote, integrated and activated state.

This fork adds a local preparation step to Hyperframes. Describe selected takes and an edit in a JSON manifest, then create an editable composition with verified local media. Use Claude Code or Codex to work with the files through the account you already use. Preparation and local rendering do not require HeyGen generation.

Current scope: **local intake, explicit candidate review, a production inspector, one picture track, independently timed audio tracks, source trims, constant playback rate, shot/take IDs and direction notes**. Provider generation, approval management and automatic ComfyUI execution remain subsequent work.

Open the [production inspector](INSPECTOR.md) to search imported shots, read direction notes, inspect local media and propose mappings, reference assignments and candidate takes. It uses the same project-bound review contract as `film:review`. Download the review to save session changes; preparing an edit remains a separate explicit step.

Connect [inspector job controls](JOB-CONTROLS.md) to prepare video intent for a selected shot and record saved external receipts. Jobs save automatically to the ledger; review proposals still need Download review.

Use the [local job ledger](JOBS.md) to retain prepared generation intent and reconcile external result receipts with source/review provenance, duplicate checks and verified local output hashes. It records candidate observations; live provider execution remains a later integration.

The [Kling producer handoff](KLING-HANDOFF.md) exports a verified, blocked candidate from a prepared job for the existing film release runner. See [the task checklist](TASKS.md) for completed modules and remaining live/timeline integration.

Use [explicit candidate placement](PLACEMENT.md) to turn selected takes and an authored frame-based cut plan into a new editable composition. It checks current media and retains original IDs/direction provenance while preserving existing edits.

The revised [execution plan](EXECUTION-PLAN.md), [design](PRODUCTION-DESIGN.md) and [checkpoint review](archive/2026-10-31-stale-controls/CHECKPOINT-REVIEW.md) define the next integrated work. First delivery is a durable owned-media cycle in native Studio; scene assistance and qualified providers follow the same contracts. These remain proposals. Runtime repair is committed separately at `3532efca9` and still needs integration; activation is a distinct step.

## Prepare an edit

From the fork checkout:

```sh
bun install --frozen-lockfile
bun run build:local
bun run film:prepare --manifest .film-workspace/inputs/manifest.json --output .film-workspace/exchange-v1
```

`build:local` is the film loop. It does not compile the AWS Lambda, Cloud Run, or SDK playground packages. `bun run build:cloud` builds those three, and `bun run build` runs both.

Both arguments are required. Output must be a new directory. To try another edit without replacing hand edits, choose `exchange-v2`. Originals and the input manifest remain unchanged.

The new directory contains:

- `index.html`: ordinary Hyperframes source, editable with its existing timeline tools.
- `assets/`: copied media with the exact supplied SHA-256, checked against actual streams and source duration.
- the generated production manifest JSON: portable shot/direction metadata and frame-based edit input.
- the generated preparation receipt JSON: input/output hashes and preparation receipt. Preparation grants no artistic approval.

The input's media paths are relative to its directory. Absolute paths, URLs, traversal and symlinks escaping that directory are refused. Copy owned inputs into a private preparation folder first; keep originals. Obtain their hashes with `sha256sum <file>` and put each actual hash in the manifest.

## Manifest version 1

The shape below is illustrative. Supply a real local file and hash before running it.

```json
{
  "version": 1,
  "project": {
    "id": "exchange",
    "title": "Exchange review",
    "fps": 24,
    "width": 1920,
    "height": 1080
  },
  "assets": [
    {
      "id": "speech",
      "path": "owned-speech.mp4",
      "kind": "video",
      "sha256": "REPLACE_WITH_ACTUAL_SHA256"
    }
  ],
  "shots": [
    {
      "id": "shot-1",
      "title": "Speech",
      "lineIds": ["line-1"],
      "direction": {
        "camera": "Locked",
        "acting": "Pause before replying",
        "dialogue": "Canonical line from the approved script"
      }
    }
  ],
  "edit": {
    "durationFrames": 96,
    "clips": [
      {
        "id": "picture",
        "shotId": "shot-1",
        "takeId": "candidate-1",
        "assetId": "speech",
        "kind": "video",
        "track": 0,
        "startFrame": 0,
        "durationFrames": 96,
        "sourceInFrame": 0,
        "rate": 1,
        "volume": 0
      },
      {
        "id": "dialogue",
        "shotId": "shot-1",
        "assetId": "speech",
        "kind": "audio",
        "track": 1,
        "startFrame": 0,
        "durationFrames": 96,
        "sourceInFrame": 0,
        "rate": 1,
        "volume": 1
      }
    ]
  },
  "notes": "Candidate review only; original approvals remain authoritative."
}
```

All timings are integer frames at the project's integer frame rate (1–120 fps). `sourceInFrame` is source time at that same frame rate. `rate` is source playback speed (0.1–10); duration is output duration, so a 48-frame clip at rate 2 consumes 96 source frames. Fractional-frame-rate projects require a later schema version. Preparation requires a known duration for each used stream; a container duration alone is insufficient. Media with unknown per-stream coverage is refused rather than risking truncated dialogue.

Picture clips occupy track 0 without gaps or overlaps and have `volume: 0`. Place their sound separately to support J/L cuts without doubling it. Audio tracks 1–64 can overlap each other and picture; clips on the same track cannot overlap. Every clip must remain inside the composition. Unknown fields, unsupported effects or picture tracks fail instead of silently disappearing.

`direction` accepts `camera`, `acting`, `dialogue`, `lighting` and `continuity` text. These notes remain in the generated production manifest JSON; they do not magically change footage or certify performance. Shot IDs and candidate take IDs provide traceability, not approval authority. This schema is an edit preparation format, not the final provider/reference/job database contract.

## Check, edit and render

Use the CLI built from this fork rather than downloading another version:

```sh
HYPERFRAMES_NO_TELEMETRY=1 node packages/cli/bin/hyperframes.mjs lint .film-workspace/exchange-v1
HYPERFRAMES_NO_TELEMETRY=1 node packages/cli/bin/hyperframes.mjs check .film-workspace/exchange-v1 --json
HYPERFRAMES_NO_TELEMETRY=1 node packages/cli/bin/hyperframes.mjs timeline .film-workspace/exchange-v1 --json
HYPERFRAMES_NO_TELEMETRY=1 node packages/cli/bin/hyperframes.mjs render .film-workspace/exchange-v1 --output .film-workspace/exchange-v1.mp4
```

Run lint and browser check before preview/render. Use the normal preview/timeline tools to edit the composition. The preparation manifest is not automatically kept in sync with later HTML edits; preserve the composition as the current edit. Re-preparing into a different directory is an explicit new candidate, never a silent replacement.

Private operator files, footage, renders and evidence belong under ignored `.film-workspace/`. Do not commit or upload them. There is no paid generation code in this preparation tool. Existing platform adapters and production approvals in the source projects remain separate until an explicit integration is implemented and accepted.

## Verification and upstream provenance

```sh
bun run film:test
bun run test:scripts
node_modules/.bin/oxlint scripts/film-production
node_modules/.bin/oxfmt --check scripts/film-production package.json
```

The film tests exercise real filesystem preparation, source probing, hash drift, escaping paths, timing, independent audio and preservation of an edited output. Media cases require FFmpeg/ffprobe and explicitly skip when FFmpeg is absent. Root script tests include the film test so CI can reach it.

Hyperframes remains Apache-2.0; see the root LICENSE and retain upstream notices. This initial implementation copies no code from the other studios. The comparative research identifies candidates for subsequent deliberate adoption, including their separate dependency notices and acceptance gates.

## Existing film records

Use `bun run film:import --workspace /path/to/Movies_Projects` for a read-only inventory/reconciliation report. Add `--output .film-workspace/import-v1` to save a new private candidate snapshot. See [the import contract](IMPORT.md) for source namespaces, hash checks and approval boundaries. This intake stage does not yet synchronize the production records with a timeline or activate providers.

## Mapping and candidate review

Use `bun run film:review --import <private-import.json>` to initialize a project-scoped review. Resume it with `--state`, propose explicit `--actions`, and save to a new `--output` file. See [the review contract](REVIEW.md). The service keeps mappings/reference roles/candidate takes bound to the import fingerprint and review revision; it grants no artistic or spending approval.
