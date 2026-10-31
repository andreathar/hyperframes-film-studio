# Movies snapshot importer review

- codeQualityStatus: CLEAR
- recommendation: APPROVE
- reportPath: .omo/evidence/film-import-code-review.md
- Scope: scripts/film-production/import-movies.mjs, import-cli.mjs, import-movies.test.mjs, film-studio/IMPORT-PLAN.md in /mnt/data/Projects_SSD/hyperframes-film-studio.
- Goal: read-only inspection and explicit new-directory snapshots with separate shot namespaces, accurate provenance, no execution permission, source edits, or media copies.
- Prior preparation report preserved. No private bundle or other repository inspected. No notepad supplied. ULW command was previously unavailable because its installed runtime target is missing; using separate fallback report.

## CRITICAL

None.

## HIGH

H1 — Auxiliary source documents bypass selected-project containment (import-movies.mjs:91–110).

The selected-project lexical and realpath checks apply only to manifest, productionPlan and tasks. The approvals, script and dialogue documents use document(), which only confines their realpaths to the entire workspace. A symlink from film/00_brief/approvals.json to other/approvals.json is therefore accepted, importing another project's declarations and identifying their provenance path as film/00_brief/approvals.json without a project-escape diagnostic. Script and dialogue have the same gap.

Independently reproduced in a fresh synthetic temporary workspace: projectId film; imported approval value {project: OTHER, paidGenerationBatchApproved: true}; recorded approval path film/00_brief/approvals.json; diagnostics contained only missing optional script/dialogue warnings. No actual film records were used. This does not enable execution (executionAllowed stays false), but it corrupts the project attribution of the snapshot's evidence, a core importer contract.

Required: enforce selected-project realpath containment for all project-owned documents, retaining explicit optional-missing handling. Add a regression for a cross-project symlink in approvals or script/CSV. Do not silently accept a different project's canonical evidence.

## MEDIUM

None.

## LOW

None requiring action in this focused review.

## Verified behavior and limits

Ran node --test scripts/film-production/import-movies.test.mjs independently: 9 passed, 0 failed, 0 skipped. Reviewed all specified files. Tests meaningfully cover distinct shot namespaces, declarations without activation, duplicate/dangling references, hash drift, workspace escapes, existing output, stale documents/media, and default dry-run. Snapshot writing uses a staged directory and exclusive output reservation; no ordinary overwrite path was identified. Media is hashed rather than copied. Fresh inspection comparison detects pre-save changes observed during the reinspection; this is not a transactional filesystem snapshot against continuously mutating external writers.

## Skill perspectives

remove-ai-slops and programming were unavailable in the catalog and searched local skills/plugin directories in the earlier review. Applied their reviewer-prompt criteria to this new diff. No deletion-only/tautological/prompt-string or implementation-constant tests, untyped escape hatches, or unnecessary production extraction were found. Parsing and hashing are justified at this importer boundary. No independent skill-perspective violation beyond the correctness issue above.

## Blockers

- H1: project containment for approvals/script/dialogue and a regression proving cross-project symlinks cannot be attributed to the selected film.

## Focused re-review — H1 resolved

Inspected shared document() containment and selectedRoot initialization. After workspace selection, every project document now has its resolved path checked against the resolved selected project root before reading. This includes approvals, optional script and optional dialogue. Missing optional files retain their prior ENOENT warning behavior; a project escape raises an error rather than being mistaken for missing input.

Independently reran node --test scripts/film-production/import-movies.test.mjs: 10 passed, 0 failed, 0 skipped. The new regression exercises the originally reproduced cross-project approvals symlink. Its name also mentions script, though its fixture directly exercises only approvals; script and dialogue use the same corrected loader, verified by inspection. This naming detail is nonblocking.

The regression is a real filesystem behavior check, with no slop or implementation-mirroring concern under the supplied skill criteria.

Final codeQualityStatus: CLEAR.
Final recommendation: APPROVE.
Final blockers: none. Original H1 and blockers above are retained as historical evidence and superseded by this re-review. No implementation edits or private film access occurred.
