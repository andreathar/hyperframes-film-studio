# Film Studio project operating contract

Effective for the coordinator's workstream from 2026-10-31. This documents the operating discipline adopted after the state/branch audit; GitHub enforcement remains separately recorded. The producer subsequently authorized consolidation to a single GitHub branch, `main`. That explicit instruction controls the consolidation; this document does not separately authorize runtime activation or provider execution.

## Authority and surfaces

- [PROJECT-STATE.json](PROJECT-STATE.json): observed state, exact source revisions, PRs, checks, limitations and next gates. A snapshot expires when related remote heads, local changes or runtime state change.
- Plannotator Board: scheduling/visibility. A card is not implementation or test proof.
- [EXECUTION-PLAN.md](EXECUTION-PLAN.md): requirements, dependencies, ownership boundaries and acceptance criteria. A plan is not observed implementation.
- [QUALITY-REPORT.md](QUALITY-REPORT.md): dated findings, evidence, decisions and corrective strategy. Historical delivery reports retain their original scope.
- Canonical film records, producer release and creative acceptance retain their existing authority. Registration, passing software tests and project management do not replace them.

## Before any implementation assignment

1. Verify canonical checkout/remotes, current worktrees, dirty/untracked state and concurrent work ownership.
2. Refresh live project PR list, head/base SHAs, changed scope, both legacy Statuses and Check Runs, workflow results and reviews. Compare against local refs; do not assume fetched refs are current.
3. Read existing implementation and open findings for the same capability. Mark it absent-in-checkout, implemented-remotely, reviewed, integrated or deployed precisely. Never recreate a module because it is absent locally.
4. Assign one actual worker/session and one independent reviewer to a bounded scope. Record owned files, dependency/contract SHA, acceptance cases and prohibited overlaps. GitHub author is not session ownership.
5. Check plan/Board/register agree. Reconcile contradictions before branching or broadening scope. If the owner is unknown, record unknown and resolve ownership before assigning overlapping work.

## Work in progress and integration

Until PR #7/contracts/CI are reconciled, one implementation/integration lane plus an independent review lane. No new broad provider or assistant feature lane. After the gate, at most three workers plus coordinator, with stable shared contracts and disjoint files.

The coordinator alone integrates shared manifests, exports, API/dock/editor wiring and contract changes. Workers request seam changes. Existing PRs are reviewed/integrated by dependency; avoid making another dependent branch merely to preserve an unreviewed chain. Choose history-preserving merge/restack method after checking dependencies; preserve all unique work through the explicitly authorized single-main consolidation and its verified backup.

Review findings return to their implementation owner. The reviewer rechecks the original failing case on the fix SHA; the implementer's passing test is attributed as such. After integration, run the affected gate on the resulting head. A GitHub mergeable flag means conflict status, not correctness or approval.

## State and evidence

Track these independently: implementation location, verification, review disposition, integration, running deployment, user-workflow acceptance and external capability qualification. No binary checkbox or component-count percentage represents overall project completion.

Every verification claim includes command, exact source SHA, setup/scope, exit/result, skip/interruption and artifact location. Mock, authenticated and live results are separate. Unknown/absent/incomplete never becomes pass. Repeated tests require a changed input, failure, integration or unresolved concern; do not repeat broad suites for document-only changes.

For response-loss and publication ambiguity, reconcile the same request before retrying. Future file/project placement implementation must use durable intent/receipts across both boundaries; uncertain outcome must block duplicate application. These product protections remain pending implementation, as recorded in Q1 and the execution plan. No auto-selection, release, submission or model loading follows from an assistant proposal.

## Branch and CI hygiene

The producer requires exactly one GitHub branch, `main`. Consolidate existing project work without losing unique commits or dirty files, then verify the resulting published main head and branch inventory. Local worktrees may isolate implementation without creating additional published project branches. The coordinator verified a backup of 1,514 heads and dirty files at `/mnt/data/Projects_SSD/.project-backups/hyperframes-film-studio/20261031T101523Z`. Publication and branch cleanup are pending the coordinator's actual remote verification. Preserve upstream history and recoverability; do not infer successful cleanup from this policy.

Required checks must match the development topology. Inspect Check Runs as well as Statuses; explain skipped/missing workflows. Configure protection only with tested check names and review policy. Scope quality exclusions explicitly; an ignored path is not statically audited merely because lint/tests pass.

## Refresh and handoff

Refresh register at assignment, handoff, PR head/base change, review result, CI completion, integration and activation. At each handoff record actual owner, base/head, owned diff, results, open findings, next action and required proof. Update existing Board cards; do not create another roadmap for the same work.

For user reports, state outcome first, identify material failures and limits, and link evidence. Distinguish local uncommitted work from published GitHub state. Do not claim continuous monitoring, full-system clearance or durable memory beyond what is actually configured and verified.
