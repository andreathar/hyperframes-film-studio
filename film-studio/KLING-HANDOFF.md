# Kling producer handoff

`film:kling-handoff` connects a prepared `kling-cli` video job to the existing Movies_Projects producer-runner format. It exports a **blocked candidate** for review. It never starts the runner, submits generation, queries an account, uploads a reference or changes a job store.

The film's existing route remains authoritative: the producer uses its installed CLI through `scripts/kling_batch.py`, with its own exact-request release, live schema, quote, upload scope and duplicate checks. This fork does not copy that runner or replace its authorization checks.

## Requirements

Use this fork with its Bun dependencies. Current media verification requires Linux `/proc/self/fd`. Canonical producer hashing uses `python3 -I` and Python's standard library with a fixed script and JSON on stdin, matching the producer's Unicode/number serialization. No Python package, Kling package or API key is installed by this command. `python3` comes from the caller's configured PATH; use your intended project/runtime environment.

You need an imported snapshot, a durable prepared job, the current saved review, and an explicit canonical Movies workspace/film directory. These remain private. The job must still be `prepared`, use `kling-cli`, and target video. The command requires its current store revision and exact prepared request fingerprint. Changes to that shot's reference assignments or plan/legacy mapping invalidate the candidate; unrelated review changes are allowed.

## Explicit native settings

A synthetic example, requiring replacement with settings reviewed for your actual live model:

```json
{
  "tool": "image_to_video",
  "args": {
    "duration": "4",
    "aspect_ratio": "16:9",
    "resolution": "1080p",
    "imageCount": "1"
  },
  "inputSlots": {
    "first_image": "YOUR_ASSIGNED_REFERENCE_ID"
  }
}
```

Supported tool labels are `text_to_video`, `image_to_video` and `omni_ref_video`. These labels do not establish account availability. The prepared model and prompt are preserved exactly; the command does not select a model or rewrite dialogue/acting instructions. `args` values are strings. Duplicate aliases and runner-reserved flags are refused.

Supply duration matching `durationFrames/fps`, an explicit aspect ratio matching width/height, resolution as the intended short edge followed by `p`, and `imageCount: "1"`. This first adapter supports only that consistency profile; it is not a generic mapping of every vendor output setting. Native provider frame rate is unverified. Edit fps and dimensions remain recorded intent, pending live model qualification and output probing.

Map every assigned reference explicitly in `inputSlots`. Text-only handoffs require no references/slots; keyframe handoffs require at least one. No implicit Element binding or reference-role conversion is performed. A role such as identity does not itself approve a start frame. Optional `shotContract` version 1 JSON is preserved unchanged and included in the producer payload hash; its continuity, audio, dialogue, beat and reference semantics still require the existing producer preflight and human review. Motion-control and automatic dialogue compilation remain later work.

References must exist under the chosen canonical film directory, with current bytes matching captured hashes. A symlink cannot escape the opened film boundary. Shared/outside-film inputs are refused; this command never relocates originals to make a request pass. It hashes bytes without asserting media format, identity or creative approval.

## Preview and export

```sh
bun run film:kling-handoff --import .film-workspace/import-v1/import.json --store .film-workspace/jobs-v1 --review .film-workspace/review.json --job reaction-1 --expected-revision 1 --request-fingerprint EXACT_JOB_REQUEST_SHA256 --settings .film-workspace/kling-settings.json --workspace /path/to/Movies_Projects --film projects/your-film
```

Default behavior prints a JSON preview and writes nothing. Add `--output .film-workspace/kling-handoff-v1` to create a new packet outside the canonical workspace. Existing destinations are refused. Parent directories must exist. An I/O failure may leave a partial directory for inspection; retry with a new destination rather than overwriting it.

Export requires trusted workspace/export ancestors that remain in place for the operation. Opened descriptors prevent ordinary symlink redirection; they pin inodes, not namespace locations. The command checks for relocation around each write and refuses success if it detects one. It cannot promise zero writes against a same-user actor able to move an already-open directory between checks; such concurrent relocation is outside the supported boundary, and a failure can leave partial packet files at the moved location. Keep roots stable and inspect failures before reuse.

The packet contains:

- `runner-spec.json`: one job in the producer runner's expected array shape. `auth` is null and `submissionBlocked` is nonempty, so the packet cannot pass the runner as-is.
- `handoff.json`: source/job/review provenance, shot direction and line IDs, output intent, explicit reference bindings/current hashes, settings fingerprint and canonical `producerPayloadSha256`. `executionAllowed`, live-capability verification and native-fps verification remain false.

The job's intent fingerprint and the producer's payload fingerprint serve different purposes. The producer hash includes the effective native tool, arguments, input bytes and optional shot contract. It is the candidate payload hash to review for an eventual producer release. Export does not persist a live request binding into the job ledger; future activation must bind the final request and its external task/result explicitly. Do not treat a downloaded packet, editable JSON or matching hashes as authorization.

## Producer gates still required

The packet is review material. Any live generation requires a fresh producer decision through the canonical film workflow, a matching `kling_job_release`, current model/tool schema, current quote and credit ceiling, reference-upload scope, validated continuity/audio/face restrictions and duplicate/unknown-outcome reconciliation. The producer's existing runner must revalidate the final request and current bytes. This command neither supplies approval values nor clears its submission block.

Higgsfield, ComfyUI and local model execution remain separate adapters. Existing local job tracking and candidate review still work independently. See [TASKS.md](TASKS.md) for the remaining integration work.
