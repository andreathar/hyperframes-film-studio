# Candidate placement code review

codeQualityStatus: WATCH
recommendation: APPROVE
blockers: []

Reviewed checkout: `/mnt/data/Projects_SSD/hyperframes-film-kling-handoff`
Branch: `feat/film-timeline-placement`
Base/HEAD at inspection: `84ec48ba08c317fddd638b11c1a66e5796e72499` (implementation is uncommitted).

## Scope and evidence

Read the complete new placement compiler, preparer, CLI and tests; the job-store diff and surrounding implementation; manifest, prepare and review dependencies; PLACEMENT.md and PLACEMENT-PLAN.md; package scripts and changed README/TASKS/guide/CLI documentation. No code, index or HEAD edits were made. This report is the only review artifact written.

Independently executed `node --test scripts/film-production/placement.test.mjs`: 23 tests, 23 passed, zero failed/skipped, exit 0. Tests use newly generated synthetic FFmpeg video/audio and private temporary directories. Inspected suite assertions and actual CLI subprocess coverage, rather than relying on the supplied passing claim.

An inline Node reproduction loaded the test fixture function, changed lineIds exactly as the existing test does, and printed `Foreign project, changed source or stale review revision`. Replaying the original review commands against the changed bundle and updating plan source/review hashes printed `lineId: invalid ID`. This establishes both the test gap and correct current production rejection.

`omo-agent-toolkit ulw-loop status --json` could not return currentAttemptDir: its installed runtime target is missing. No ULW plan or notepad path was supplied/discovered in the task artifacts; this report uses the required fallback evidence path. Prior unrelated .omo review material was not used.

## Findings

### CRITICAL

None.

### HIGH

None within the explicitly documented trusted, stationary workspace/output-ancestor boundary.

### MEDIUM

1. **The line-ID rejection test never reaches the behavior it names.** `scripts/film-production/placement.test.mjs:203` changes the bundle after its review has been created; the generic throw assertion at line 212 accepts the review fingerprint failure. The test would still pass if placement silently dropped or rewrote invalid line IDs after successful review replay. Create the invalid-line source before constructing/replaying the review, rebind the plan, and assert the line-ID validation error. Production currently behaves correctly, as independently reproduced; this is a nonblocking coverage issue.

### LOW

None.

## Correctness and scope assessment

Review history is replayed before selection is consumed, including crosswalk and take ownership checks. Exact saved review fingerprint, source fingerprint, project and revision are bound. Selected take/hash and availability are checked; aliases preserve canonical selected shot identity and full selected shot records. The compiler retains explicit timing and separate audio placement and delegates preparation constraints to existing manifest validation.

Media copying hashes the same descriptor stream written into private staging; preparation independently checks copied hashes and actual stream duration/kind. Existing output is checked early and exclusively reserved at publication; nonempty concurrent content prevents rename replacement. The canonical workspace and containing ancestors are excluded as output destinations. Scratch retention after failures is documented, and success removes only the operation-owned scratch under the stated stationary-ancestor contract.

Documentation and provenance consistently label candidate preparation separately from creative acceptance/provider execution. Package scripts register the new suite and command. No unjustified new parsing/normalization layer or production extraction was found; strict validation belongs at the authored JSON input boundary.

## Skill-perspective check

`remove-ai-slops` and `programming` were not available in the supplied skill catalog or the searched local `/home/athar/.agents/skills` and `/home/athar/.codex/skills` files. Applied the explicit reviewer-prompt criteria instead. The test/production overfit and slop pass ran. No deletion-only tests, requested-removal-only assertions, brittle prompt tests, tautological tests, untyped escape hatches or needless production abstraction were identified. Most tests exercise input boundaries, byte preservation, actual CLI calls and real synthetic media probing. The MEDIUM masked-validation test above violates the test-relevance perspective because it provides false coverage of a distinct behavior. No production-code violation of either perspective was found.

## Declined-to-judge limits

This is approval of the scoped software diff with the nonblocking test finding, not film acceptance. Did not access real .film-workspace media, canonical Movies sources, running services, other worktrees or the original staged research. Did not independently run the parent-owned full root suite, composition browser/lint checks, final render/audio timing checks or live provider operations. Non-unit-rate rendered timing and concurrency stress remain explicitly tracked follow-ups. Did not claim absolute protection against a same-UID actor relocating trusted ancestors between checks, which the contract expressly excludes. Parent must report its own broader verification artifacts and any subsequent code changes separately.
