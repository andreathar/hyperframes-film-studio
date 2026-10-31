# Explicit candidate placement plan

Continue the accepted roadmap inline, using test-first implementation and one final independent code review. Board reconciliation is complete before code work. This increment consumes the existing review/manifest/preparation contracts.

Goal: turn an explicit frame-based cut plan and reviewed candidate takes into a new editable local composition, without inferring shot order, approval or timeline replacement.

Contract:

- Cut plan version 1 binds project ID, import fingerprint, exact saved review fingerprint/revision, explicit project title/fps/dimensions, durationFrames and clips. Each clip explicitly identifies a source shot key, currently selected take ID, stream kind, track, timing, source trim, rate and volume. Unknown fields fail.
- Restore/replay the saved review. Refuse absent selections, different take IDs, source/hash drift, unavailable/archived media and invalid timing/streams. Use the existing validateManifest and prepareProject rather than another renderer. Picture covers track 0 without gaps; separate audio may use the selected takes' audio streams for J/L cuts. Additional music/room tone can still use the existing manifest authoring path; automatic source inference is excluded.
- Generate safe internal shot/take/asset aliases for Hyperframes IDs; preserve canonical original IDs, full shot records, notes, review/source/plan hashes and mappings in placement.json. Project line IDs that the current manifest cannot represent fail rather than being rewritten. Only supported string direction fields project into production.json; report other source direction fields retained in provenance.
- Securely copy current take bytes from opened, confined Linux descriptors into a private temporary manifest input. Verify their captured hashes, then use existing preparation to probe actual streams/duration and create a portable composition. No paid providers, source mutations, job/review writes or creative approval.
- CLI film:place requires --import --review --plan; --describe exposes current binding fields and selections without inventing a cut; default preview prints manifest/provenance only. Applying also requires --workspace and --output. Output is a new directory outside the canonical workspace. Existing output/user edits are refused. Workspace/export ancestors must remain trusted and stationary, matching the existing filesystem boundary. Partial private scratch on failures is retained for inspection.
- Preserve original checkout staged work; work on feat/film-timeline-placement stacked on the handoff branch. Update task checklist/Board, docs/command index and delivery with actual evidence.

Tasks:

1. Write failing compiler tests for exact placement, source identity, preserved source records/aliases, review binding, unsupported fields/timing/selection and independent audio. Implement compilePlacement(bundle,review,plan), expect green.
2. Write filesystem/actual CLI tests with owned synthetic video/audio: changed/missing/escaped bytes, new composition, stream duration rejection, no overwrite, source bytes unchanged. Implement preparePlacement({bundle,review,plan,workspace,output}) with shared descriptor-bound copy and existing prepareProject; CLI preview/apply. Expect green.
3. Run film and root script suites, reachability, lint/format/diff checks, and synthetic generated-composition lint/browser check. Independent review, reproduce/fix important findings, update docs/tasks, commit/push stacked draft PR and attach evidence. No real film choices are authored by this work.

Review focus: silent take/shot substitutions; lost direction/line IDs; unsafe aliases; copy/hash/path races; existing output preservation; claims that confuse candidate placement with creative acceptance or live synchronization.
