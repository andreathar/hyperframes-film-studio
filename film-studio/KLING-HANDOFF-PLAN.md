# Kling producer handoff implementation plan

> Continue inline with superpowers:executing-plans and test-first implementation; one independent review at the end.

Goal: export a prepared video job as a blocked candidate for the existing Movies_Projects Kling producer release runner. This advances the approved adapter roadmap without creating a second submission path.

Architecture: Node/Bun, existing job/review services, shared Linux descriptor-bound local media verification. No new vendor runtime; Python 3 standard-library serialization is used for exact producer fingerprint parity. New scripts/film-production/kling-handoff.mjs and kling-handoff-cli.mjs; tests in kling-handoff.test.mjs; docs in film-studio/KLING-HANDOFF.md and TASKS.md plus guide/command index.

## Contract

- Accept one replay-checked prepared kling-cli video job at explicit expectedRevision and request fingerprint. Use its existing prompt/model, shot and direction/line IDs; no implicit creative choices. Require a current saved review with the same shot reference assignments and mapping as preparation. Unrelated review changes are allowed.
- Explicit settings select text_to_video, image_to_video or omni_ref_video, args (strings only) and inputSlots mapping provider slot names to assigned reference IDs. Every assigned reference must be represented. No automatic Element registration, URL upload, motion-control compilation or mixed media inference.
- Refuse duplicate/unsafe/reserved argument aliases. Require explicit duration matching frames/fps, aspect_ratio matching width/height, resolution matching the intended short edge, and imageCount=1. These are local consistency checks, not live model validation. Edit fps is retained as intent; native provider fps is unverified.
- Check reference paths/bytes inside the explicit canonical workspace and film subdirectory using the existing opened-descriptor boundary. Never copy media or rewrite source paths. Shared inputs outside the canonical film are blocked rather than relocated. Unknown/missing/archived references fail.
- Produce runner-spec.json (one-element job array) and handoff.json (provenance, effective settings hash, canonical producer payload fingerprint, current reference hashes). The canonical producer fingerprint is distinct from the coarse job intent fingerprint. Optional shotContract JSON is retained in the payload; its semantics require the producer's existing preflight.
- Always auth=null, submissionBlocked nonempty and executionAllowed=false. No runner command is executed by the product. No approvals, quotes, account/capability assertions, credentials, timeline edits, store mutations or provider calls. The packet is not a durable binding of a live request to the ledger; activation and automatic receipts require later work.
- CLI film:kling-handoff requires --import --store --review --job --expected-revision --request-fingerprint --settings --workspace --film; default stdout preview only, optional --output must create a new directory outside the canonical workspace. Preserve existing destinations and partial-output evidence on I/O failure.

## Verification tasks

1. Write tests first for provenance, blocked output, exact native settings, explicit reference mapping, stale/foreign source/review/fingerprint, wrong route/state, reserved flags, dropped references, changed media and path escape. Observe RED, implement compiler, expect GREEN.
2. Test actual CLI preview/new output, no-overwrite and canonical-workspace write refusal. Observe RED, implement CLI/export, expect GREEN. Test producer-compatible fingerprint with independent Python JSON/hash logic; privately compare an exported synthetic candidate to the current canonical kling_release.fingerprint and assert the existing runner rejects it before a provider sentinel can be invoked.
3. Document schemas, required producer gates, limitations and tracked tasks. Run fresh-worktree build, film tests, root script suite, reachability, lint/format and diff checks. Final independent review; reproduce/fix important defects; publish isolated branch as a stacked draft PR against feat/film-production, preserving the original staged research/review files.

Review focus: field loss between intent and native arguments; payload hash parity; stale review/reference context; path and byte drift; output isolation and accidentally executable export. Export assumes trusted non-relocating ancestors; detected relocation before/during writes must fail rather than return a stale success path. A same-user actor capable of moving open directories is outside the zero-write guarantee. No live provider behavior or cinematic acceptance is claimed.
