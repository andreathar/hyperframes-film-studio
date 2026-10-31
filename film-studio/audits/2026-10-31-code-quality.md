# Film Studio: code quality, waste and removal audit

**Date:** 2026-10-31  
**Audited implementation:** `docs/film-production-execution`, HEAD `658f01cd0b359d4a3998e019aa06dbccdb7c32e2`  
**Mode:** read-only investigation; this report and its candidate appendix are the only authored changes. Existing dirty planning/control files were not modified. Four independent read-only investigations covered architecture, backend, inspector and quality gates.

**Companion:** [complete static-analysis candidate inventory](2026-10-31-static-analysis-candidates.md).

## Verdict

**The project has real engineering waste and insufficiently reliable review gates. It is not proven to be full of dead runtime code.** The highest-value deletions are redundant work and repeated data—not indiscriminate deletion of upstream packages.

The current product is a **local, provenance-preserving film preparation layer on Hyperframes**:

`existing film records → import → explicit candidate review → job intent / external receipts → selected-take placement → editable HTML → upstream edit/render tools`

The intended application goes further: one durable native-Studio cycle that can edit, render and reopen a film. Live generation, assistants, approval management and native integrated panels are not delivered by this checkout. A blocked Kling handoff is not a working generation provider. See `film-studio/README.md:5–23`, `film-studio/PRODUCTION-DESIGN.md:9–11` and `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/kling-handoff.mjs:221–223`.

Against the upstream merge-base, committed fork changes are **75 files, +9,088/−2 lines**: 21 runtime files / 3,636 added lines; 12 test/fixture/browser-probe files / 3,230 lines; 42 documentation/configuration files / 2,222 lines. No existing `packages/` implementation is changed at this HEAD. The large upstream framework and the small film application must not be judged as the same scope.

### What verification actually showed

| Check performed in this audit                         | Result                                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Full `bun run build`                                  | Passed                                                                                             |
| `bun run film:test` after build                       | **153 passed, 0 failed, 0 skipped**                                                                |
| Knip, installed local binary, JSON reporter, no fixes | Exit 1: candidate findings; not a safe deletion list                                               |
| Synthetic review replay, three runs per size          | Median **8.86 ms / 167.39 ms / 650.65 ms** for **100 / 500 / 1,000 events**                        |
| Explicit GitHub query of the fork's seven open PRs    | #1–#6: no check rollups; #7: 26 checks, including failed Comments; no primary CI checks identified |
| Browser behavior investigation                        | Happy DOM reproductions; real Chrome probes inspected, **not run**                                 |

The replay benchmark used repeated valid `unlink-shot` events against one synthetic shot. It isolates history overhead, not real project latency. A 10× history increase took about **73×** as long. No whole-application performance improvement percentage is claimed.

Full workspace tests, decoded render/reopen acceptance, real-provider calls and browser playback were **not** executed. Passing these 153 tests does not prove the integrated product works.

## The 10 smart improvements

### 1. Make CI and review enforce reality, not the appearance of it

**Priority: P1 · confidence: high · effort: medium**

- `.github/workflows/ci.yml:22–31` only targets PRs whose base is `main`. Six of the seven film PRs target other film branches. This structurally excludes those PRs from primary CI; it does **not** explain why main-targeted #1 also has no checks.
- `.github/workflows/ci.yml:140–149` omits `film-studio/**` from the code filter. The support test job depends on that filter at `.github/workflows/ci.yml:596–613`. An inspector-only UI change can therefore avoid its behavioral tests.
- `package.json:46–47` makes default `test` workspace-only. The nine film suites are repeated in separate lists at `package.json:57` and `package.json:69`.
- The browser probes at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-browser.mjs:64–150` and `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-jobs-browser.mjs:32–175` are not registered automated gates. Test reachability only recognizes test filename suffixes at `scripts/check-test-reachability.mjs:9`.

**Remove:** duplicated suite enumeration and the assumption that “green somewhere” equals an accepted film stack.

**Do instead:** cover supported stack bases, add inspector change paths and test guards, create one aggregate film verification command, automate the browser probes with actual media, and require observed build/test/browser results plus independent review at integration. Configure required checks only after proving those checks run on this fork.

**Acceptance:** an inspector-only intentional failure makes a stacked PR red; default documented verification runs film tests; a broken preview or reopen cycle cannot pass the integration gate. Diagnose #1's missing runs separately. Local review markdown is not a formal GitHub approval.

### 2. Replace divergent file readers with one bounded, descriptor-verified I/O boundary

**Priority: P1 for mutable/untrusted input workspaces · confidence: high · effort: medium**

`import-movies.mjs` checks a resolved pathname and subsequently reopens it: `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/import-movies.mjs:34–40`, `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/import-movies.mjs:76`, `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/import-movies.mjs:19`. Concurrent file/ancestor replacement can invalidate the checked confinement; a FIFO replacement can hang a read. This is a local mutable-filesystem threat, not evidence of remote exploitation.

The review and inspector JSON loaders allocate the whole file before checking 32 MiB: `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/review-cli.mjs:20–23`, `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-cli.mjs:25–28`. The preview route also separates pathname checks from reads at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-server.mjs:158–168`.

