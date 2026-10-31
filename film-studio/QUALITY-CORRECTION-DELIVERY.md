# Shared film contract and validation corrections

Base: PR #7 at `963d9b424c1d0612a584e55db46adc2cae3fbbf9`. This increment reuses its package extraction. It adds no provider, assistant host, project store or native panel.

## Behavior corrected

- Assistant composition paths, receipt evidence paths and candidate media paths use one browser-safe lexical validator. Valid relative strings remain unchanged; nullable fields retain null; absolute, drive/UNC, traversal, ambiguous-segment, colon, backslash and NUL inputs fail. Runtime descriptor confinement remains a separate IO responsibility.
- Contract tests exercise public parsers and built Node/browser entrypoints. Prompt wording/catalog constant checks are removed; temporary consumers are cleaned up.
- Legacy metadata identifies Bun/Node support. The package guide states the inspector's checkout-root asset dependency.
- Film preparation terminates FFprobe options immediately before the input, satisfying the existing argument contract.

## Validation routing and debt visibility

Primary CI includes the bounded film stack's target branches. Push-to-main and merge-group behavior remain unchanged. Fallow resolves the checked-out merge commit's first parent, rather than trusting an event payload that can be stale.

Baseline-only, companion-only and Fallow-config-only changes now trigger the audit; routing regressions execute the parsed workflow selectors. The blanket film exclusions are removed. Explicit [legacy baselines](quality/README.md) retain the reviewed extraction debt: 14 complexity findings across 11 known legacy service/companion files and six film legacy duplicate groups. The additional companion functions and browser-verification groups exposed by the local full-fork comparison are byte-identical to PR7. These are not fixed by this increment. New analysis inputs stay visible. CI and the local hook load baseline paths from the same native Fallow configuration and enforce baseline growth. CI compares against the verified current PR base; the local hook retains the stricter `origin/main` full-fork comparison. The dynamically served stylesheet is an explicit manual entry supported by the server's fixed asset allowlist.

The failing Comments citations and comment-ratio violation are corrected without disabling the rules. Three pre-existing warnings about generated output filenames remain non-failing.

## Workspace verification and fixture corrections

A frozen install and full workspace build completed before tests. The initial sequential workspace run completed with eight failures, retained as evidence rather than interrupted or called green:

- Four HDR failures came from an unhydrated Git LFS pointer. The expected 3026-byte fixture was restored from the existing content-addressed cache and verified by SHA-256. No source fixture was regenerated or downloaded; all 122 FFprobe tests then passed.
- Two single-probe WSL timeout tests inherited the host's Wayland variable and selected a second production probe. They reproduced on the unchanged base. Explicit environment isolation preserves the intended one-probe scenario, existing assertions and environment restoration. All 117 browser-manager tests passed afterward; no production timeout changed.
- One producer argument-contract failure exposed the film FFprobe call above. The focused contract went RED to GREEN, and the full producer script subsequently passed.
- One audio URL test reported success during the broad run but passed in isolation on base and candidate. A recorded diagnostic confirmed real truncation is rejected when triggered, without establishing the historical broad-run cause. The fixture now caps initial responses for cut-enabled reads and asserts actual truncation before evaluating the unchanged failure classification. All five URL cases passed; no engine production behavior or skip changed.

## Verification record

| Command / check                            | Result and scope                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Full workspace build                       | Passed; existing optional-skill, browser-module and bundle-size warnings retained                                   |
| Film package build/test/typecheck          | 82 passing tests and strict typecheck; built browser/Node consumer behavior exercised                               |
| Film service suite                         | 155 passed, zero failures/skips; real media preparation and descriptor regressions                                  |
| Root script runner                         | 1,021 Node + 109 Vitest tests passed, zero failures/skips                                                           |
| Producer full script after argument fix    | Passed: 1,123 Vitest cases plus its Bun sub-suites; one Vitest skip retained                                        |
| Browser manager and FFprobe affected files | 117 and 122 passed respectively                                                                                     |
| Full engine after fixture corrections      | Passed: 2,671 tests, four existing skips; final helper cleanup separately rechecked in all five URL tests           |
| Workflow routing / scoped audit            | Routing regressions pass; Fallow passes against explicit legacy budgets, not a debt-free claim                      |
| Comments / comment ratio                   | Corrected scope passes with three existing warnings; final commit checks are retained with the integration evidence |
| GitHub hosted checks                       | Not run for this local correction; published PR #7 remains a distinct revision                                      |

CLI, core, Studio, Studio server and other workspace packages passed in the completed initial run, with their existing skips/todos. Only failed or subsequently affected gates were rerun after correction; the original failing run remains part of the record.

## Review and boundaries

Independent review approved the contract correction and CI changes. Review found and closed stale-base selection and a baseline-only trigger bypass before finalization. The one-line FFprobe correction and the two test-fixture corrections each received a focused independent approval.

This is a software correction, not creative acceptance or live capability qualification. No shared-branch push, PR merge, repository protection change, branch deletion, inspector restart, paid request or model execution is performed by committing it. The original planning checkout and concurrent diagram remain preserved. Publication and any controlled activation are separate actions.
