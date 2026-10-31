# Film production in this fork

This fork adds a local preparation step to Hyperframes. Describe selected takes and an edit in a JSON manifest, then create an editable composition with verified local media. Use Claude Code or Codex to work with the files through the account you already use. Preparation and local rendering do not require HeyGen generation.

Current scope: **one picture track, independently timed audio tracks, source trims, constant playback rate, shot/take IDs and direction notes**. This is the first consolidation stage. Provider generation, approval management, automatic ComfyUI execution and a production inspector UI are not implemented here yet.

## Prepare an edit

From the fork checkout:

```sh
bun install --frozen-lockfile
bun run build
bun run film:prepare --manifest .film-workspace/inputs/manifest.json --output .film-workspace/exchange-v1
```

Both arguments are required. Output must be a new directory. To try another edit without replacing hand edits, choose `exchange-v2`. Originals and the input manifest remain unchanged.

The new directory contains:

- `index.html`: ordinary Hyperframes source, editable with its existing timeline tools.
- `assets/`: copied media with the exact supplied SHA-256, checked against actual streams and source duration.
- `production.json`: portable shot/direction metadata and frame-based edit input.
- `preparation.json`: input/output hashes and preparation receipt. Preparation grants no artistic approval.

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

`direction` accepts `camera`, `acting`, `dialogue`, `lighting` and `continuity` text. These notes remain in `production.json`; they do not magically change footage or certify performance. Shot IDs and candidate take IDs provide traceability, not approval authority. This schema is an edit preparation format, not the final provider/reference/job database contract.

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
