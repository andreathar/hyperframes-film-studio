# Local job services delivery

The fork now provides `film:jobs` for a durable, private job ledger. It prepares explicitly authored generation intent against an imported shot and saved review; retains direction, line IDs and reference-role/hash provenance; rejects duplicate effective intent; and records external observations against stable request and task identities. Unknown outcomes remain on the same job for reconciliation.

Receipt/output files are checked locally. A reported success requires matching nonempty output bytes and records candidates only. The store checks revisions, serializes writers with an exclusive non-stealing lock, replays history and publishes a flushed replacement state atomically. Invalid observations and stale writers preserve the previous published state.

## Verification

- `bun run film:test`: 99 tests passed, no failures or skips; 36 directly cover the new jobs/store behavior.
- `bun run test:scripts`: 958 Node tests plus 109 Vitest tests passed.
- Test reachability: zero orphan tests. Changed source passes oxlint and oxfmt checks.
- Actual CLI acceptance with isolated synthetic records: init → prepare → unknown → reported success → reload at revision 3. Candidate byte hashes and unchanged bytes were checked; execution permission remained false.
- Independent review found two important filesystem defects. Both were reproduced before correction: FIFO input blocked the writer, and a controlled leaf/parent symlink swap bypassed the original path check. Nonblocking/no-follow opens, regular-file checks and opened-descriptor confinement fixed them; the regression suite passes. This fix pass was verified by tests, without a second independent review.
- Additional tests cover duplicate intent across shot labels and same-byte reference aliases, plus a controlled publication failure preserving the previous revision and releasing the owned lock for retry. Physical power-loss durability was not tested.

The running film inspector remains unchanged at revision zero. All seven imported source documents still match the captured hashes. No real job request, media choice, provider submission, paid generation, model load or timeline change was made for this delivery. Public fixtures are synthetic; private evidence remains ignored.

## Limits and next work

Read [JOBS.md](JOBS.md) for exact schemas, commands and recovery. Receipt verification currently requires Linux `/proc/self/fd` and fails closed elsewhere. Route/model labels are intent metadata, not provider-valid payloads or readiness checks. Duplicate protection applies to one canonical store; editable receipts/history are not authenticated external evidence or creative approval.

Live adapters, exact-payload release authorization, provider capability checks and inspector job controls are subsequent work. Candidate results are not automatically registered as takes or placed in an edit. This increment establishes preparation and reconciliation services while preserving the existing provider release boundary.
