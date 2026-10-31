# Film production code review

- codeQualityStatus: WATCH
- recommendation: APPROVE
- Scope: uncommitted scripts/film-production/{manifest.mjs,prepare.mjs,cli.mjs,manifest.test.mjs}, package.json registrations, film-studio/README.md, docs/guides/film-production.mdx in /mnt/data/Projects_SSD/hyperframes-film-studio, branch feat/film-production.
- Goal: one-way local media preparation with correct source/timeline timing, contained inputs, new output only, and preserved edits.
- Plan consulted: film-studio/PLAN.md. No notepad/evidence paths supplied. Private media and render artifacts were not inspected.
- ULW status unavailable: omo-agent-toolkit runtime target missing; no .omo existed. This is the fallback report path.

## CRITICAL

None.

## HIGH

H1 — Container duration cannot prove selected stream coverage (the preparation module at historical lines 48 and 99–102, before package extraction).

The fallback `stream.duration ?? metadata.format?.duration` accepts a short audio/video stream whenever another stream makes the container long enough. Matroska commonly omits stream.duration. Independently reproduced with synthetic local FFmpeg media: 2s H.264 video plus 0.5s AAC audio in MKV, without -shortest. ffprobe reported video DURATION tag 00:00:02.000000000, audio DURATION tag 00:00:00.523000000, neither stream.duration, and format.duration 2.000000. A manifest containing a 48-frame picture clip and 48-frame audio clip at 24fps returned status prepared. Thus roughly 1.5 seconds of the declared dialogue is unavailable despite passing coverage validation.

Required: derive reliable selected-stream coverage or fail explicitly when it cannot be established; do not use container duration as proof of stream duration. Add a behavior regression using unequal stream lengths and missing stream.duration. The source coverage promise is core to this feature, so this blocks approval.

## MEDIUM

None.

## LOW

L1 — Missing coverage for concurrent destination reservation and non-unit playback rates (scripts/film-production/manifest.test.mjs). Existing tests cover prior edited destinations, but not a competing writer during preparation or rate-scaled successful/failed source trims. These are useful follow-up regression cases, not independently demonstrated production failures. Publication uses an exclusive mkdir followed by rename, and cleanup uses rmdir rather than recursive deletion of output; no ordinary overwrite flaw was found by inspection.

## Verification and skill perspectives

Independently ran `node --test scripts/film-production/manifest.test.mjs`: 19 passed, 0 failed, 0 skipped. Inspected full new source/tests/docs and package registration diff. Confirmed playback-rate range 0.1–10 matches packages/parsers/src/mediaDuration.ts. Synthetic reproduction above used only a newly created temporary directory and removed it afterward. No full suite or services were started. Root's larger-suite/browser/render claims are not independently verified here.

Requested remove-ai-slops and programming skills were not in the available skill catalog and could not be found in local agent/Codex skill directories or plugin cache. Applied the criteria explicitly supplied in the reviewer instructions instead. No deletion-only, requested-removal, tautological, prompt-string, or constant-mirroring tests were found. The DOM timing and real filesystem/hash/probe tests exercise meaningful behavior. Manifest validation is justified at the external JSON boundary; no needless extraction/normalization or abstraction was found. The two skill perspectives show no separate violation, but H1 identifies inadequate semantic validation of actual stream coverage.

Read using-superpowers; its subagent exception applies. Memory quick search returned no relevant film-preparation guidance, and AKB recall returned unrelated code-review-graph information that was not used.

## Blockers

- H1: reject or correctly measure unknown individual stream coverage, and demonstrate the short-stream regression is fixed.

## Focused re-review — H1 resolved

Inspected the revised source and new synthetic regression. prepare.mjs now uses only Number(stream.duration), rejecting absent/non-finite/non-positive duration rather than trusting container length. This closes H1 conservatively. Formats whose streams lack duration metadata may be rejected even when their media would cover the edit; this is the intended fail-closed limitation, not a remaining blocker.

Independently reran `node --test scripts/film-production/manifest.test.mjs`: 20 passed, 0 failed, 0 skipped, including the unequal-length MKV regression. Existing valid MP4 preparation and edit-preservation tests still pass. The regression verifies refusal and absence of published output using actual media, with no brittle source matching or implementation constants. Note that the MKV also lacks video duration, so rejection can occur on the picture clip first; this is consistent with the chosen policy of refusing any unknown stream coverage.

Final codeQualityStatus: WATCH (only prior LOW follow-up coverage suggestions remain).
Final recommendation: APPROVE.
Final blockers: none. The earlier H1 section above records the original finding and is superseded by this re-review.
