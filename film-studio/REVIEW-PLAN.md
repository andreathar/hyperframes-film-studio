# Project-scoped mapping and candidate review

Continue the accepted consolidation roadmap with pure local review services and a file-based CLI, before building the inspector. Scope: shot crosswalk, source-role reference assignment and candidate take selection; no artistic approval or job execution.

- Review state is bound to project ID and SHA-256 of the exact supplied import candidate. Each command supplies that project, source fingerprint and expected review revision. Unknown/stale/cross-project input fails.
- Start with no mappings or selected takes. Preserve both source namespaces. Explicit one-to-one plan→legacy mapping requires a reason; changing a mapping invalidates that plan shot's selected candidate take.
- Reference assignment preserves its declared source role and requires matching declared/observed byte hashes. Candidate take selection requires a compatible source shot (or explicit mapping), current observed hash and available, nonarchived media. Selection never becomes artistic acceptance or generation authorization.
- CLI previews by default; optional --output creates one new private JSON review file exclusively. Existing source, import, state and timeline files remain unchanged. No database/server/provider is introduced.
- Test first: real transitions, stale revisions, changed sources, foreign ownership, invalid media, ambiguous mappings, invalidated selections, unsupported actions, no overwrite and actual CLI. Register tests, run focused/root scripts and lint/reachability, obtain final independent review, push reviewed source to the existing draft PR.

The fingerprint detects mismatch, not authenticity or current disk freshness. Supplied import candidates remain observations; re-import/reconcile before consequential use. Job submission and approval services remain absent. An actual film state may be initialized, but no real crosswalk or artistic selection is guessed by the agent.