**Remove:** repeated unsafe path-check/read patterns and post-allocation size checks.

**Do instead:** open once, verify regular-file type and confinement on the opened descriptor, enforce initial and running size limits, and read/hash that descriptor. Reuse the pattern at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/job-store.mjs:25–61`, documenting its Linux-specific `/proc/self/fd` assumption. Do not weaken hashing or traversal defenses for speed.

**Acceptance:** oversized/growing files, symlink/ancestor swaps, FIFOs and changed media fail safely without unbounded allocation, indefinite blocking or outside-root reads.

### 3. Make placement failure cleanup ownership-safe

**Priority: P1 reliability/storage · confidence: high · effort: small–medium**

Placement allocates `.film-placement-*` staging at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/placement.mjs:199–201`; copying and preparation can throw at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/placement.mjs:208` and `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/placement.mjs:217`. Staging removal occurs only on success at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/placement.mjs:229`; the `finally` block only closes a handle at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/placement.mjs:237–238`.

**Remove:** orphaned private scratch copies after failed attempts—not original media or arbitrary matching directories. A failure between output reservation and publication can also strand an empty output directory.

**Do instead:** track operation-owned scratch and reservation identities, clean those on failure, and preserve successfully published output. If failure artifacts are deliberately retained, report their exact location and a retention policy.

**Acceptance:** inject copy, hash, probe, rename and destination-race failures; no unreported scratch accumulation, no unrelated deletion, and safe retry into an unclaimed destination.

### 4. Stop cloning growing histories during every replay

**Priority: P2 performance · confidence: high, measured · effort: medium**

Every review reduction clones the growing state at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/review.mjs:81`; restoration repeats it for every event at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/review.mjs:176`. Jobs repeat this at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:72` and `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:202`. Persistent updates restore at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/job-store.mjs:138`, then restore again through `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:209`.

**Remove:** copying every historical prefix and redundant validation within one trusted operation—not validation at public boundaries.

**Do instead:** replay into a privately owned accumulator, append events without recloning history, and apply an internal validated-state transition after boundary validation. Preserve deterministic replay, revisions and tamper detection.

**Acceptance:** benchmark 100/500/1,000/5,000 events; near-linear replay scaling, identical states/fingerprints and all hostile-state tests still passing. Use per-operation lookup maps where repeated `.find()` scans are material.

### 5. Store immutable review provenance once, not twice per job

**Priority: P2 data size/performance · confidence: high · effort: medium**

A full review snapshot is stored on the job at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:121`. Its preparation command, containing that review again, is retained in history at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:194`. Replay revalidates each preparation review at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:86`. The ledger rejects serialized states above 32 MiB at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/job-store.mjs:82–83`.

**Remove:** repeated identical snapshots and repeated historical validation, not source evidence.

**Do instead:** keep immutable, content-addressed snapshots once; jobs/events reference snapshot identity. Version and migrate the persisted schema explicitly. Preserve reconstructability and captured references.

**Acceptance:** many jobs prepared from one review store one snapshot; old ledgers migrate without provenance loss; serialization size and replay time are measured on realistic histories.

### 6. Serve verified previews without full-file buffering on every request

**Priority: P2 memory/responsiveness · confidence: high code-path evidence; throughput unmeasured · effort: medium**

`658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-server.mjs:163–172` accepts up to 128 MiB, reads the entire file, synchronously hashes it, then sends HTTP 200. There is no byte-range handling. Native video controls are enabled at `film-studio/inspector/app.mjs:171–172`.

**Remove:** per-request whole-file buffers and redundant rehashing of an unchanged verified snapshot. Concurrent previews can multiply memory usage; larger legitimate takes are rejected outright.

**Do instead:** verify an immutable snapshot before exposure; stream with backpressure and proper `206`/`416` range responses. Cache only with a sound immutability/invalidation model. Simply streaming unchecked source bytes would sacrifice integrity.

**Acceptance:** real Chrome playback/seeking against representative large files, bounded concurrent-request memory, changed-source rejection, and valid/invalid range tests. Current probes omit the preview workspace (`658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-browser.mjs:56`; `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-jobs-browser.mjs:19–24`) and cannot prove playback.

### 7. Preserve drafts and focus instead of rebuilding away user work

**Priority: P2 usability/correctness · confidence: high for DOM behavior · effort: small–medium**

The stale-session message says reload and retry at `film-studio/inspector/app.mjs:118–122`, but reload triggers a render at `film-studio/inspector/app.mjs:413` that removes detail forms at `film-studio/inspector/app.mjs:186`. A Happy DOM reproduction preserved the prompt after rejection, then lost it after reload. Selecting a shot also replaces the focused button through `film-studio/inspector/app.mjs:357–364`; DOM focus falls to the body in that reproduction.

**Remove:** unnecessary destructive full-list/form rebuilding and repeated operator entry.

**Do instead:** retain drafts by shot/job, clear only successfully submitted fields, update selection in place or restore focus explicitly. The stale test at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/inspector-jobs-browser.mjs:84–93` checks before reload, not after it.

