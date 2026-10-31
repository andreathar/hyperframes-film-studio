# Kling producer handoff delivery

The fork now exports a prepared Kling video job into a blocked candidate for the existing Movies producer release runner. The compiler preserves model/prompt, shot direction and line IDs, checks current shot reference/mapping context, requires explicit native settings and slot assignments, and verifies current film-confined reference bytes. Export retains null authorization, a nonempty submission block and false execution permission.

The packet distinguishes the coarse job intent fingerprint from the canonical producer payload hash. Python 3 standard-library serialization matches the producer's exact JSON/hash rules. No model is selected from static knowledge, no live capabilities are claimed, and no provider runtime or API is invoked by the product.

## Evidence

- Fresh isolated worktree: locked Bun dependency install and full package build passed.
- `bun run film:test`: 125 passed, zero failures/skips; 26 handoff-specific checks.
- `bun run test:scripts`: 984 Node +109 Vitest tests passed (1,093 total).
- Reachability, oxlint, oxfmt and diff checks passed.
- Actual CLI tests cover preview, explicit new export, blocked fields and no overwrite.
- Synthetic compatibility acceptance compared an exported candidate to the current canonical `kling_release.fingerprint`: exact match, including reference bytes, Unicode key order/text and small decimal values. The current canonical runner rejected that packet before a disposable provider-command sentinel could run. No provider was contacted; the fixture's byte labels are not media/creative acceptance.
- Independent review found an open-directory relocation issue. It was reproduced with failing regressions, corrected with location checks around each write and an explicit trusted/non-relocating ancestor requirement, then verified by passing tests. There was no second independent review. A same-user actor able to move open ancestors between checks is outside the zero-write guarantee; detected relocation fails and can leave partial packet evidence.
- The initial nested worktree triggered an existing edit-accuracy path-filter test by exposing a parent checkout file as a false dependency. Moving this owned worktree beside the canonical checkout made that unchanged test and the full suite pass. No unrelated test/filter changes were made.
- The real inspector remains revision zero; seven imported source documents still match their hashes. The original checkout's seven staged research/review files remain separate and unchanged by this increment.

Private logs, synthetic integration packets and review artifacts remain local. No real job choice, release record, upload, generation, balance query, model load, timeline edit or canonical film mutation was performed.

## Documentation and tasks

The command/settings contract is [KLING-HANDOFF.md](KLING-HANDOFF.md); the tracked roadmap is [TASKS.md](TASKS.md). The film guide, command index, README and job-service guide now link the handoff. The source lives on `feat/film-kling-handoff`, stacked on `feat/film-production`, to preserve the original checkout's staged work. The Plannotator adapter card carries the delivery/review status.

Next work remains live model/tool qualification and an exact producer release/result binding, inspector job controls, candidate-to-timeline placement and byte-preserving manual candidate intake. This software delivery does not clear those gates.
