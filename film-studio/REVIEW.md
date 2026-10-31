# Map shots and review candidate assignments

`film:review` adds a local review state to an import candidate. It supports explicit plan-to-legacy shot mapping, source-role reference assignment and candidate take selection. It does not approve media, submit jobs or edit a timeline.

## Start or resume

```sh
bun run film:review --import .film-workspace/import-v1/import.json
bun run film:review --import .film-workspace/import-v1/import.json --output .film-workspace/review-v1.json
bun run film:review --import .film-workspace/import-v1/import.json --state .film-workspace/review-v1.json --actions .film-workspace/commands.json --output .film-workspace/review-v2.json
```

Without `--output`, the CLI prints the proposed state only. Output is one new private JSON file, created exclusively; its parent directory must exist. Existing files are never replaced. Preserve the previous review file for rollback. A failed write is not a committed database transaction; reject incomplete JSON. The format is local file-based review, not the final multi-user service.

The initial state has no mappings, references or selected candidates. Each command carries `projectId`, the printed `sourceFingerprint`, `expectedRevision`, and one `action`. The entire import JSON is fingerprinted canonically, so any candidate content change requires a new review. Each successful command increments the revision and records its full input in history; later commands in the same batch must use the new revision.

## Commands

| Action type        | Fields in addition to `type` and required nonempty `reason` |
| ------------------ | ----------------------------------------------------------- |
| `link-shot`        | `planShotKey`, `legacyShotKey`                              |
| `unlink-shot`      | `planShotKey`                                               |
| `assign-reference` | `shotKey`, `referenceId`, `role`, `expectedMediaSha256`     |
| `clear-reference`  | `shotKey`, `referenceId`                                    |
| `select-take`      | `shotKey`, `takeId`, `expectedMediaSha256`                  |
| `clear-take`       | `shotKey`                                                   |

An illustrative command array (replace project, fingerprint and IDs with the inspected candidate):

```json
[
  {
    "projectId": "film",
    "sourceFingerprint": "COPY_THE_CURRENT_REVIEW_FINGERPRINT",
    "expectedRevision": 0,
    "action": {
      "type": "link-shot",
      "planShotKey": "plan:S1",
      "legacyShotKey": "manifest:OLD1",
      "reason": "Explicit comparison of the intended coverage"
    }
  }
]
```

The first crosswalk is deliberately one-to-one. Same names or imported acceptance flags do not create a mapping. A plan shot can select a take only after a mapping to the take's recorded legacy shot; a legacy shot can select its own recorded take directly. Changing or removing a plan mapping clears that plan shot's candidate selection. Clearing an assignment never deletes source media.

Reference assignment requires an explicit nonempty role matching the source declaration and matching declared/observed/requested hashes. References without declared roles need source reconciliation before assignment. Takes require available nonarchived media with a matching observed hash and compatible source shot. Selection is recorded as `candidate` regardless of historical accepted status.

## Integrity and limits

Replay checks project, fingerprint, revisions, allowed fields, source identity, media observations and the resulting state. Editing a saved state's selected rows without matching history is refused. This is not user authentication: anyone who can write the files can construct a new history. No actor identity, artistic approval, verified remote registration or spending permission is inferred.

Hashes bind to the supplied import observation, not the current media filesystem. Re-import and reconcile changed/missing sources before later consequential use. The review cannot resolve upstream conflicts, authenticate imported data or establish provider readiness. `executionAllowed` always stays false.

A CLI batch is capped at 1,000 commands; a review history is capped at 10,000 events. Large histories are intended for checkpoint/redesign work before a persistent service, not unlimited replay. Current tests cover the targeted transitions, stale/foreign state, changed import, unsupported approval fields, reference roles/hashes, missing/archived takes, invalidation, serialization/replay and CLI preservation.