**Acceptance:** type → provoke stale revision → reload → retry retains the draft; selection and keyboard focus remain coherent in actual Chrome, not just Happy DOM.

### 8. Integrate existing domain work before adding another architecture

**Priority: P2 maintainability/delivery · confidence: high · effort: medium–large**

Remote PR #7 at `963d9b424c1d0612a584e55db46adc2cae3fbbf9` already extracts `@hyperframes/film-production` and uses compatibility re-exports; it is absent from this checkout. Branch-qualified evidence: `packages/film-production/package.json:19–39` and `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/review.mjs:1` **at that commit**. Runtime repair `3532efca9` likewise requires integration review. These are existing work, not proof they are accepted or activated.

**Remove/avoid:** a second independently implemented domain reducer, third persistence format, or parallel replacement timeline. Keep the companion inspector transitional rather than an indefinite second product UI.

**Do instead:** reconcile the existing stack, review the extracted contracts and runtime repair, then prove one owned-media native edit → undo/redo → decoded render → reopen cycle. Add a measured local build profile for this dependency closure; root `package.json:14` currently also builds cloud adapters and SDK playground. Keep full upstream build compatibility rather than deleting optional packages blindly.

**Acceptance:** one authoritative domain implementation, working compatibility shims, one durable accepted cycle, and a local build/test profile whose dependency completeness is tested. No new assistant/provider host before the owned-media gate is trustworthy.

### 9. Turn the dead-code scanner into a reviewed removal queue

**Priority: P2 hygiene · confidence: mixed by item · effort: incremental**

Knip reported **268 files, 157 exports, 236 types, 9 dependencies, 30 devDependencies, 80 unlisted uses, 6 duplicate-export findings, 3 unresolved imports and 1 binary finding**. These categories are different problems, not 790+ proven dead objects. The candidate appendix lists paths and dependencies.

`.fallowrc.jsonc:72` declares every script an entrypoint; this can hide orphan scripts. CI Fallow is changed-file/new-only (`.github/workflows/ci.yml:435–447`, `.github/workflows/ci.yml:482–484`); Knip is manual (`package.json:56`). Neither proves the whole baseline is clean.

**Remove first, after a small validation PR:** the apparently unreferenced internal `packages/studio/src/player/components/TimelineDropInsertionLine.tsx:6` (no code consumer found in the repository search), redundant root `@hyperframes/player` devDependency (`package.json:83`), and unused inspector `--danger` / `--gap` declarations (`film-studio/inspector/style.css:11`, `film-studio/inspector/style.css:13`). Keep `--radius`: it has three consumers. These tiny removals improve hygiene, not meaningful runtime speed.

**Do instead:** model actual CLI/browser/build/export entrypoints; baseline confirmed exceptions with reasons; review small groups of findings and enforce no new unexplained ones. Public APIs, dynamic workers, registry payloads and asset-packaging dependencies need consumer/packaging evidence before removal. For example, Knip flags Lambda FFmpeg dependencies that are actually resolved and staged at `packages/aws-lambda/scripts/build-zip.ts:409–423`.

**Acceptance:** every removed runtime file/dependency has a call-site and packaging check plus relevant tests; browser probes are automated, not deleted as “unused.” No blanket `knip --fix --allow-remove-files`.

### 10. Consolidate planning/status documents without destroying decisions

**Priority: P3 navigation/maintenance · confidence: high · effort: small–medium**

There are overlapping plan/delivery descriptions, e.g. `film-studio/IMPORT-PLAN.md:5–11` and `film-studio/IMPORT-DELIVERY.md:3–11`. Operational instructions repeat across `film-studio/README.md` and `docs/guides/film-production.mdx:14–88`. README, TASKS, checkpoint and reports repeat branch/integration state. Current control already identifies distinct observed-state and contract surfaces at `film-studio/PROJECT-CONTROL.md:7–10`.

