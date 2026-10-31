# Kling handoff independent code review

- codeQualityStatus: BLOCK
- recommendation: REQUEST_CHANGES
- Goal: a blocked, local producer handoff; no provider execution, canonical source writes, or job-store mutation.
- Checkout: `/mnt/data/Projects_SSD/hyperframes-film-studio/.film-workspace/kling-handoff-worktree`
- Base/HEAD inspected: `edb6a469cd81ea66eeaba0ca104214fbf5e26c9a`; uncommitted increment.
- Reviewed: new handoff module, CLI and tests; job-store helper diff; package scripts; KLING-HANDOFF-PLAN.md, KLING-HANDOFF.md, TASKS.md and documentation diffs.
- Attempt path: `omo-agent-toolkit ulw-loop status --json` could not run because its installed runtime target is missing. No `.omo` directory/loop plan existed in this worktree. This report uses the prescribed fallback location.
- Notepad and prior evidence artifact paths: not supplied. Parent reports independent canonical compatibility acceptance remains in progress; that report is not treated as passing evidence.

## CRITICAL

None found.

## HIGH / Important

### H1 — A moved open export directory can receive canonical-workspace writes and still report success

Location: `scripts/film-production/kling-handoff.mjs:295` through the writes at lines 299 and 304, and success return at line 315.

The opened descriptor prevents replacement symlinks from redirecting the write, but it pins the inode rather than its namespace location. If the export parent is renamed into the canonical workspace immediately after the last `realpath` check, both files are created under that workspace. The function returns the stale original outside path successfully. This violates the stated canonical-workspace write exclusion and can misreport where the packet was saved. The existing parent-replacement test covers a symlink replacement before parent open, not relocation of an already-open ancestor.

I reproduced this against the reviewed code using only disposable synthetic directories. The following command runs from the checkout and cleans its temporary tree:

```sh
node --input-type=module <<'JS'
import fs from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const root = await fs.mkdtemp(join(tmpdir(), 'handoff-review-'));
const workspace = join(root,'canonical'), parent=join(root,'exports');
await fs.mkdir(workspace); await fs.mkdir(parent);
const original=fs.realpath; let swapped=false;
fs.realpath=async(path,...rest)=>{
  const result=await original(path,...rest);
  if(!swapped && String(path).startsWith('/proc/self/fd/') && result===join(parent,'packet')) {
    swapped=true;
    await fs.rename(parent,join(workspace,'moved-exports'));
  }
  return result;
};
syncBuiltinESMExports();
try {
  const {writeKlingHandoff}=await import('./scripts/film-production/kling-handoff.mjs');
  const packet={spec:[{auth:null,submissionBlocked:'blocked'}],receipt:{executionAllowed:false}};
  const returned=await writeKlingHandoff(packet,join(parent,'packet'),workspace);
  console.log(JSON.stringify({swapped,returned,canonicalWrite:JSON.parse(await fs.readFile(join(workspace,'moved-exports','packet','runner-spec.json'),'utf8'))}));
} finally {await fs.rm(root,{recursive:true,force:true});}
JS
```

Observed result, exit 0:

```json
{
  "swapped": true,
  "returned": "/tmp/handoff-review-5Zmaj5/exports/packet",
  "canonicalWrite": [{ "auth": null, "submissionBlocked": "blocked" }]
}
```

Required resolution: handle detected ancestor/output relocation without claiming successful isolation; add a deterministic regression for the demonstrated race. State an accurate concurrency/trust boundary for export. Additional path checks alone cannot make a categorical no-canonical-write guarantee against an actor able to relocate an open ancestor at any time; do not describe descriptor pinning as that guarantee. If the strict guarantee remains mandatory against such relocation, the output mechanism/environment needs a stronger boundary rather than repeated path checks alone.

## MEDIUM

None separately identified. The producer parity gate is pending evidence, not asserted as a code defect.

## LOW / Minor

No actionable code findings.

## Skill-perspective and scope check

The advertised skill catalogs and local `/home/athar/.agents/skills` and `/home/athar/.codex/skills` searches contained neither `remove-ai-slops/SKILL.md` nor `programming/SKILL.md`. Applied the explicit fallback criteria from reviewer instructions to production code and tests. The using-superpowers skill was consulted and explicitly excludes dispatched subagents.

No deletion-only, requested-removal-only, tautological, or needless extraction/parsing tests/production changes were identified. Native argument normalization has a concrete canonical fingerprint and alias rejection purpose. Tests use prepared synthetic jobs and actual CLI execution; the independent fixed expected native payload is a protocol assertion, not a mere mirror of a production constant. Filesystem monkeypatching schedules a real namespace race rather than mocking away filesystem behavior. No untyped escape hatch or unnecessary abstraction was found. H1 is a correctness/contract failure, not a speculative slop criticism.

## Independently verified evidence

- `bun run film:test`: exit 0; 123 tests, 123 passed, 0 failed/skipped. This includes all 99 prior film tests and 24 handoff tests.
- `node_modules/.bin/oxlint` on the four changed/new JS implementation/test files: exit 0, 0 warnings/errors.
- `node_modules/.bin/oxfmt --check` on those four files: exit 0, all formatted.
- `git diff --check`: exit 0.
- H1 reproduction above: exit 0, canonical packet write observed despite successful export return.
- No source, index, HEAD, provider state, or real film data was modified by this review. Only this review artifact was added; test/reproduction data was disposable synthetic state.

## Not judged / approval limits

Did not access the canonical Movies checkout, real `.film-workspace` film data, live services, provider accounts, models, or external APIs. Exact compatibility with the private canonical producer, actual runner rejection before provider invocation, and private integration acceptance remain the parent's checks. The local fixed native payload fingerprint test passed, but is not proof of the current private runner's implementation. No claim is made about live capability availability, cinematic acceptance, production activation, or safety under an adversarial same-user filesystem actor. Root repository full build/root script suite were not independently rerun; the changed film regression suite was.

## Blockers

1. Resolve H1 and accurately specify the export relocation concurrency boundary; do not report isolation success for a moved output.
2. Parent must attach the planned private canonical parity/blocked-runner acceptance evidence before claiming that integration gate passed.
