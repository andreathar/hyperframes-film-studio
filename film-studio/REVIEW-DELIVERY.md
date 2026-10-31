# Project-scoped review delivery

Added `film:review` with import-fingerprint/project/revision-bound state and explicit shot crosswalk, source-role reference assignment and candidate-take selection. Mapping changes or removal invalidate the dependent plan-shot selection. Assignment clearing is explicit and leaves media untouched.

The CLI previews by default and saves only to a new private JSON file. Review restoration replays command history and checks resulting state. Imported accepted flags, editable history and matching hashes grant no artistic, identity, registration or spending authority. The candidate format cannot submit a job or change an edit.

Verification: 24 review tests and 33 existing preparation/import tests passed, without skips. Tests cover state isolation, revisions, source drift, role/hash requirements, unavailable takes, mapping ambiguity and invalidation, explicit removal, unsupported approval fields, edited-state rejection, serialization/replay and actual CLI output preservation. Independent review approved after a missing-role serialization defect was reproduced and fixed. A subsequent pre-transition history-cap guard prevents an additional event beyond the restoration limit; capacity stress is not claimed as tested. Lint, formatting and reachability checks passed.

The real imported project was initialized locally with zero mappings, references or selected candidates, then restored unchanged. No real shot/take mapping was guessed. Its existing reconciliation findings remain open. No provider, source-film, timeline or artistic approval changes were made.

Next: expose source records, diagnostics and review proposals in the production inspector, with a deliberate reconciliation path. Job preparation/submission and an authoritative multi-user persistence service remain separate implementation work. Review files are a local service contract, not that database.
