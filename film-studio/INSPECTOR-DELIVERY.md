# Production inspector delivery

The fork now includes a local companion inspector over its existing intake and review service. It displays imported shots, source direction, dialogue line IDs and declared states; supports shot search and source filtering; and provides explicit mapping, reference assignment, candidate selection and removal controls. Each proposal requires a reason, checks the current revision and remains a candidate review.

Session state is kept in memory and saved by downloading review JSON. An optional saved state can be replayed on startup against the same import. Local previews are limited to known media with confined real paths, supported types, bounded size and matching observed hashes. Source files, the edit timeline and provider services are unchanged by this screen.

## Verified behavior

- `bun run film:test`: 63 passed, zero failures or skips.
- `bun run test:scripts`: 922 Node tests and 109 Vitest tests passed.
- `node scripts/check-test-reachability.mjs`: zero orphan tests.
- Headless Chrome acceptance: desktop 1440×1000 and mobile 390×844, keyboard skip navigation, explicit mapping and candidate selection/removal, review download contents, session reload, stale-revision refusal and recovery, no horizontal page overflow or page errors. Light desktop/mobile and dark mobile screenshots were visually inspected.
- Independent code review: clear after fixing UTF-8 request chunks; the regression preserves the exact reason `Intenção — reação` across a split multibyte character.

The browser runner uses synthetic records and closes its own temporary browser/server. Screenshots and logs stay in ignored `.film-workspace/`. The software tests establish behavior; actual film content still needs producer review. No paid requests, model loads or provider submissions were performed.

## Review next

Use the [startup and persistence guide](INSPECTOR.md). Check the shot rail, direction notes and proposal forms against your imported film records. Download changes you want to retain. This is a companion screen; embedded Studio integration, provider job services and automatic review-to-timeline conversion remain subsequent work.
