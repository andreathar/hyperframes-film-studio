# Local provider jobs implementation plan

> For agentic workers: use superpowers:executing-plans. Continue the user's approved consolidation roadmap inline; one independent review at the end.

**Goal:** Prepare generation intent and reconcile external receipts in a durable project-scoped ledger without activating providers.

**Architecture:** Reuse the import and replay-checked review contract. A pure job reducer preserves prepared intent and evidence; a checkout-local CLI writes one atomic JSON ledger under an explicit store directory, with an exclusive writer lock and revision checks. No new dependencies or inspector changes.

**Spec:** This document records the next bounded increment of film-studio/PLAN.md and the accepted preparation/reconciliation roadmap. Live adapters and approval authority remain later work.

## Contract and constraints

- A prepared job records its ID, source fingerprint, shot, full review snapshot, route, model, prompt, output specification and assigned reference IDs/roles/hashes. Routes are intent labels: kling-cli, higgsfield-manual, comfyui-manual, local-manual. None establishes availability, account readiness or a provider-valid payload.
- Request fingerprints ignore job IDs, shot labels, review history/reasons and reference IDs; effective route/model/prompt/output/reference roles and bytes determine duplicates inside the one ledger. Duplicate intent is refused even after failure; no retry operation exists.
- External receipts bind project/job/request fingerprint/route and a stable external ID. States: prepared → reported-running/unknown/reported-failed/reported-succeeded; unknown permits reconciliation; terminal states cannot regress. A route/external ID pair cannot belong to two jobs. Unknown may omit an external ID; all other observations require one.
- Receipts are local JSON files confined to an explicit workspace, up to 1 MiB. Successful receipts require 1–16 output records with relative paths, kinds and actual SHA-256. Each current regular output file is confined and streamed up to 2 GiB, without copying/deleting media or interpreting its codec. Recorded outputs are candidates; provider status and technical/creative acceptance remain separate.
- Ledger history is replayed against the original import and each preparation's saved review. Restoration does not reread historic output bytes. File edits are not authenticated evidence or authority. executionAllowed is always false.
- Store init refuses existing directories. Mutations acquire a non-stealing exclusive lock, reread/replay state, compare expectedRevision and atomically replace a flushed state file; state and inputs are bounded to 32 MiB. A crashed writer may leave a lock requiring operator inspection. Never auto-remove another writer's lock. Duplicate protection applies only to this store, not cloned stores or external providers.
- Existing film files, inspector, previews and private records stay unchanged. Public fixtures are synthetic. No credentials, network requests, subprocess provider calls, GPU inference or timeline edits.
- Implementation ruling: confined receipt verification uses opened Linux `/proc/self/fd` paths and nonblocking/no-follow opens, closing leaf/ancestor replacement races and FIFO blocking. Other platforms fail closed for receipt inspection; a portable descriptor boundary is future work.

## Review focus

Cross-project/source replay; provenance altered while derived fields look valid; duplicate intent hidden by renamed metadata; output path/hash drift and symlink escapes; concurrent/stale writers and interrupted state publication. Tests cover each at the owning boundary.

### Task 1: Pure preparation and observation reducer

Files: create scripts/film-production/jobs.mjs and jobs.test.mjs.
Interfaces: consume createReview/restoreReview/reviewFingerprint; produce createJobs(bundle), restoreJobs(bundle,state), applyJob(bundle,state,command). Commands use projectId/sourceFingerprint/expectedRevision/action. prepare includes request, review and reason; observe includes receipt, evidence and reason.

- [ ] Write behavioral tests for provenance, immutable intent, duplicate intent across labels/revisions, receipt binding, stable external IDs, unknown recovery, terminal protection, candidate outputs and replay tampering.
- [ ] Run node --test scripts/film-production/jobs.test.mjs; expect missing implementation failures.
- [ ] Implement reducer with strict field validation and bounded history; run the same tests, expect all pass.

### Task 2: Durable store, receipt inspection and CLI

Files: create job-store.mjs, jobs-cli.mjs and job-store.test.mjs; update package.json and film documentation.
Interfaces: consume Task 1 exports; produce initializeJobStore(bundle,path), readJobStore(bundle,path), updateJobStore(bundle,path,command,{workspace}), inspectJobReceipt(workspace,relativePath). Store observe actions accept receiptPath; the store supplies checked receipt/evidence to the pure reducer. CLI film:jobs requires --import and --store; default show is read-only; --operation init|prepare|observe chooses mutation, with --expected-revision and --reason for updates. prepare requires --review/--request; observe requires --workspace/--receipt.

- [ ] Write filesystem/CLI tests for exclusive init, persistence/reload, simultaneous writer lock, stale revision, unchanged state after failure, confined receipt/output hashes, symlink escape and CLI errors. Run node --test scripts/film-production/job-store.test.mjs; expect missing implementation failures.
- [ ] Implement store/receipt checks and CLI. Run tests, expect all pass. Register both test files in film:test and test:scripts; document operation and limits, including the CLI command index.
- [ ] Run film:test, test:scripts, reachability, lint, format and diff checks; expect all pass. Exercise a synthetic CLI preparation→unknown→success with saved/reloaded state.
- [ ] Independent review; fix important findings with a reproduced regression. Commit/push source and docs to existing draft PR; verify remote SHA. Hand over evidence and keep the Board current.