**Remove from active navigation:** superseded milestone plans and duplicate status prose. Archive unique rationale and acceptance evidence instead of deleting it. Do not create yet another competing project-status register from this audit.

**Do instead:** one concise entrypoint, one observed-state register with commit/check timestamps, canonical runtime contracts, and a clearly dated archive. Generate repeated status summaries where practical. Keep user docs accessible; link shared contracts rather than duplicating specifications.

**Acceptance:** each operational fact has one source of truth; current vs proposed vs accepted behavior is unmistakable; archived decisions remain discoverable.

## Keep / remove / consolidate / defer inventory

| Area                                                                            | Disposition                       | Reason                                                                                                                       |
| ------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Seven film CLI entrypoints and backend exported functions                       | **Keep**                          | Traced callers; no backend export established as dead.                                                                       |
| Core/parsers/lint/engine/producer/CLI and Studio/player/studio-server           | **Keep**                          | Composition, editing, validation and rendering dependency chain.                                                             |
| Hash checks, provenance, revision checks, output exclusivity, generation blocks | **Keep**                          | Safety/correctness contracts, not dispensable overhead.                                                                      |
| Browser probes and regression fixtures                                          | **Wire into checks**              | Dormant useful tests are not dead application code.                                                                          |
| Replayed historical prefixes, duplicate snapshots, divergent JSON readers       | **Consolidate/remove redundancy** | Concrete avoidable CPU, data and maintenance costs.                                                                          |
| Placement scratch left by failed operations                                     | **Clean under ownership rules**   | Reproducible private copies can accumulate; originals cannot be discarded.                                                   |
| Internal insertion-line component, root player dependency, two CSS tokens       | **Small removal candidates**      | Strong static evidence; validate in isolated PR, no speculative performance claims.                                          |
| Other Knip results                                                              | **Investigate**                   | See candidate appendix; many files are dynamically executed or shipped assets.                                               |
| Cloud adapters, SDK playground, galleries and live-generation features          | **Optional for first milestone**  | Exclude from local product/build activation where dependency analysis permits; not proven safe to delete from the framework. |
| Completed plans and repeated current-state summaries                            | **Archive/consolidate**           | Reduce navigation and stale facts; preserve unique rationale.                                                                |
| Upstream-identical branch references                                            | **Separate housekeeping**         | Earlier live comparison found 1,507 identical shared tips, not application dead code. Reverify before any pruning.           |
| `.film-workspace/`, original media, reviews, receipts, hand-edited compositions | **Never blanket-delete**          | Ignored/private does not mean reproducible or unnecessary.                                                                   |

## Additional confirmed follow-ups

These fit within the improvements above rather than becoming an unranked second roadmap:

- **Publication ambiguity:** `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/job-store.mjs:92–97` renames state before directory fsync. A later failure can reject after visible state changed. Specify committed/uncertain outcomes and idempotent recovery; do not assume every rejection means rollback. This is static failure-path evidence, not a reproduced disk failure.
- **Repeated import hashing:** `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/import-cli.mjs:17–19` inspects, then the save path re-inspects at `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/import-movies.mjs:255`. Avoid redundant scans within a pinned operation, but do not cache away required freshness checks.
- **Late receipt rejection:** output hashing precedes full identity/status reduction (`658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/job-store.mjs:73–77`, `658f01cd0b359d4a3998e019aa06dbccdb7c32e2:scripts/film-production/jobs.mjs:143–185`). Reject malformed/foreign intent early before expensive hashing under the writer lock, while retaining final reducer validation.
- **Tiny helper duplication:** DOM factories at `film-studio/inspector/app.mjs:10–15` and `film-studio/inspector/jobs.mjs:3–8` are similar. Consolidate only alongside real UI work; this is not worth a standalone abstraction campaign.

## Suggested execution order

1. **Restore trust:** improvement 1; reproduce and test improvements 2–3.
2. **Remove material waste:** improvements 4–6, with recorded before/after measurements.
3. **Finish one coherent product:** improvements 7–8 and native acceptance.
4. **Keep it clean:** improvements 9–10 in small reviewable changes, not a giant deletion PR.

This is a prioritized audit of inspected code paths, not a mathematical proof of all repository reachability. No unused-code tool alone can establish “everything we do not need” in a published, dynamically loaded monorepo. The defensible standard is **evidence before deletion, measurements before optimization claims, and demonstrated product behavior before acceptance**.
