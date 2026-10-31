# Provider jobs code review

Reviewed checkout: /mnt/data/Projects_SSD/hyperframes-film-studio
Base HEAD: 21e1ddefd45893b9f9b249c9de34a45f900a010e
Scope: uncommitted jobs.mjs, job-store.mjs, jobs-cli.mjs, their tests and fixture, JOBS-PLAN.md/JOBS.md, package.json and three changed documentation files.

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES

## CRITICAL

None.

## HIGH / Important

1. **Evidence confinement has a check/open race.** `scripts/film-production/job-store.mjs:25` resolves and checks the pathname, but `:32` subsequently opens it by name and follows symlinks again. Replacing the resolved file or an ancestor directory between those operations can make inspection hash and accept bytes outside the explicit workspace. This violates the confinement guarantee in JOBS.md. Reproduced with a synthetic workspace and an isolated Node process: a temporary wrapper around fs.promises.realpath performed an output-file-to-outside-symlink replacement after returning the original confined realpath; inspectJobReceipt accepted the outside file's SHA-256. The production source was untouched. Observed output: `Accepted outside output after deterministic swap between realpath and open: true`. Bind validation and hashing to the opened file, ensure its resolved descriptor remains confined, and cover both final-entry and parent-directory replacement races. A static pre-open realpath check or O_NOFOLLOW alone does not cover replaced ancestors.

2. **Unsupported special files can block the writer indefinitely.** `scripts/film-production/job-store.mjs:32` calls blocking open('r') before `:34-36` checks isFile. A FIFO receipt or output blocks before that rejection. updateJobStore already owns `.write.lock` (`:124-133`), preventing further mutations; terminating the stuck process leaves an abandoned lock requiring manual recovery. Reproduced with Python tempfile + os.mkfifo and a Node child calling initializeJobStore followed by updateJobStore observing receipt.json. After a three-second subprocess timeout: `FIFO observation timed out after 3 seconds; stdout: b'initialized\n'`; `writer lock remains: True`; `published revision: 0`. Reject special files without a blocking open, retaining descriptor-level type validation against races. Also address readJobJson (`:10`), which streams unvalidated file types and can similarly block on a FIFO state/input. Add a bounded child-process regression so failures cannot hang the test runner.

## MEDIUM

None beyond the blocking correctness findings above.

## LOW / Minor

- `scripts/film-production/jobs.test.mjs:47` names shot-renaming coverage, but that test changes only job ID and review reason, never shotKey. Reference-alias dedupe and interruption around publication also lack explicit coverage in the submitted tests despite being called out in JOBS-PLAN.md. This does not establish reducer/publication incorrectness; strengthen the evidence or describe coverage accurately.

## Verification and scope assessment

Independently ran `node --test scripts/film-production/jobs.test.mjs scripts/film-production/job-store.test.mjs`: 30 passed, 0 failed. Inspected all new source/tests/fixture and tracked documentation/package diffs, plus existing review canonicalization and source binding. The implementation has no provider API requests, model loading or provider subprocess execution. Routes are labels; outputs remain candidates; executionAllowed remains false. Replay, immutable captured shot/review fields, effective-reference fingerprints, revision checks and exclusive lock acquisition are coherent within the documented editable local-ledger model. Tests exercise real reducer transitions, filesystem persistence and CLI execution, rather than removal-only or tautological assertions.

Skill-perspective check ran using the remove-ai-slops and programming criteria supplied in the role prompt. Those skills were absent from the available catalog and from searches of local skills/plugin cache; no exact SKILL.md could be loaded. No deletion-only tests, brittle prompt tests, untyped escape hatches, needless abstraction, or unnecessary production parsing were found. Parsing and strict validation belong at these JSON/file boundaries. The filesystem findings are correctness issues, not style/slop findings.

No executor evidence paths or notepad were supplied. I did not validate the parent's 93-test claim or full test:scripts/lint/format/build claims; only the 30 directly run checks are certified here. I did not access private records, real .film-workspace data, running services, providers, GPUs, paid APIs, or original checkouts. Historical media freshness, authenticity of externally authored receipt JSON, cross-store dedupe, external authority, codec/creative acceptance and live provider compatibility are explicitly outside this increment. Crash/power-loss durability was inspected in source (flush, rename, directory sync), not fault-injected on real storage. Controlled symlink race injection proves the vulnerable ordering, not its incidence under normal production workloads.

Report path fallback: omo-agent-toolkit ulw-loop status --json failed because its runtime target is missing; no currentAttemptDir could be obtained. Report saved in .omo/evidence/film-provider-jobs-code-review.md. No implementation changes, staging, commits, branches or services were changed.

Blockers: fix descriptor/path confinement race and nonregular-file blocking before approval.
