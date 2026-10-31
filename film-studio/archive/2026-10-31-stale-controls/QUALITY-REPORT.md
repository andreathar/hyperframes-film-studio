# Film Studio — Code Quality and Delivery Management Audit

## Consolidation update — 2026-10-31

The producer requires one GitHub branch, `main`. The coordinator is consolidating existing heads and quality correction `48693f33f`; publication, remote branch cleanup and final integrated checks remain pending verification. Earlier branch/PR inventories are historical captures. [Project controls](../PROJECT-CONTROL.md) and [the state register](PROJECT-STATE.json) record the verified backup and current policy. Recovery/input/descriptor findings, native offline acceptance, assistant/provider qualification and inspector activation remain open; consolidation does not close them.

**Date:** 2026-10-31. **Evidence capture:** approximately 09:20–09:30 UTC. **Accountable audit coordinator:** Codex. **Method:** live GitHub inspection, exact Git-object review, isolated tests and three specialist assessments. **Scope:** this fork's film-production changes and integration management; not a line-by-line certification of the complete upstream framework.

## Executive assessment

**The project is not ready for integration approval or production-readiness claims.** It has useful, meaningfully tested components, but no proved native Studio production cycle, incomplete recovery contracts and insufficiently enforced delivery controls. PR #7 contains valuable shared-package work and should be corrected/reused rather than implemented again. Its current CI is failing.

The fork was created on 2026-10-31 at 04:00:55 UTC; the review backlog is same-day work, not evidence of weeks of neglect. The branch count is primarily inherited clutter, not 1,514 independent development efforts. The more consequential management problem is incomplete reconciliation of remote work, local state, review and CI before making project-wide claims. I made that mistake in the preceding checkpoint review. The correction is an observed state register and an explicit assignment/integration protocol, not another broad feature plan.

No new critical or high-severity code exploit was substantiated in this bounded audit. That does not clear the unreviewed upstream code or make the system production-ready. Several medium-severity boundary/recovery defects and high-priority management failures require action.

## Verified project state

The machine-readable [project register](PROJECT-STATE.json) contains full SHAs, PR metadata, verification and limitations. It is a point-in-time record, not a background monitor.

| Surface                  | Verified observation                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Local checkout           | `docs/film-production-execution`, `658f01cd0`; dirty planning/report documents preserved                                  |
| Default GitHub branch    | `main`, `a04b45a6d`; film increments are not merged into it                                                               |
| Runtime repair           | `3532efca9`, PR #5, clean peer worktree; absent from current checkout                                                     |
| Shared-package candidate | `963d9b424`, PR #7; contains package/contracts and runtime repair ancestry, absent from current checkout                  |
| GitHub branches          | 1,514 in fork; 1,507 names/SHAs identical to upstream, including main; seven project-specific names                       |
| Upstream branches        | 1,508 at capture; one upstream-only name; no assumption that these counts remain fixed                                    |
| Open work                | Seven PRs: six drafts, one non-draft; zero submitted GitHub reviews across these PRs                                      |
| GitHub enforcement       | Main classic protection absent; repository rulesets empty; automatic branch deletion disabled; auto-merge disabled        |
| Board                    | 24 cards inspected; shared contracts was Backlog despite PR #7; reconciled to Building and linked to #7 during this audit |
| Activation               | Read-only probe: app imports jobs.mjs, but jobs.mjs and /api/jobs return 404; no restart performed                        |

All counts concern this fork and this observation time. GitHub authorship does not establish which agent/session currently owns implementation; active Cursor session ownership is unconfirmed.

### PR dependency and review inventory

