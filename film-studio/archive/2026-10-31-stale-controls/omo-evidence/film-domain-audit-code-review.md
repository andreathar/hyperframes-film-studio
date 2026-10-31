# Film domain and companion boundary audit

codeQualityStatus: WATCH
recommendation: APPROVE
reportPath: .omo/evidence/film-domain-audit-code-review.md
blockers: []

Scope approval only: no newly demonstrated CRITICAL/HIGH defect in this lane. This does not approve the overall production workflow or overrule parent findings.

## Scope, identity and evidence

Reviewed current checkout `/mnt/data/Projects_SSD/hyperframes-film-studio`, HEAD `658f01cd0b359d4a3998e019aa06dbccdb7c32e2`. Read review, jobs, job-store, placement, prepare, Kling handoff, inspector server/control/UI sources and relevant tests/docs. Compared inspector source/tests against repair peer `3532efca9`; these are distinct snapshots, not evidence of a chronological revert. No implementation diff was supplied: this is a current-state audit of the assigned modules, not PR7 approval. Parent owns CI, PR7 and final integration judgment. No notepad was supplied. Existing dirty documentation and WORKFLOW were preserved.

`omo-agent-toolkit ulw-loop status --json` fails because its configured runtime target is missing; no attempt directory was available, so this artifact uses the fallback path.

Independently ran `node --test scripts/film-production/review.test.mjs scripts/film-production/jobs.test.mjs scripts/film-production/job-store.test.mjs scripts/film-production/placement.test.mjs scripts/film-production/kling-handoff.test.mjs`: 109 passed, zero failed/skipped. Complete output: `.omo/evidence/film-domain-audit-tests.log`. No installs, builds, listening services, browser sessions, providers or model calls. Existing tests use temporary synthetic media and subprocesses. Additional probes used private temporary files, removed afterward.

## CRITICAL

None newly substantiated.

## HIGH

None newly substantiated. Parent's independently reproduced post-rename publication error remains outside this incremental finding list; this report does not clear it.

## MEDIUM

1. **Inspector input limits are enforced after unbounded reading; FIFO input blocks startup.** `scripts/film-production/inspector-cli.mjs:25-28`. `load()` uses `readFile` before checking 32 MiB, and performs no regular-file check. A mistaken FIFO input never reaches JSON validation or server creation; a huge regular file can exhaust memory before the advertised bound is applied. Direct synthetic reproduction: create a private temporary FIFO import file with `mkfifo`; spawn `node scripts/film-production/inspector-cli.mjs --import <fifo>` with a 1500 ms deadline. Result: `{"error":"ETIMEDOUT","signal":"SIGTERM","status":null,"stdout":"","stderr":""}`. No server was started. Use a bounded descriptor reader with nonblocking open, fstat regular-file validation and streamed size enforcement, as the job-store already does. Add a narrowly scoped startup FIFO/oversize test.

2. **Inspector preview can cross its workspace boundary between path validation and file reading.** `scripts/film-production/inspector-server.mjs:158-167`. The resolved path is checked, then `stat` and `readFile` reopen its name. A replacement symlink after `realpath` bypasses confinement. Hash verification still holds, so this is not proof of arbitrary unknown-file exfiltration; the source bytes must match the imported observed hash. It nevertheless breaks the documented confined-file invariant, and regular-file/size checks can similarly become stale before the read (FIFO blocking or oversized allocation). Deterministic direct-handler probe, with no socket/listen: wrap `fs.promises.realpath`, resolve workspace `clip.mp4`, replace that leaf with a symlink to a private outside file, return the original resolved pathname, and invoke the server's request listener with minimal synthetic request/response objects. Bundle expected hash was deliberately the outside bytes, matching the existing job-store race-test model. Result: `{"swapped":true,"status":200,"body":"outside"}`. The equivalent job-store boundary has explicit leaf/parent race tests and descriptor verification. Pin/validate the opened descriptor, enforce the byte bound during the read, hash that same stream, then send the collected bytes. Rate as MEDIUM because this requires a concurrent local filesystem change and the hash check remains effective; no high-impact exploitation demonstrated.

## LOW

None promoted to a separate finding.

## Strengths, test relevance and deliberate limits

- Review/job replay binds project, full source snapshot and revisions; crosswalk changes remove dependent selections. Requests retain exact shot/review/reference provenance, and aliases preserve source identity in placement provenance.
- Job-store writer exclusion and revision checks are tested; file evidence is opened nonblocking, fstat-checked and descriptor-confined, then hashed from the same stream. Placement copies those checked bytes into isolated staging and checks actual stream kind/duration before publication. Existing output protections and trusted stationary ancestor assumptions are explicit.
- Preparation timing uses `(sourceInFrame + durationFrames * rate) / project.fps`, consistent with the runtime's media-start plus rate-scaled elapsed-time model. This is source-level consistency plus synthetic probing, not rendered non-unit-rate audio/video acceptance.
- Handoff packets preserve explicit intent and remain blocked with no authentication or execution permission. Local observations are described as reported evidence, not provider authentication or creative approval.
- In-memory review, no attempt/retry model, imported-catalog-only selection, snapshot fingerprints and whole-file preview without ranges are explicit present limitations, not newly discovered bugs. They materially limit production workflow completeness but should not be misrepresented as hidden implementation regressions.
- Previously reported placement line-ID test defect is fixed in current HEAD: `placement.test.mjs:203-227` recreates/replays review after changing the bundle, rebinds plan hashes and requires `lineId: invalid ID`. Do not repeat the obsolete finding from the older placement report.
- Current inspector reads UI assets per request; repair peer `3532efca9` captures the initial asset set and tests disk replacement/missing modules. Current HEAD therefore lacks that peer's served-asset consistency protection. Integrate/verify the peer repair separately; do not count it as already present.

## Skill-perspective check

`remove-ai-slops` and `programming` were absent from the supplied catalog and searches of local skill roots/plugin cache. Applied the reviewer prompt's documented criteria instead; the overfit/slop and programming perspective check ran on production code and selected tests. No deletion-only tests, requested-removal-only tests, tautological assertions, brittle prompt tests, implementation-constant-only tests, untyped escape hatches or needless parsing/abstraction were identified. Boundary parsing/hash/provenance checks serve actual authored JSON and filesystem trust boundaries. Existing race, stale-revision, real-media coverage and CLI tests exercise meaningful behavior. No violation of either perspective found in the inspected current code; absence of inspector race/startup coverage is captured in the MEDIUM findings above.

## Minimal remediation and verification order

1. Parent first resolves its publication-outcome blocker and reconciles the already-repaired peer snapshot.
2. Bring inspector startup and preview onto equivalent bounded regular-file/descriptor-read guarantees; verify FIFO, growth and leaf/ancestor-swap cases without real media/providers.
3. Preserve the 109-test offline baseline; run inspector HTTP/browser suites in the separately authorized verification lane.
4. Keep production catalog/attempt/review-persistence/fingerprint migration work as explicit planned capabilities. Passing these tests is not live provider, final rendered timing, filmmaker acceptance or end-to-end production clearance.
