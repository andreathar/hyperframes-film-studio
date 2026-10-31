# Film-record import implementation

Scope accepted by “great. proceed”: implement the next local consolidation stage on feat/film-production. Source repositories remain read-only.

1. Add a read-only Movies_Projects importer with a dry-run default. Follow workspace activeFilm and selected project's manifest/tasks/productionPlan pointers; read approval declarations and canonical script/CSV without rewriting text.
2. Preserve plan and legacy shot namespaces, references/roles and take IDs; diagnose duplicate IDs, dangling links, missing/archived media, bad hashes and path escapes. Do not guess crosswalks or promote legacy accepted status to current approval.
3. Snapshot only to a new directory on explicit --output. Retain source documents/hash provenance and a reconciliation report; no media copy, edits, database migration or provider call. Refuse changed sources and existing output.
4. Tests first using synthetic filesystem fixtures, including drift, path escape, duplicates, missing media, approval separation and existing output preservation. Register in root scripts. Run actual private dry-run and snapshot; keep film data ignored.
5. Run focused/root script suites, lint/format/reachability, independent final review. Commit/push reviewed source only to the existing fork PR. Document unresolved actual-source diagnostics as findings, not import failure fixes.

The output is an immutable import candidate, not the eventual editable authority database. Reference/take/job mutations and production UI remain subsequent work. Its execution permission is always false. The existing preparation tool continues to accept its own edit format; do not treat this bundle as automatically renderable.
