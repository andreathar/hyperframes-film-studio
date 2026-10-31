# Inspector job controls plan

Continue inline on the approved local job/inspector contracts with test-first implementation and one final independent review. This increment stays in the existing inspector's visual system and adds no provider transport.

Goal: prepare video job intent and record saved external receipts from the selected-shot inspector, using durable services rather than manual CLI duplication.

Contract:

- Optional --jobs selects one existing project/import-bound store at server startup. Optional --results-workspace fixes one receipt/output root. Defaults preserve current review-only behavior; the browser cannot switch stores/roots or initialize arbitrary paths.
- GET /api/jobs returns a bounded projection: revision, prepared intent/status, external ID and candidate/evidence counts; no raw source/review history, filesystem paths, receipt contents or output bytes. New POST job actions share Host/Origin/JSON/CSRF checks and bounded UTF-8 body reading with review proposals.
- Preparing intent requires current job revision, expected review revision/fingerprint, project/source identity and an explicit request/reason. The server captures its own review state. Serialize browser review/job mutations so no browser proposal can change that review mid-prepare. External store writers still use existing lock/revision checks.
- Observation requires selected job ID, current jobs revision, relative receipt path and reason. The store inspects that same captured receipt and verifies its job ID before publishing; no second unchecked read. Missing configured roots, wrong-job receipts, changed bytes and stale/foreign actions fail without mutation.
- UI: selected-shot jobs with persistent revision/status, explicit video intent form (ID, route label, model label, prompt, dimensions/fps/frames and reason), and per-job receipt form for nonterminal jobs when a results root exists. Progressive disclosure for creation keeps the shot review readable. No submit/generate/approve control. Model/route labels remain unqualified intent.
- Saved jobs are durable; shot review remains in-memory until downloaded. Reload session refreshes both. Failed writes keep typed input and offer explicit recovery; job failures do not block the shot inspector. Job status/error text is announced, source text uses textContent and all inputs have labels/native constraints.
- Preserve the running real inspector and real film choices. Browser QA uses an isolated synthetic store/root. Do not silently restart a session that might contain unsaved review changes; offer a separate operator start command for the new UI after delivery.

Files: new scripts/film-production/inspector-jobs.mjs, inspector-jobs.test.mjs, inspector-jobs-browser.mjs; new film-studio/inspector/jobs.mjs. Modify inspector server/CLI/app/styles, job-store receipt job binding, package test registrations and docs/TASKS.

Verification: RED→GREEN real HTTP + filesystem + actual DOM tests for durable preparation, stale review/store, CSRF/foreign requests, wrong-job/changed receipt refusal and no raw-path leaks; current inspector tests remain green. One bounded desktop/mobile browser QA round for forms, persistence/reload, stale recovery, keyboard/overflow and screenshots, then one correction confirmation if needed. Lint/format, root tests/reachability, independent review and documented delivery to a stacked draft PR in our fork.