| PR                                                                 | Increment                                 | Base | Head        | State            | Current GitHub checks |
| ------------------------------------------------------------------ | ----------------------------------------- | ---- | ----------- | ---------------- | --------------------- |
| [#1](https://github.com/andreathar/hyperframes-film-studio/pull/1) | Foundation/import/review/jobs/preparation | main | `8aaabb102` | Draft            | 0 check runs          |
| [#2](https://github.com/andreathar/hyperframes-film-studio/pull/2) | Blocked Kling handoff                     | #1   | `472b5f54c` | Draft            | 0                     |
| [#3](https://github.com/andreathar/hyperframes-film-studio/pull/3) | New-composition placement                 | #2   | `0d89778dc` | Draft            | 0                     |
| [#4](https://github.com/andreathar/hyperframes-film-studio/pull/4) | Inspector job controls                    | #3   | `5ff23acdd` | Draft            | 0                     |
| [#5](https://github.com/andreathar/hyperframes-film-studio/pull/5) | Runtime asset consistency                 | #4   | `3532efca9` | Draft            | 0                     |
| [#6](https://github.com/andreathar/hyperframes-film-studio/pull/6) | Earlier design/execution plan             | #4   | `658f01cd0` | Draft            | 0                     |
| [#7](https://github.com/andreathar/hyperframes-film-studio/pull/7) | Shared contracts/package extraction       | #5   | `963d9b424` | Ready for review | 25 success, 1 failure |

PR #6 and PR #7 are separate descendants; PR #7 contains copies of the earlier design/plan, while the revised plan in this checkout is uncommitted. Reconcile those documents deliberately. Do not overwrite one branch's contracts or docs by treating the other as the latest integrated product.

Seven open PRs describe review/integration inventory, not seven confirmed active workers. PR #1 is 51 changed files; PR #7 is 50 against its own base. The accumulated PR #7 head differs from main in 109 files and 19 commits. Counts include documentation and moved code; they are review-surface measures, not productivity or complexity scores.

## Observed runtime blocker

At 09:28:48 UTC, read-only GETs to the existing inspector on port 9362 returned 200 for the page/app and JSON view, but 404 for both `/jobs.mjs` and `/api/jobs`. The served app explicitly imports `./jobs.mjs`; its module graph is therefore incomplete. The view remains readable at review revision 0. This is an observed operational failure, already addressed in the separate runtime-repair code, not a newly discovered exploit or proof that the repair was activated.

**Priority:** restore a coherent operator runtime after preserving/reconciling current server and browser review state. No restart or activation was performed. Any controlled activation must use the reviewed code, retain the same intended workspace/import, restore review state, and verify actual assets/API/browser startup afterward. Runtime evidence is sanitized in the private audit directory; mutation tokens and review contents are not included.

## Code-quality findings

Severity describes impact under stated conditions. A documented limitation is kept separate from a newly reproduced defect. The review's evidence reports are [domain/boundaries](omo-evidence/film-domain-audit-code-review.md) and [PR #7 contracts](omo-evidence/pr7-shared-contracts-code-review.md).

### Q1 — Medium: rejected publication can leave new state visible

**Evidence:** `scripts/film-production/job-store.mjs:81–103` writes/syncs a temporary file, renames it, then opens/syncs the directory. The earlier synthetic fault probe failed directory-open after rename: the caller rejected, but reread showed revision 0 → 1 with one job. Existing failure regression injects before rename only. This establishes response/state ambiguity, not power-loss durability.

**Impact:** retry after a displayed save error may conflict with or duplicate already-applied work unless identity/recovery is explicit. **Required correction:** durable project-scoped request IDs, recorded outcomes, uncertain-state handling, reread and verified/durable recovery before dependent writes; fault injection before/after replacement and cleanup. Placement also needs a durable operation receipt across composition files and project-state publication. **Owner:** domain specialist; coordinator owns shared result semantics. **Status:** reproduced, unfixed.

### Q2 — Medium: inspector input can block or exceed its advertised bound

**Evidence:** `scripts/film-production/inspector-cli.mjs:25–28` reads the whole file before checking 32 MiB and does not require a regular file. A private FIFO import timed out at 1,500 ms before server creation.

**Impact:** malformed/local input can hang startup; a huge file may exhaust memory before the limit check. **Correction:** nonblocking descriptor open, regular-file validation and bounded streaming; narrow FIFO/oversize/growth regressions. **Owner:** inspector boundary owner. **Status:** reproduced, unfixed.

### Q3 — Medium: preview path checks can become stale before reading

**Evidence:** `scripts/film-production/inspector-server.mjs:158–167` validates a resolved name, then reopens it through stat/readFile. A no-listen request-handler probe replaced that leaf with an outside symlink after resolution and returned HTTP 200 with outside bytes. The expected content hash was deliberately matched and still enforced.

**Impact/limit:** the workspace-confinement and bounded-regular-file invariants can be bypassed by concurrent local file replacement. This is **not demonstrated arbitrary unknown-file disclosure**: the expected hash remains required. **Correction:** pin and validate the opened descriptor, enforce size while reading, hash/send those same bytes; cover leaf/ancestor swaps and nonregular files. **Owner:** inspector boundary owner. **Status:** reproduced, unfixed, also retained by PR #7's legacy move.

### Q4 — Medium: PR #7 path contract is inconsistent

**Evidence at `963d9b424`:** `packages/film-production/src/parse/assistant.ts:19–23` and `parse/records.ts:155–164` reject parent traversal but accept an absolute path such as `/etc/passwd`. Candidate paths use stricter validation. An isolated exact-head parser probe confirmed the discrepancy.

**Impact/limit:** downstream workers could trust a misleading confinement contract. These new fields have no consuming filesystem IO in this PR, so no current access exploit is claimed. **Correction:** choose/document one lexical relative-path contract, enforce it consistently and retain descriptor confinement at IO time. Test absolute, drive/UNC, separator, traversal and valid nested cases according to the selected platform contract. **Owner:** PR #7 implementation owner, session assignment to confirm. **Status:** review changes required before contract freeze.

### Q5 — Medium: new contract tests contain weak assertions and incomplete failure coverage

PR #7's four tests include meaningful dialogue preservation, unknown-field refusal, overlap/selection guards and built-consumer checks. However `contracts.test.ts:103–107` asserts current prompt wording, section title and a static pattern flag; line 185 fixes catalog length. These checks do not prove behavior. The absolute-path mismatch also lacks a targeted regression.

**Correction:** keep semantic tests, remove copy/constant coupling, add table-driven boundary and cross-record identity cases for the public parsers. Do not make a test-count target; require coverage of meaningful contracts and failure classes. **Owner:** PR #7 owner/reviewer. **Status:** source-confirmed test-quality debt; package build and four tests pass, which does not clear the gap.

### Q6 — Low: legacy export metadata and packaging need qualification

PR #7 `package-subpaths.json:23–27` advertises legacy browser compatibility despite Node imports. Its inspector resolves assets outside the published package file list. Local extraction works; standalone installed-inspector use is not proved. Correct metadata through its generator and either include assets or explicitly define the legacy inspector as checkout-only. Do not broaden independent-package promises without a consumer test.

### Existing workflow limitations, not newly introduced defects

- Review is memory-only unless downloaded, while jobs persist.
- Results live in jobs but do not enter the imported selectable-take catalog.
- Whole-import identity does not yet support source/candidate evolution without an explicit migration.
- Duplicate intent protection has no deliberate new-attempt model; unknown outcomes still need reconciliation.
- Placement creates a new composition; existing-edit transactions and a complete native production cycle remain unproved.
- Non-unit playback-rate/trim/independent-audio export parity remains unproved by the fork's own cycle.

These limitations block the intended product experience. They do not justify calling every existing service defective or removing its safeguards.

### Strengths worth preserving

Nine moved legacy files in PR #7 are byte-identical to their predecessors; the tenth changes only its asset-relative path. Original paths re-export one implementation. Unknown-input narrowing, exact dialogue retention, optimistic revisions, replay checks, receipt hashes, descriptor-bound job evidence, no-overwrite preparation and blocked release handoffs are meaningful engineering investments. Current film source passes lint/format. The previously reported masked placement line-ID test is fixed; it is not carried forward as an open finding.

## Management and delivery efficiency findings

### M1 — High priority: project-state reconciliation failed before planning

I inspected one checkout, then described package work as missing without refreshing remote PRs. PR #7 existed elsewhere. The local report disclosed its scope, but the execution map and my summary generalized that evidence. The root cause was a missing mandatory remote/ownership check before task classification. **Consequence:** duplicate work and conflicting contracts were plausible. **Correction now:** register PR #7 as existing/review-required, reuse its extraction and reconcile its interfaces against the revised requirements before assigning implementation.

### M2 — High priority: CI visibility and enforcement are insufficient

The legacy combined-status endpoint returned empty lists even though PR #7 has 26 Check Runs. Empty status must not be called clean or unchecked without checking both systems. The primary CI workflow is active but filters PR base branches to main (`.github/workflows/ci.yml:22–31`), which excludes stacked PRs #2–#7. It does not explain PR #1's missing run; that cause remains unverified. Four workflows are recorded, all for PR #7: regression, preview-regression and Player perf succeed; Comments fails.

The failed [Comments run](https://github.com/andreathar/hyperframes-film-studio/actions/runs/41186545198) reports eight citation problems, including proposed symbols/private evidence paths/external source filenames, plus a comment-ratio failure in the new contracts file. Some citations are planning references, not bad runtime code; the required action is a deliberate policy-compatible correction, not claiming green or disabling the check. Full primary package/typecheck/reachability gates are not established remotely for the stack.

Main is unprotected and rulesets are empty. Consequently this report's gates are not GitHub-enforced. **Correction:** make scoped CI cover the actual development topology; verify checks on exact heads; then configure merge protection with valid observed check names and independent review. Repository settings are unchanged by this audit.

### M3 — Medium priority: quality coverage is narrower than the apparent gate set

PR #7 adds Fallow exclusions for `film-studio/**`, `scripts/film-production/**` and `packages/film-production/src/legacy/**`. Preserving audited algorithms instead of rewriting for a score is reasonable, but these blanket patterns also exclude future work there from complexity/dead-code/duplication analysis. Lint and tests still run; they are different checks. Record the accepted scope and use a bounded/nonexpanding baseline or focused review instead of claiming full Fallow coverage.

### M4 — Medium priority: reviews and completion have not closed consistently

There are zero submitted GitHub reviews, although local independent review reports exist. Some historical fixes were tested by implementers without a second independent recheck, explicitly disclosed in delivery notes. This is missing closure evidence, not proof the fixes are wrong. Backlog checkboxes also mix software delivery with pending workflow acceptance; they cannot measure project completion. Require separate implementation, verification, review, integration, activation and product-acceptance states.

### M5 — Medium priority: branch and evidence hygiene creates avoidable work

The 1,506 redundant upstream branch copies, excluding main, make navigation harder but are not 1,506 project tasks. Preserve upstream access/history while keeping only needed branch names after dependency/protection checks. No branches were deleted. The earlier interrupted workspace run is documented, but its named raw failure logs were not present in the inspected runtime-evidence directory; a controlled base comparison remains outstanding. Keep new evidence locally under one audit directory, and retain command/result/SHA summaries in the register.

### M6 — Medium priority: component delivery outpaced product acceptance

The project accumulated a deep PR stack and multiple plans before proving an integrated user cycle. No reliable elapsed-effort, cost or productivity history exists to quantify waste. Measurable facts are the open PR inventory, missing formal reviews/checks, remote/local drift and unproved acceptance scenarios. Reduce review queue depth and complete the offline cycle before expanding execution adapters.

## Verification performed

| Check                                              | Result                                                    | Limit                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Current checkout `bun run test:scripts`            | 1,012 Node + 109 Vitest = 1,121 passed, no failures/skips | Root script suite, not all workspace packages                                                 |
| Independent domain subset                          | 109 passed                                                | Included in root suite; not additional unique coverage                                        |
| Exact PR #7 package build/test                     | Build/declarations pass; 4 tests pass                     | Temporary Git archive, existing dependencies reused; not fresh frozen whole-workspace install |
| Exact PR #7 legacy film suite                      | 155 passed, no failures/skips                             | Includes repaired asset regressions; not a deployed native UI cycle                           |
| Exact PR #7 package typecheck                      | Pass                                                      | Package only                                                                                  |
| Current contract/subpath/cycle/reachability checks | Pass; zero orphan tests                                   | Cycle checker permits one existing explicit compatibility cycle                               |
| Current film oxlint/oxfmt                          | Pass, zero lint warnings/errors                           | Scoped source formatting/static analysis                                                      |
| Live PR #7 Check Runs                              | 25 success, 1 failure                                     | No primary CI workflow run recorded                                                           |
| Existing inspector GET-only probe                  | Incomplete module/API set: jobs routes 404                | No restart; existing review readable; not a browser acceptance run                            |
| Whole-workspace base/candidate                     | Not established                                           | Prior interrupted run not attributed to root causes                                           |
| Native cycle/browser/decoded rates/live provider   | Not performed/proved here                                 | No generation, activation or creative clearance                                               |

Initial snapshot setup failed because an assumed root tsconfig did not exist; the archive scope was corrected. Initial package command lacked a tsup workspace link; existing package dependencies were linked only inside the ignored snapshot, then build/tests passed. These were audit-environment setup issues, not PR failures. No dependencies were installed and no host PATH changed.

## Corrective strategy and decision gates

| Order | Deliverable                                   | Accountable role / actual assignment                                      | Completion proof                                                                                                                    |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Reconcile PR #7 and contract changes          | Coordinator owns reconciliation; implementation session must be confirmed | No duplicate P1 extraction; path fix, command/result/recovery/version decisions and independent recheck on exact head               |
| 2     | Restore trustworthy integration checks        | Coordinator/CI owner; assignment pending                                  | Main and stacked-target checks execute; failures classified; valid required-check/review enforcement configured separately          |
| 3     | Close scoped reliability issues               | Domain and inspector owners, assigned before work                         | Q1–Q4 regressions and recovery probes pass; original safeguards preserved                                                           |
| 4     | Review/integrate existing increments          | Coordinator with independent reviewer                                     | Dependency-aware merge assessment, checks on resulting integration head, historical fix closures verified; no implicit live restart |
| 5     | Deliver durable native offline cycle          | Domain/API/frontend owners, shared contract first                         | Owned intake → select → edit/undo → decoded render → reopen with source/response-loss/stale-write recovery                          |
| 6     | Add compiler/assistant and one provider route | Specialists after relevant gates                                          | Proposal-only isolation, explicit diffs, exact release/task/result identity; external execution separately evidenced                |

Start with **one implementation/integration lane plus independent review**, not another set of feature workers. Restore the existing maximum of three workers plus coordinator only after contract/ownership reconciliation. Keep P0–P5 as the first product gate; compiler/assistant can proceed independently when contracts permit, and provider execution follows the proven lifecycle.

The [operating contract](../PROJECT-CONTROL.md) defines mandatory checks for the coordinator's ongoing work, evidence states, WIP and handoffs. These controls are documented now; GitHub settings are not silently represented as enforced. The [execution plan](../EXECUTION-PLAN.md) remains the implementation map, corrected to acknowledge PR #7.

## Accountability and limits

I should have checked all remote work before making a project-wide statement, reconciled copied upstream branches at fork setup, and separated test/check/review/integration claims consistently. The concrete correction in this workstream is to refresh the register before assignment, bind evidence to SHAs, close review findings and stop duplicating existing work. This is project documentation and current-session discipline, not a claim of persistent model learning or an unattended monitor.

Audit outputs: report, register, operating contract, corrected planning references and independent evidence reports. Product code, branch refs, GitHub merge settings, running services and provider state remain unchanged. New report/control documents are local and uncommitted. Source/media authenticity, film continuity and creative approval require their own evidence and are outside this audit's clearance.

## Corrective execution and concurrent-work update

The bounded correction is preserved in local commit `48693f33f303c39cadf5950d622d2066293a26f4`, based on PR7 revision `963d9b424`. It hardens relative paths, replaces weak contract assertions, corrects legacy metadata and FFprobe arguments, repairs CI routing/current-base selection, removes blanket film exclusions, and centralizes reviewed inherited-debt baselines for CI and the normal local hook. Independent reviews approved the fixes. No hook was bypassed. The first failed commit exposed a hook/CI mismatch, which was corrected and independently reviewed before retry.

Verification: full build passed; film package82 and services155 passed; root scripts1130 passed; affected full engine2671 passed/four skips and producer1123 Vitest plus Bun suites passed/one Vitest skip. The initial broad run completed with eight failures and remains retained; later affected-package runs are distinct evidence. Normal commit hooks and committed Comments, comment ratio and scoped Fallow checks passed. Three existing Comments warnings and bounded legacy debt remain. This is not a full-system readiness certificate.

During final checks, the shared PR7 branch advanced through eight additional commits to last-observed `5769a890a887d939519dead1a5f4bfbdcce57f36`:56files,5437insertions,3deletions beyond the correction base. These are concurrent assistant, Studio and compiler additions. They were not silently folded into previously green evidence. Session ownership is unknown and the branch remains active. The tested local correction has not been pushed, merged or activated.

Three specialized source reviews found integration blockers: [CLI assistant](omo-evidence/concurrent-cli-review.md), [Studio components](omo-evidence/concurrent-studio-review.md), [scene/native compiler](omo-evidence/concurrent-compiler-review.md). CLI/Studio were pinned to `f55fb732b`, whose files are unchanged by the subsequent compiler commits; compiler review was pinned to `5769a890a`. The Studio reviewer additionally ran isolated exact-source helper probes. No full test/build/browser/provider qualification of the new shared revision is claimed.

Priority blockers are an unsatisfiable assistant output schema, unusable public streaming/cancel lifecycle, post-execution isolation qualification, stale-context proposal application, native controls that can display unapplied values, destructive per-keystroke continuity normalization, duplicate native-argument acceptance and loss of frame-rate semantics. The dock is explicitly disconnected; it is a partial shell, not a completed production workflow. Original durable publication and inspector-input/descriptor findings also remain open.

Management response: preserve the reviewed correction, reconcile the active shared head/owner, fix acceptance blockers before widening feature work, and validate the combined result at one exact revision. No additional remote branch was created. No branch deletion, repository settings change, shared push, merge, service restart, provider call or model execution was performed. The project is under an explicit observed-state/review process; GitHub enforcement, concurrent ownership and production acceptance remain incomplete.
