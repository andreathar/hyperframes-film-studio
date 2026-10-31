# Studio UX — Phase 1 delivery

Plan: `film-studio/STUDIO-UX-PLAN.md`, Phase 1 (Tasks 1.1-1.9). Local branch `film/studio-ux`, branched from `main` 4c4691d67. Nothing published.

## What changed for the video maker

- Every film value has a plain-language label and a one-line hint (`packages/studio/src/film/glossary.ts`).
- The Production panel is six steps that fold when done and open when current. A single **Next** card says what to do, and Prepare / Apply proposal always sit just under it.
- A blocked action stays focusable, does nothing, and says why, both in visible text and in a tooltip (`BlockedButton.tsx`, reasons from `actionReasons.ts`).
- Scene pattern choice: arrow keys, Home and End move the choice; the help is one line plus a "More" popover.
- Studio Select, Input, TextArea and Section are used throughout. No raw `<select>` or `<textarea>` remains in film. Film text, controls and buttons are at least 12px; shared Studio defaults are unchanged.
- An unsaved draft stays with the shot it was typed on.

## Code quality

- Panel types come from the film contracts (`ProjectShotViewV1`, `AssistantReadinessV1`). There are no re-declared `state: string` types.
- Pattern pin and proposal memory now live in state, not in render-time ref writes. The stale `picked` copy is gone.
- Unit tests pin brief editing, section fields and native choices. Duration and resolution accept only positive whole numbers.
- Session callbacks are stable, so memoised panels really skip redraws. The `react-hooks` rules are errors for film code.

## Verification (2026-10-31, worktree HEAD after 368e7c607)

| Check                                                                  | Result                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `cd packages/studio && bunx vitest run`                                | 732 files passed, 1 skipped; 8350 tests passed, 1 skipped, 16 todo |
| `bunx vitest run src/film src/components src/styles/tokenGate.test.ts` | 235 files passed, 1 skipped; 2744 tests passed, 16 todo            |
| `bun run --filter @hyperframes/studio typecheck`                       | exit 0                                                             |
| `bunx oxlint packages/studio`                                          | 0 warnings, 0 errors (1777 files)                                  |
| oxfmt, fallow, commitlint                                              | lefthook pre-commit, passed on every commit                        |

Reviews: one spec-and-quality review per task, with fix rounds where needed. A whole-branch review (verdict "with fixes": 3 Important, 0 Critical) was followed by one fix wave and a re-review, verdict Clean, 7/7 addressed.

Not verified: how the panels look in a running app. No reviewer judged the visual quality.

## Rulings made during execution

- 1.1: the type test is `types.test-d.ts`, run with `--typecheck`, because vitest type-checks only `*.test-d.ts`.
- 1.3: render-time setState replaces ref writes. React 19 can still drop that memory in an abandoned concurrent render. This is accepted because no film code uses transitions, Suspense or deferred values. The RED test was waived, because StrictMode does not lose ref writes in React 19.2. oxlint 1.64 has no rule that could guard this statically.
- 1.4: added a shared `TextArea` (marked `data-ui-input`), because no multiline Studio primitive existed.
- 1.5: fixed `Number("")` being accepted as 0 in duration and resolution, in source.
- 1.6:
  - Prepare and Apply proposal stay always visible.
  - Direction counts as done only once a brief is applied.
  - References is current until a brief exists.
  - The shared `Section` gained optional controlled `collapsed`, `onCollapsedChange` and `toggleLabel`, which avoids remounting a step mid-edit.
  - Inner groups are plain headings.
- 1.7: Send works when readiness is `limited`.
- Final wave:
  - Next became a BlockedButton.
  - Film controls were raised to 12px, using a new optional `itemClassName` on `ui/Select`.
  - Small film buttons were raised to 12px.
  - Fields are keyed by shot.
  - The proposal hint now says editing does not apply a proposal.
  - Pattern became a plain `h4` group.
  - The step glyph is `aria-hidden`.

## Follow-ups, not done in Phase 1

- **Glossary sweep:** `SECTION_TERMS` is unused. Raw labels remain in `ShotSummary`, `NativeParameters` and the status literals in `steps.ts`. `missing-cli` hard-codes Codex; interpolate the provider in Phase 3.
- **Before Phase 2.4 (clip follows shot):**
  - key fields on `brief.shotKey` as well as the shot;
  - have the host route a commit by the written `brief.shotKey`, and document it in `types.ts`;
  - add a positive assertion to the draft-isolation test.
- **Remaining 11px and 10px text:** the Pattern "More" popover uses the Popover default (11px); the blocked-reason tooltip uses 10px.
- **Accessibility:**
  - prompt section titles are `h3` under step `h3`;
  - panel roots carry `aria-label` with no role;
  - the pattern-help tooltip and role hints have no `aria-describedby`;
  - TextArea lets a caller's `onBlur`/`onKeyDown` override its commit.
- **Missing tests:**
  - Home and End keys;
  - `useFilmSession` callback identity;
  - that the hook lint rule actually fires;
  - a blocked Next must not call `onNextStep`;
  - a Select change must reach `onBriefChange`.
- **Robustness:**
  - a 400-digit duration becomes `Infinity` (guard with `Number.isSafeInteger`);
  - schema bounds are not checked;
  - Input and TextArea duplicate their draft logic (extract a `useDraft` hook).
- **Test hygiene:** non-film editor tests make happy-dom iframe requests to `localhost:3000`, which fail with `ECONNREFUSED`. They should be stubbed to keep tests network-free.
