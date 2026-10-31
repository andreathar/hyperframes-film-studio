# Film-record intake delivery

Implemented `film:import` with a read-only default and optional new-directory candidate snapshot. See [the import contract](IMPORT.md).

The importer follows workspace selection, preserves plan and legacy namespaces, source text and hashes, reference roles and original take declarations. It reports unresolved links rather than inventing crosswalks. Archived/missing media is never restored; changed hashes and escaped paths remain findings. No media is copied, no source database or timeline is mutated and execution authority is always false.

Synthetic verification: 13 importer tests plus the existing 20 preparation tests pass, with no skips. Coverage includes exact source text, historical versus executable approval, missing/changed media, duplicate/broken IDs, source/media path escapes, cross-project approval/script/dialogue symlinks, missing optional documents, stale input, no overwrite and the default CLI behavior. Independent review approved the provenance fix with no blockers. Changed source lint/format and test reachability passed.

A real private workspace inspection and snapshot were completed. Captured source-document hashes still matched the source after the run. Unresolved shot/take mappings remain in its private reconciliation report; no source correction or creative acceptance was inferred. Private snapshots are under ignored `.film-workspace/` and excluded from the published change.

The format is a captured import candidate, not a live authority database, transactionally consistent backup or renderable edit. The next stage is a reviewed crosswalk plus project-scoped reference/take/job services and the production inspector. Vendor credentials, registration verification, submission authority and artistic acceptance remain separate work.
