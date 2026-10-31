# Inspector job controls delivery

This increment connects the approved companion inspector to the existing durable job services. Select a shot, prepare explicit video intent and record a saved receipt for the chosen job. The browser shows saved revision, route/model intent, external state and candidate counts. No provider execution is added.

Implementation branch: `feat/film-inspector-jobs`, stacked on `feat/film-timeline-placement` in `andreathar/hyperframes-film-studio`. The original upstream and existing film workspace remain separate. The existing running inspector is preserved; use the separate startup instructions in [JOB-CONTROLS.md](JOB-CONTROLS.md).

Verified software evidence:

- HTTP, durable filesystem and actual DOM tests cover preparation, stale review/store rejection, cross-origin/token/type refusal, selected-job receipt binding, changed output refusal and review-only operation.
- Headless Chrome exercises actual forms, saved jobs after reload, explicit shot filtering, wrong-job and stale-review refusal with drafts preserved, receipt success, keyboard access, desktop/mobile layouts and dark mode.
- Film suite: 153 passing tests. Root scripts: 1,012 Node tests and 109 Vitest tests, all passing. Test reachability reports zero orphan tests.
- Changed JavaScript passes oxlint; changed source/package files pass oxfmt and the diff whitespace check. The scoped design detector reports no findings.

Read [JOB-CONTROLS.md](JOB-CONTROLS.md) for setup and operator behavior. [TASKS.md](TASKS.md) and the Plannotator Board keep the remaining adapter, intake, Studio integration, render and film-acceptance work visible. These checks use synthetic data and do not qualify live providers or approve film content. Job outputs remain candidates, and no actual film job was prepared during acceptance testing.

Final independent read-only review found no critical or important issue and independently passed 22 HTTP/DOM/store tests. Two minor follow-ups remain: announce job-load failures through the live error/status channel and add a deterministic overlapping review/job mutation regression. The current queue is correct; this is additional regression protection. Authenticated same-origin POST filesystem errors may include the configured local root; error redaction is recorded as a later hardening task. Broad-suite and visual evidence were run and checked by the implementer, with the focused subset independently rerun.
