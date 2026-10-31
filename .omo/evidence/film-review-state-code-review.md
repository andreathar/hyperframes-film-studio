# Local review state code review

- codeQualityStatus: WATCH
- recommendation: APPROVE
- reportPath: .omo/evidence/film-review-state-code-review.md
- Scope: scripts/film-production/review.mjs, review-cli.mjs, review.test.mjs and film-studio/REVIEW-PLAN.md in /mnt/data/Projects_SSD/hyperframes-film-studio.
- Goal: fingerprint/revision-bound candidate review, distinct source namespaces, one-to-one crosswalk, reference roles/hashes, no approval or execution, replayable state and exclusive new output.
- Separate fallback report preserves earlier reviews. ULW runtime was previously unavailable. No notepad supplied.

## CRITICAL

None.

## HIGH

H1 — Missing roles create a successful but unrestorable reference assignment (review.mjs:103–121).

The role check only compares ref.record?.role against action.role. If both are absent, undefined equals undefined, so assignment succeeds and stores role: undefined. The importer accepts references without a role, so this is reachable with an ordinary imported candidate plus an incomplete JSON command. JSON output omits the undefined field. restoreReview replays the action and canonicalizes the resulting undefined role, raising Expected JSON data. This violates the core promise that accepted review operations create replayable state and allows the CLI to publish unusable output successfully.

Independently reproduced with a synthetic candidate containing a verified reference with matching declared/observed SHA-256 and no role, and an assign-reference action with no role. applyReview returned revision 1; JSON serialization omitted role; restoreReview(bundle, JSON.parse(JSON.stringify(next))) threw Expected JSON data.

Required: reject absent/invalid roles explicitly before assignment (e.g. a nonempty string matching a nonempty declared source role). Add missing-role behavior coverage and a successful assignment serialization/restoration check.

## MEDIUM

None.

## LOW

The 10000-history limit is checked only on restoreReview, so an action appended to a 10000-event state can produce a 10001-event state that cannot later be restored (review.mjs:149–160). Deferred boundary concern at this stage; enforce the bound before accepting an additional command if this limit remains a supported operating boundary.

## Evidence and scope

Independently ran node --test scripts/film-production/review.test.mjs: 19 passed, 0 failed, 0 skipped. Reviewed every specified file. Confirmed crosswalk changes invalidate selected plan takes, one-to-one mapping conflicts fail, commands bind project/fingerprint/revision, source acceptance is not promoted, and CLI uses wx with mode 0600. No private actual bundle, other repository, full suite or service accessed. No implementation changes made.

Fingerprint is intentionally mismatch detection, not authenticity or live media freshness; these are explicitly documented scope limits and are not findings.

## Skill perspectives

remove-ai-slops and programming files were unavailable in the earlier catalog/local skills search; applied the supplied reviewer criteria to this change. Tests generally exercise meaningful transitions and filesystem/CLI behavior, not source-string or deletion assertions. Canonicalization supports the requested stable fingerprint and replay check; no needless abstraction or independent slop violation found. H1 is boundary validation missing for a stored role, not a request for broad speculative schema machinery.

## Blockers

- H1: prevent missing-role assignments from producing state that cannot survive JSON serialization and history replay.

## Focused re-review — role blocker resolved; removal operations reviewed

The assign-reference branch now requires nonempty(action.role), in addition to exact equality with the declared role and the original hash checks. This rejects omitted, empty and whitespace roles and prevents undefined from entering accepted assignment state. The new serialization/replay regression verifies a valid assignment remains usable after JSON round trip.

Reviewed clear-reference, clear-take and unlink-shot. They retain command ownership/revision/reason validation, require known source identities, remove only targeted local assignments, and unlink removes the dependent plan-shot candidate. History retains the explicit operations. These behavior tests are not deletion-only tests of removed implementation: they exercise user-facing state transitions and are justified.

CLI invokes shared restoreReview for loaded state and retains exclusive wx output. Independently ran node --test scripts/film-production/review.test.mjs: 24 passed, 0 failed, 0 skipped. No implementation changes or private data access.

At the latest source inspection the 10000-event cap was still restore-only, so the prior LOW boundary issue remains deferred. Parent indicated an additional guard is in progress; no claim of its verification is made here.

Final codeQualityStatus: WATCH.
Final recommendation: APPROVE.
Final blockers: none. Original HIGH finding and blockers above are historical and superseded by this re-review. Supplied skill-perspective criteria find no new violation.
