# Film Studio implementation checkpoint — 2026-10-31

## Consolidation update — 2026-10-31

The producer requires one GitHub branch, `main`. The coordinator is consolidating existing heads and quality correction `48693f33f`; publication, remote branch cleanup and final integrated checks remain pending verification. Earlier branch/PR inventories are historical captures. [Project controls](../PROJECT-CONTROL.md) and [the state register](PROJECT-STATE.json) record the verified backup and current policy. Recovery/input/descriptor findings, native offline acceptance, assistant/provider qualification and inspector activation remain open; consolidation does not close them.

Scope correction: this was a local-checkout checkpoint, not a complete remote project audit. Later [quality review](QUALITY-REPORT.md) confirms PR #7 already implements shared package/contracts. Use [PROJECT-STATE.json](PROJECT-STATE.json) for the reconciled observation and review/reuse that PR rather than repeating P1. Historical local findings below retain their original scope.

This review answers where implementation stopped and informs the revised [execution plan](../EXECUTION-PLAN.md). It combines independent read-only assessments of architecture/domain, UX/workflow, and reliability/code quality. The coordinator verified the checkout, prior planning/Inbox checkpoint, repair commit and targeted tests. Proposed paths in the plan are not implemented files.

## Exact starting point

Repository `/mnt/data/Projects_SSD/hyperframes-film-studio`; origin `andreathar/hyperframes-film-studio`, upstream `heygen-com/hyperframes`. Integration HEAD `658f01cd0`, branch `docs/film-production-execution`. Its last commit documents the delegated plan; latest integrated functional work is inspector job controls (`afc2fce0a`, included through `5ff23acdd`). Pre-existing untracked `film-studio/WORKFLOW.mmd` was preserved.

The separately committed runtime repair is `3532efca9`, branch `feat/film-runtime-consistency`, clean peer worktree `/mnt/data/Projects_SSD/hyperframes-film-kling-handoff`. It changes exactly the inspector server, tests and guide and is absent from integration HEAD. The old plan's unchecked commit step was stale; do not implement that repair again. No running inspector was restarted or its current state inspected in this pass; no present live-health claim is made.

Prior Inbox thread `msg_01M6848D8DSC5G382PDDC4F3QM` recorded the earlier design review still open. Historical PR/publication claims there were not refreshed against GitHub in this local review.

## Implemented versus missing

| Implemented in integration checkout                          | Remaining integration                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Local preparation and editable/renderable composition output | Proved new-candidate lifecycle through native Studio             |
| Source import, explicit mappings/reference review            | Unified project/review/draft persistence and source continuity   |
| Durable prepared jobs and reported result observations       | Additive candidate catalog, attempts, result-to-selection bridge |
| Blocked Kling handoff and new-composition placement          | Qualified release/results and existing-edit transaction          |
| Companion inspector and job/receipt controls                 | Shared package, film API, native Production/Assistant panels     |
| Studio selection/dock/editor/clipboard seams                 | Scene compiler and qualified proposal-only assistant host        |

Package/route/panel inspection confirms no `packages/film-production`; no film/assistant capability in `packages/studio-server/src/types.ts` or route registration in `createStudioApi.ts`; no Production/Assistant in `packages/studio/src/components/dock/panelRegistry.ts`. `useAskAgentModal.ts` copies context and does not implement connected conversation/application.

## Findings and implications

1. **Results do not close the editing loop.** `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:186` retains outputs inside jobs; `review.mjs:149` and `placement.mjs:64` use imported `bundle.takes`. Add explicit registration/catalog identity rather than mutating immutable imports or duplicating selection rules in UI.
2. **Review and jobs have different lifetimes.** `inspector-server.mjs:28` keeps review in memory. `film-studio/inspector/app.mjs:81` requires a download while jobs autosave. Native integration needs one truthful persistence model and recoverable per-shot drafts.
3. **Whole-import identity blocks additive continuity.** `review.mjs:54` and job restoration bind history to immutable source identity. Separate historical snapshots, source and catalog revisions; selectively reconcile current decisions without rewriting captured jobs.
4. **A rejected write can be visible.** `job-store.mjs:92–95` renames state before opening/syncing the directory. Existing fault test (`job-store.test.mjs:341`) injects a pre-rename error only. A fresh synthetic directory-open failure after rename rejected the call, but reread showed revision 0 → 1 and one job. This proves response/state ambiguity, not crash durability. Add request identity, uncertain outcomes and recovery/fault tests.
5. **Deduplication needs attempts and documented scope.** `jobs.mjs:108–116` rejects repeated intent; terminal state cannot simply retry. Current request fingerprint omits shot identity. Preserve unknown-outcome protection while introducing explicit attempts and scoped identity, without rewriting historical hashes.
6. **Runtime repair is unintegrated.** Current `inspector-server.mjs:111–115` reads assets per request; peer commit fixes this with a complete fixed snapshot. Integration and activation need separate evidence.
7. **Workflow exposes storage/transport details.** Companion forms require IDs, free-text model intent and receipt paths (`film-studio/inspector/jobs.mjs:138` onward). Details have no separate draft model (`app.mjs:184`); global busy state disables all controls (`app.mjs:60`); all references render per shot (`app.mjs:245`). These are static findings; exact focus/draft behavior needs browser reproduction. Prefer readable labels, scoped pending state, filters and field-linked diagnostics.
8. **Component checks do not prove export parity or whole-workspace health.** Rates 0.1–10 are accepted (`manifest.mjs:118`), but fork-specific non-unit-rate master parity is unproved. Earlier broad run exited 130 without controlled base comparison. Add decoded-media and reproducible base/candidate gates.

Retain existing serialized mutations, optimistic revisions, replay validation, descriptor-confined byte checks, non-stealing locks, blocked handoffs and refusal to overwrite assemblies. Broad rewriting would risk these protections without closing the workflow sooner.

## Fresh verification

| Check                                                          | Result                                      | Practical limit                                                                          |
| -------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Integration `bun run film:test`, `658f01cd0`                   | 153 passed, 0 failed/skipped                | Component/service suite, not native production acceptance                                |
| Peer `bun run film:test`, `3532efca9`                          | 155 passed, 0 failed/skipped                | Repair branch, not integrated/deployed                                                   |
| Specialist `node --test scripts/film-production/jobs.test.mjs` | 25 passed, 0 failed/skipped                 | Pure subset included in full film suite                                                  |
| Synthetic post-rename directory-open fault                     | Rejected call; readback revision 1, one job | Not crash/power-loss proof; temporary fixture removed                                    |
| Checkout/worktree/commit/panel/API inspection                  | Boundaries above confirmed                  | No browser, provider/account, price, current film-source or live-inspector qualification |

No product code, dependencies, canonical sources, processes or provider state changed. Deliverables are planning/review documents. Private film data and concurrent diagram were preserved.

## Recommended change

Keep native Studio and one shared domain. Separate optional assistant/provider capability from FilmPort. First gate: owned intake → explicit selection → placement/edit/undo → decoded render → reopen. Compiler/assistant develop behind stable contracts without making offline production depend on host qualification. Finish one external route before expanding execution; retain all requested modules and separate evidence gates.

The [revised plan](../EXECUTION-PLAN.md) defines exact ownership, dependency waves, failure cases and six concrete smart features. This file is evidence, not a second checklist.

Independent final architecture review identified one additional planning gap: placement spans editor files and project-state publication. The revised P1/P5 now require a durable placement intent/receipt, shared request/operation identity and interruption tests around both writes, with explicit uncertainty instead of duplicate insertion. It also corrected the design's film inventory to identify it as a prior audit rather than a current requalification.
