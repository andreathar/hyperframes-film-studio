# Import existing film records

`film:import` reads a Movies_Projects workspace and reports what can be reconciled. It preserves the visual production plan and legacy manifest as separate sources. It never changes film records, imports approval authority, copies media, edits a timeline or submits a provider job.

## Inspect first

```sh
bun run film:import --workspace /path/to/Movies_Projects
```

Default output is a JSON dry-run report. Source files are read through the workspace's `activeFilm` and selected project pointers; required source pointers must remain in that project's directory. References may use owned paths elsewhere in the same workspace. Paths and symlinks escaping the workspace are refused. Media is hashed locally, not uploaded or decoded.

The report includes record counts, source-document hashes and reconciliation diagnostics. Exit 0 means the inspection completed, **not** that every diagnostic is resolved. Inspect the diagnostic list before using any records. Malformed required inputs fail with a nonzero exit.

## Save an import candidate

```sh
bun run film:import --workspace /path/to/Movies_Projects --output .film-workspace/import-v1
```

The output directory must be new. The tool re-inspects source documents and media before saving and rejects a changed snapshot. It writes `import.json` with the exact source text and parsed JSON declarations, original reference/take records and media observations, plus `report.json`. Originals and their approvals remain external authority. Keep the output private under ignored `.film-workspace/`.

This is a captured observation, not a transactional backup or a lock on the source workspace. Source files can change after inspection; re-inspect before subsequent consequential use. Missing files are reported, never restored. Archived takes stay archived; their archived destinations are not searched. File extensions are not treated as media-format validation; this inventory hashes bytes only. `film:prepare` performs separate stream/duration checks for an explicit edit.

## Record identity and approval

The candidate format has `version: 1`, `kind: movies-import-candidate`, `sourceAuthority: external` and `executionAllowed: false`.

- `documents` retains exact source text, parsed JSON where applicable, relative path and SHA-256. Script Markdown and dialogue CSV are retained without rewriting or interpreting their text.
- `shots` preserves `plan:<id>` and `manifest:<id>` namespaces. A coincident ID does not prove equivalent coverage. Original direction, line IDs, reference roles and source state fields remain inside each `record`.
- `references` keeps the original record plus media observations: verified against a declared hash, observed without a declared hash, missing, mismatched, invalid or archived.
- `takes` keeps original take/shot IDs and legacy status, with `approval: not-imported`. A source `accepted` declaration is historical evidence, not new artistic or spending authority.
- `diagnostics` records duplicate IDs, missing links/media, hash mismatches, invalid paths and explicit mapping requirements. `TAKE_SHOT_CONFLICT` requires a producer decision; it does not rename or reassign the take.

The importer does not produce a renderable edit manifest, auto-select takes, populate provider credentials or resolve unknown connections. It is the intake boundary for later reference/take/job services and the production interface.

## Verify

```sh
bun run film:test
bun run test:scripts
```

Synthetic tests cover source namespaces and exact text, declared-versus-executable approval, missing/changed media, duplicate IDs and broken links, path escapes, stale snapshot refusal, no overwrite and CLI dry-run behavior.
