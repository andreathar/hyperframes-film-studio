# Explicit candidate placement delivery

`film:place` now connects replay-checked candidate selections and an authored frame-based cut plan to a new editable composition. `--describe` exposes current binding values/selections; preview validates the records/plan without reading media; explicit workspace/output preparation copies current confined bytes, verifies hashes and uses the existing preparer for actual stream/duration checks.

Shot order, take identity, timings, trims, rate, audio tracks and volume remain explicit. Internal aliases satisfy Hyperframes ID rules while original identities, full source shot notes, line IDs and hashes remain in the generated placement.json file. Direction data that cannot project into the existing manifest is retained with diagnostics. Existing outputs, source records and review/job files are never replaced by the operation.

## Verified evidence

- 148 film tests passed, including 23 placement-specific checks; zero failures/skips.
- Root scripts: 1,007 Node +109 Vitest tests passed (1,116 total).
- Reachability, lint, formatting and diff checks passed.
- Actual synthetic CLI: selected take → explicit two-picture cut with a separate 36-frame L-cut audio clip → portable 48-frame/24 fps composition. Source bytes and saved review were unchanged; existing output was refused on retry.
- Generated composition: Hyperframes lint passed (zero errors/warnings); browser check ran and passed runtime, layout, craft and audio checks with no findings. Motion sampling was disabled for this media-only fixture; contrast sampled no text. CLI emitted a skill-freshness advisory, without a composition failure.
- Snapshots at 0.5 and 1.25 seconds were visually inspected. They show the explicitly trimmed first source and second picture at the expected sides of the cut. No rendered-master timing or artistic acceptance claim is made.
- Independent review approved within the documented trusted/stationary filesystem boundary and found one test-quality issue. The invalid-line-ID fixture was failing at stale source binding; the intended error assertion reproduced that weakness, then the fixture was rebuilt/rebound and now proves actual line-ID rejection. No second independent review was performed.
- The existing real inspector remains revision zero, and all seven imported source documents still match their captured hashes. No real film take/order/trim choices were authored by this work.

Private synthetic media, snapshots, logs and review artifacts remain ignored. Linux descriptor verification, the existing FFmpeg/ffprobe tools and trusted stationary workspace/export ancestors are required. Failures may retain private scratch for inspection; same-user adversarial directory relocation is outside the absolute zero-write guarantee.

## Tasks and continuation

Before implementation, the Board was reconciled against tracked plans, delivery limits, worktrees and both existing PRs. Eleven missing backlog cards were added: live Kling qualification, release binding, result binding, dialogue/motion compiler, Higgsfield adapter, ComfyUI adapter, local model adapter, Studio integration, render timing parity, concurrent preparation checks and film exchange acceptance. Existing cards were preserved and reused.

[PLACEMENT.md](PLACEMENT.md), [TASKS.md](TASKS.md), README, the film-production guide and command index describe the new workflow and remaining work. The tracked checklist now matches the expanded Board scope. Placement is a new candidate edit, not automatic synchronization into an existing human timeline or creative approval. Standalone music/room tone still uses the existing manifest authoring path.
