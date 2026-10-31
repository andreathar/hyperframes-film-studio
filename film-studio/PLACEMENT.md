# Place reviewed candidates into a new edit

`film:place` connects explicit review selections to the existing Hyperframes preparation pipeline. You author shot order, source trims, timing, tracks, rate and volume; the command verifies that each named take is still selected for its source shot. It prepares a **new** composition and preserves existing edits and originals.

## Inspect the current bindings

```sh
bun run film:place --import .film-workspace/import-v1/import.json --review .film-workspace/review.json --describe
```

This read-only command prints the project ID, source fingerprint, saved-review fingerprint/revision and current candidate selections. It does not invent a cut. Use these exact binding values in your plan. A changed import or saved review requires a new explicit plan.

## Write an explicit cut plan

A synthetic example; replace its identifiers and hashes with your saved review's values:

```json
{
  "version": 1,
  "project": {
    "id": "YOUR_PROJECT_ID",
    "title": "Exchange candidate",
    "fps": 24,
    "width": 1920,
    "height": 1080
  },
  "sourceFingerprint": "EXACT_IMPORT_FINGERPRINT",
  "reviewFingerprint": "EXACT_SAVED_REVIEW_FINGERPRINT",
  "expectedReviewRevision": 2,
  "reason": "Compare this explicit cut",
  "edit": {
    "durationFrames": 48,
    "clips": [
      {
        "id": "picture",
        "shotKey": "plan:S1",
        "takeId": "YOUR_SELECTED_TAKE_ID",
        "kind": "video",
        "track": 0,
        "startFrame": 0,
        "durationFrames": 48,
        "sourceInFrame": 12,
        "rate": 1,
        "volume": 0
      },
      {
        "id": "dialogue",
        "shotKey": "plan:S1",
        "takeId": "YOUR_SELECTED_TAKE_ID",
        "kind": "audio",
        "track": 1,
        "startFrame": 0,
        "durationFrames": 48,
        "sourceInFrame": 0,
        "rate": 1,
        "volume": 0.8
      }
    ]
  }
}
```

The project ID must match the import. Title, integer frame rate, dimensions and every clip value are explicit. The existing manifest limits apply: picture fills track 0 without gaps/overlap, picture sound is muted, audio uses independent tracks 1–64, and every clip stays inside the edit. Separate audio can cross picture boundaries for J/L cuts. Actual source-stream duration must cover each trim/rate.

Each clip must name the currently selected take for that exact shot key. There is no fallback to an imported accepted flag or another compatible take. Source/mapping/selection changes invalidate the saved review or plan binding. Unknown fields/effects are refused.

## Preview, then prepare

```sh
bun run film:place --import .film-workspace/import-v1/import.json --review .film-workspace/review.json --plan .film-workspace/cut.json
bun run film:place --import .film-workspace/import-v1/import.json --review .film-workspace/review.json --plan .film-workspace/cut.json --workspace /path/to/Movies_Projects --output .film-workspace/exchange-placement-v1
```

Default preview validates the supplied records/plan and prints the compiled manifest and provenance. It does not read current media or write files. Applying requires both workspace and output. The output parent must exist; output must be new and outside the canonical workspace. Linux `/proc/self/fd`, FFmpeg/ffprobe and the existing Bun dependencies are required. Media is read from confined regular-file descriptors, streamed to private temporary copies and checked against captured hashes. The existing preparer then checks real streams/durations and creates portable local assets.

The new directory contains:

- `index.html`, `assets/`, the generated production.json file, the generated preparation.json file: the ordinary editable composition and existing preparation receipt.
- the generated placement.json file: original shot/take identities, full source shot records, source/review/plan fingerprints, safe alias mappings, clip provenance and direction diagnostics. Candidate status grants no creative or execution approval.

Safe internal aliases such as `shot-1` and `take-1` keep source identifiers containing punctuation out of HTML IDs. Original IDs remain exact in provenance. Dialogue line IDs are preserved; values the current manifest cannot represent are refused. Supported string camera/acting/dialogue/lighting/continuity fields project into the generated production.json file. Other direction fields remain in full source records in the generated placement.json file with explicit diagnostics; they are not silently converted into acting or camera instructions.

## Preserve work and verify

The command refuses an existing output, including a hand-edited composition. Prepare another candidate in a new directory. It never synchronizes over your timeline, modifies review/job/source files, generates media or infers artistic acceptance. This first bridge uses streams from selected takes. Additional standalone music/room-tone assets remain available through the existing [manifest workflow](README.md).

Workspace/export ancestors must be trusted and stationary while the operation runs. Detected parent relocation fails; partial private `.film-placement-*` scratch may remain after an error for inspection. The filesystem checks do not promise protection against a same-user actor moving open ancestors between checks. Do not reuse partial output directories.

Run the normal Hyperframes lint and browser check on the generated composition before preview/render, then inspect picture and sound. The source file remains the editable cut; a later preparation is a separate candidate.
