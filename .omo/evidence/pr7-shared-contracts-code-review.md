# PR7 shared package and contracts review

- Scope: existing PR7 base `3532efca917a2d7b412d3df06555752279a49006`, head `963d9b424c1d0612a584e55db46adc2cae3fbbf9`. Read Git objects, not dirty checkout content. No implementation changes, installs, services, branch switches, or provider calls.
- Goal: extract existing services without behavior changes; freeze typed browser/server contracts usable by subsequent workers. Success criteria from head `film-studio/EXECUTION-PLAN.md` Task 1: single implementations, preserved legacy commands, browser-safe contracts, Node dist exports, reachable tests and build compatibility.
- `codeQualityStatus`: WATCH
- `recommendation`: REQUEST_CHANGES
- Scope verdict: REVISE (contract consistency), not a demonstrated current filesystem exploit.
- `blockers`: resolve the confinement contract mismatch before treating the parsers as the frozen safe boundary for downstream consumers. Full merge readiness additionally depends on parent-owned CI/build evidence.

## CRITICAL

None found.

## HIGH

None found.

## MEDIUM

1. **Confinement helpers accept absolute paths despite promising project confinement.** `packages/film-production/src/parse/assistant.ts:19-23` and `packages/film-production/src/parse/records.ts:155-164` only reject slash-separated `..`. Both accept `/etc/passwd` unchanged. The assistant helper explicitly says the path must remain inside the project; receipt validation also claims confinement. This is inconsistent with candidate media-path validation, which rejects empty path segments and therefore leading slashes. An isolated Bun probe imported exact head sources and observed `absolute assistant path /etc/passwd`, `absolute receipt path /etc/passwd`, while `../outside` was rejected. Probe: `/tmp/pr7-contract-probe-w2d5176t/probe.ts`. This PR does not yet consume these new paths through filesystem IO: **no current arbitrary file read or exploit is claimed**. Define whether paths are project-relative and enforce that lexical contract consistently, or explicitly require downstream resolution against the project root and stop presenting this helper as confinement. Runtime realpath/symlink checks still belong at the IO boundary.

2. **New tests include brittle prompt wording and implementation-constant checks.** `packages/film-production/src/contracts.test.ts:103-107` checks that a constant array contains its current title, that a static pattern flag is true, and that authoring instructions contain a literal phrase. These assertions do not establish assistant compliance or parser behavior and fail for harmless copy edits. The enclosing test already has meaningful assertions (dialogue preservation and unknown-field rejection); retain those and replace/remove the prompt/constant checks. No deletion-only tests were found. The independent Node package import test is useful, although its `PROMPT_SECTIONS.length !== 7` check at line 185 similarly couples the probe to catalog size unnecessarily. This is MEDIUM test-quality debt, not evidence of a runtime failure.

## LOW

1. **Server-only legacy export is advertised as browser-compatible in metadata.** `packages/film-production/package-subpaths.json:23-27` includes `browser` for `./legacy`, contrary to README and the actual Node filesystem/process/HTTP imports in legacy modules. The subpath generator currently defaults unclassified entries to all environments (`scripts/package-subpaths.mjs:36-38`); account for that generator when correcting the contract. Actual public browser/contracts entrypoints do not import legacy, so no current browser bundle regression is demonstrated.

2. **Published legacy inspector has an external asset dependency.** `packages/film-production/src/legacy/inspector-server.mjs:34-37` resolves UI assets outside the package; `packages/film-production/package.json:10-14` ships only dist, README and legacy sources. A standalone installed package cannot supply the root checkout assets. Local checkout layout is correct. Clarify that this legacy inspector export is checkout-only or package its assets before advertising independent package use; not a local-extraction blocker.

## Verified strengths and evidence

- Compared every moved module against its base predecessor using Python/subprocess Git object reads. Nine files are byte-identical: import-movies, inspector-jobs, job-store, jobs, kling-handoff, manifest, placement, prepare, review. Inspector-server differs only in `../../` becoming `../../../../` for the moved module’s asset lookup. All ten old paths are single-line re-exports. No duplicate reducer implementation introduced.
- Read all new parser modules and the model/export surfaces. Public root/contracts/browser imports remain confined to model/parsers; filesystem/process modules are isolated under legacy. `unknown` is narrowed by explicit record/field checks, with no `any` or unchecked typed assertions introduced there.
- Scene dialogue strings are returned directly without trimming, Unicode normalization, translation, or replacement. Beat overlap, integer bounds, unknown fields, enum membership and candidate selection-on-registration have explicit checks.
- Production parsing is justified by the specified untrusted JSON boundary. No needless extraction/parsing/normalization was found beyond that boundary.
- Test reachability is declared by package `test: tsup && vitest run`, Vitest `src/**/*.test.ts`, root wildcard package tests; unchanged legacy suite remains in root explicit script lists. Parent owns actual build/test/CI execution; this report does not claim those checks passed.
- Inspector isolation fixture was correctly relocated to reproduce the package-relative asset path. Existing legacy behavior tests continue to exercise wrappers rather than copied implementations.
- New package is added to initial root build stage; Node contract export points at dist. No new runtime dependencies are introduced.

## Skill perspective and evidence limitations

The remove-ai-slops and programming skills are not in the provided skill catalog, no matching SKILL.md was found under `/home/athar/.agents/skills` or `/home/athar/.codex/skills`, and no skill list/read tool is exposed. Applied their explicit prompt criteria to production and tests instead. Violations: brittle prompt/constant tests noted above; no untyped escape hatch, deletion-only test, tautological test or unnecessary production normalization found. The using-superpowers SKILL.md was read and explicitly exempts dispatched subagents.

`omo-agent-toolkit ulw-loop status --json` failed because its installed runtime target is missing; no attempt directory could be resolved. Report uses requested fallback `.omo/evidence/pr7-shared-contracts-code-review.md`. No executor evidence paths or notepad path were supplied. Targeted shared knowledge recall returned nothing; local memory search found no applicable project audit facts. No historical memory claim is relied upon.

Review artifacts: this report plus isolated exact-head probe path above. Full project-state/CI and other PRs are outside this worker’s scope and remain with the parent reviewer.
