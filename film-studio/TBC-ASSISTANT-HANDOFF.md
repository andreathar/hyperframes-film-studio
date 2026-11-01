# tbc assistant slice: handoff to the coordinator

On `main`. Feature commit `227b2c96b`, on top of UX phase 1 (`film/studio-ux`, merged into `main` with it).
This is the Studio half of tbc-forge Plan 2 (`docs/superpowers/plans/2026-10-31-studio-read-api.md`, Task 9 there). The tbc-forge half (`tbc serve`, assistant and apply routes) is on tbc-forge's `main`.

## What it adds

All new code lives in `packages/studio/src/film/tbc/`. The plan named a single file, `film/tbcSession.ts`; a folder keeps the client, the hook, the panels and their tests together.

| File                                   | Role                                                                                                                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                             | Wire types copied by hand from tbc-forge (`ShotContextV1`, `TurnV1`, `CheckedProposal`, `ApplyResult`, health, shot rows). Studio does not import from tbc-forge.                                                                                     |
| `client.ts`                            | `tbcClient(baseUrl, fetcher)`: every route on `tbc serve`, with shape guards. Base URL is `VITE_TBC_URL`, default `http://127.0.0.1:4317`. Stores the CSRF token from `/api/health` and refuses to POST before it has one. Uses `studioApiFetch`.     |
| `useTbcSession.ts`                     | Probes `/api/health` on mount: `probing`, `offline` or `connected`. Loads shots and a shot context, sends a turn frozen to the shown revision, polls it with `?after=<n>`, cancels it, applies one proposal at a time and reloads on a 409.           |
| `TbcProductionPanel.tsx`               | Shot picker (beat · status · blocked), beat/feeling/eyeline, lines and neighbours, continuity set with look-state badges and thumbnails of locked views, checks, the explained prompt with each segment's source.                                     |
| `TbcAssistantPanel.tsx`                | Readiness from health, instruction, Send, Cancel reply or Clear, streamed reply, proposal cards (preset-edit before/after, look-draft, batch-draft, note) with issues and the preview prompt, Apply with a stated reason when blocked, apply outcome. |
| `TbcParts.tsx`                         | Issue list, prompt list, look badge.                                                                                                                                                                                                                  |
| `client.test.ts`, `tbcPanels.test.tsx` | Fake fetch and a scripted in-memory `tbc serve` (`tbcFixtures.ts`).                                                                                                                                                                                   |

`FilmDockPanels.tsx` uses the tbc panels when `tbc serve` answers and the existing film-production panels (with the clipboard handoff) otherwise. The disconnected path is unchanged.

Rules the panels hold:

- Apply is offered only when tbc marks the proposal applicable and the reply was written for the shot and revision on screen. A reply for another shot or an older revision stays a read-only draft and says why (`staleReasonOf`).
- A batch draft is never applied from Studio ("Batches are drafted with tbc batch, never from here.").
- A note has nothing to apply.
- When tbc refuses an apply (409 stale, 422 with issues), the card shows the reason and the issues.
- Nothing in Studio locks a look, approves, passes an approval id or picks a take.

## Checks run at `227b2c96b`

From `packages/studio`:

```bash
bunx vitest run src/film                 # 14 files, 138 tests pass
bunx vitest run                          # 734 files pass, 1 skipped; 8365 tests pass
bunx tsc --noEmit                        # exit 0
```

From the repository root: `bunx oxlint packages/studio` (0 warnings, 0 errors). `bunx oxfmt --check packages/studio/src/film` exits 0. `fallow audit --base origin/main --fail-on-issues` reports no issues in 59 changed files. The lefthook pre-commit (lint, format, fallow, typecheck) passed on the commit.

Smoke test against a real server: `tbc serve projects/andre-time-travel/manifest.json --port 4399 --no-assistant` from tbc-forge, then this branch's `client.ts` called it with Origin `http://127.0.0.1:5190`. Health, 41 shot rows and the G-01 context (beat E1, feeling calm, 6 continuity entities, 5 prompt segments, 7 issues) all passed the client's shape guards. Not exercised against a real server: POST routes, a real assistant turn (that would run the signed-in Claude CLI) and look thumbnails (no look is locked yet).

## Setup a fresh checkout needs

The vitest config resolves workspace packages through their `node` export, which points at `dist/`. Build these first, in this order:

```bash
cd packages/parsers && bun run build
cd ../lint && bun run build
cd ../core && bun run build        # also generates src/generated/*-inline.ts that tsc needs
cd ../studio-server && bun run build
```

## Running it

1. In tbc-forge: `bun packages/cli/src/main.ts serve projects/andre-time-travel/manifest.json` (port 4317, loopback only). Studio's dev origin `http://127.0.0.1:5190` is allowed by default (tbc-forge `67e077d`).
2. In hyperframes-film-studio: `cd packages/studio && bun run dev`, then open `http://127.0.0.1:5190`. Use the same host spelling: `localhost` and `127.0.0.1` are separate origins, and both are allowed.

## Not in this slice

Unbound-mention handling, ingest, reviewers (tbc-forge Plan 3) and a Codex runner.
