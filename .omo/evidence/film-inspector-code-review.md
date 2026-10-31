# Production inspector code review

- codeQualityStatus: CLEAR
- recommendation: APPROVE
- reportPath: .omo/evidence/film-inspector-code-review.md
- Scope: scripts/film-production/{inspector-server.mjs,inspector-cli.mjs,inspector.test.mjs}, film-studio/inspector/{index.html,app.mjs,style.css}, film-studio/INSPECTOR-PLAN.md.
- Goal: local companion UI with revision-bound in-memory review, bounded confined media previews, privacy projection, no source/provider writes.
- Separate fallback artifact preserves prior reviews. ULW runtime previously unavailable; no notepad supplied.

## CRITICAL

None.

## HIGH

H1 — POST body chunk decoding silently corrupts UTF-8 review input (inspector-server.mjs:165–168).

The request collector uses body += chunk on each Buffer. Buffers are independently converted to UTF-8 strings; a multibyte character split across HTTP chunks becomes replacement characters. Chunk boundaries are not text boundaries. This can corrupt source identifiers and, more seriously, successfully persist altered reasons in the downloaded review history without reporting an error.

Independently reproduced using a synthetic loopback HTTP test: a valid link-shot command with reason Intenção was split between the two bytes of ç and sent in two writes. Server returned HTTP 200; returned history contained Inten��ão instead of Intenção. No private records or operator service were used; the ephemeral test server was closed afterward.

Required: count raw bytes toward the limit and decode the complete bounded Buffer once, or use a streaming UTF-8 decoder that preserves incomplete codepoints. Add an HTTP regression splitting a multibyte codepoint and assert the exact persisted reason (and successful revision transition).

## MEDIUM

None.

## LOW

None requiring action in this scoped review.

## Verification and reviewed boundaries

Independently ran node --test scripts/film-production/inspector.test.mjs: 5 passed, 0 failed, 0 skipped. Inspected every requested file. Host and Origin checks reject foreign origins, proposals require JSON and session CSRF, CLI binds 127.0.0.1, browser requests select known record IDs rather than arbitrary paths, current preview bytes are hash checked after path confinement and size/type checks. Source text uses textContent. Raw source documents are omitted from the view. Revision conflicts retain the old client view with a reload instruction. Source freshness remains explicitly snapshot-based; reload is session reload, not source re-import.

The code does not write source/timeline/provider data. The sole persistence action is browser download. Independent real-browser desktop/mobile QA is outside this review; no visual acceptance claim is made here. No full suite or persistent service was run.

## Skill perspectives

remove-ai-slops and programming were unavailable in the earlier catalog/local skill search; applied their supplied reviewer criteria to these files. Existing HTTP and DOM tests check observable behavior rather than source strings or deletion assertions. The media/path/hash validation is appropriate at this HTTP/filesystem boundary; no needless abstraction or independent slop violation identified. H1 needs a transport-level behavior test, not an implementation-mirroring assertion.

## Blockers

- H1: preserve UTF-8 across request chunks so accepted review history retains the user's exact text.

## Focused re-review — H1 resolved

The request reader now counts raw Buffer lengths toward the 65536-byte cap, retains only accepted chunks, and decodes Buffer.concat(chunks) once after completion. This preserves valid UTF-8 characters across arbitrary network chunk boundaries and fixes the demonstrated review-history corruption.

Inspected the new HTTP regression: it deliberately splits inside ç in Intenção — reação, checks successful response, then fetches the persisted in-memory review and asserts exact original history text. This is relevant behavior coverage rather than an implementation assertion. Independently reran node --test scripts/film-production/inspector.test.mjs: 6 passed, 0 failed, 0 skipped. No new skill-perspective concerns.

Final codeQualityStatus: CLEAR.
Final recommendation: APPROVE.
Final blockers: none. Original H1 and blocker text above are historical and superseded by this re-review. Browser acceptance runner/visual QA remain outside this narrow check. No private or operator data accessed and no implementation edits made. The new regression was still compressed onto one line at inspection; routine repository formatting remains part of the executor's pre-commit checks.
