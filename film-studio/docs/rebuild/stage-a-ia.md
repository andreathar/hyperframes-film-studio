# Stage A: information architecture and UI contract

Status: Stage A deliverable for Gate A (proposed, awaiting review). Branch `film-studio-rebuild`. Date 2026-10-31.
Author: Stage A (UI/UX). No React was written for this stage. This file is the only input contract for Stage B.

Scored against `BEST-PRACTICES.md` Gate A items A1 to A19. Section 13 is the self-score. Section 14 lists open questions.

## 0. How to read this

- IDs are stable so Gate B can trace to them: regions `R*`, dialogs `D*`, presets `P*`, smart hints `H*`, states `S*`, Stage B dependencies `DEP*`.
- "Producer" means the human who makes the film and never writes code. Every producer-facing control is a select, segmented control, switch, stepper or button. Free text exists only for dialogue (read-only here), scene titles, notes and the two filter boxes called out in section 13 (A1).
- Copy in quotes is final UI copy unless it says TBC. Preset wording that is written into the compiled prompt (the "stored phrase") is not decided here. Stage C maps each preset `id` to a phrase. Ids are stable, labels and hints are the Stage A contract.
- Signature interactions are not in this document. Section 12 reserves up to three slots for the Creative Director stage.

## 1. What the repo already has, and what that forces

Read before designing: `film-studio/PRODUCTION-DESIGN.md`, `film-studio/README.md`, `DESIGN.md`, `packages/studio/AGENTS.md`, `packages/studio/src/film/*`, the Studio dock (`components/dock/*`, `components/StudioRightPanels.tsx`), `components/ui/*`, `styles/theme.css`, `film-studio/inspector/*`, `packages/film-production/src/model.ts`, `legacy/import-movies.mjs`.

### 1.1 There is no schedule page

No page, file or string named "schedule" exists for film production (Gate 0 finding, re-checked: only unrelated thumbnail-scheduler and plan-wording hits). The nearest things are:

- The native `Production` and `Assistant` dock panels in `packages/studio/src/film/` (22 files, about 1.9k lines including tests), mounted by `FilmDockPanels` from `components/StudioRightPanels.tsx` (`<FilmDockPanels showToast={showToast} />`). Panel ids `production` and `assistant` are registered in `components/dock/panelRegistry.ts`, zone `right`, `reopen` next to `design`.
- The companion inspector (vanilla JS, separate server): `film-studio/inspector/{app.mjs,index.html,jobs.mjs,style.css}`. Out of scope for the rebuild UI. It is the source of one useful rule: reference assignment accepts only `mediaState === "verified"`.

So the "schedule replacement" in this document is a new surface, not a redesign of an existing page. Decision: a new third dock panel `schedule` (section 4.1). The Studio timeline and preview stay unchanged, as `PRODUCTION-DESIGN.md` requires ("keep preview, timeline, asset browser, undo and iframe chrome unchanged").

### 1.2 The existing Production and Assistant panels (what changes)

| Today (`src/film/`) | Problem for Gate A | Replace with |
|---|---|---|
| `ProductionPanel`: one scrolling column of `Block`s | No master-detail, no tabs (A4, A8) | Schedule panel (master) plus Production inspector with four tabs (R1, R2) |
| `PatternChoice`: five `role="radio"` buttons | Not a dropdown, no hints, no Custom (A5) | Coverage select `P-COVER` |
| `ReferenceRoles`: raw ids (`start-frame`) in a native select, raw `referenceId` as the row title | No thumbnail, source or state (A15), jargon (A1) | Reference picker `D3` with role labels `P-ROLE` |
| `PromptSections` / `FieldControl`: about 20 per-field `<textarea>`s (opening, framing, angle, path, light direction, atmosphere, locks, exclusions...) | Free text everywhere (A1) | Presets `P-*` plus one optional notes box |
| `DiagnosticsList`: raw `item.code` in mono | Jargon | Plain sentence plus "Go to field"; the code moves into a "Details" disclosure |
| `NativeParameters`: labels like `Duration frames`, `enum-<name>` | Jargon | Check tab "Account settings", labels from the humanising table in 6.12 |
| `AssistantPanel`: `Instruction` textarea, `Readiness {state} {evidence}` raw | Free text, jargon (D8 vocabulary shown raw) | Task select plus optional note, plain readiness `P-READY` |
| Buttons `Prepare`, `Apply proposal`, `Send`, `Cancel`, `Copy handoff`, `Apply` | Unclear (see 7.4) | Labels in 7.4 |
| `chrome.tsx`: `text-[11px]`, `neutral-*` classes | Sub-12px type, legacy neutral scale, no tokens by role | Section 3 |
| `useFilmSession`: stub host, "unavailable" readiness, toasts for blocked actions | Fine and honest | Keep the honesty; show the same states in the new UI (section 10) |

What stays: `Dock.Panel` mounting, `memo` panels taking props and callbacks only, the exact-dialogue rule (dialogue is rendered as exact text, never an editable field the pattern can rewrite), the "no proposal for this context" honesty, `useVisibleProposal` context isolation (a proposal never shows on a different shot).

### 1.3 Studio components to reuse (no new UI framework, B19)

`components/ui`: `Button`, `IconButton`, `Select`, `Tabs`/`TabsList`/`Tab`, `Tooltip`, `Menu`, `Popover`, `Toggle`, `NumberField`, `Input`, `SearchInput`, `useDialogBehavior`. Dock tabs already have `role="tablist"`, wrapping arrow keys and a "Maximize panel" button (`DockStripActions.tsx`), which is also the 400% zoom escape hatch (A18). Icons: Phosphor through the existing `IconContext`.

Gaps found (each becomes a Stage B dependency in section 15):

- `Select` options carry no hint line and the item row is `h-ctl-sm` (24px) with `truncate`. A5 needs a hint per option.
- `Tooltip` popup is `pointer-events-none`, so it cannot stay open under the pointer (A6 and WCAG 1.4.13 "hoverable" fail today).
- Global hotkeys claim Space, `f`, `s`, `r`, `k`, `g`, `z`, `j`, `l`, `m`, Delete and Cmd/Ctrl+Z unless the target is a typing target or `[role=slider]` (`utils/typingTarget.ts`, `hooks/appHotkeysDispatch.ts`). A listbox is not on that list. Undo/redo are global.
- `styles/hexRatchet.test.ts` fails the build on new colour literals outside `theme.css`. DESIGN.md hex values therefore cannot be pasted into film CSS (section 3).

### 1.4 Start commands found (for Stage B captures and the producer)

| Purpose | Command | Port | Source |
|---|---|---|---|
| Studio dev server | `bun run studio` (root `package.json`; runs `vite --host 127.0.0.1` in `packages/studio`) | Vite default, not pinned | `packages/studio/package.json` `dev` |
| Built CLI Studio preview | `node packages/cli/bin/hyperframes.mjs preview <dir> [--port <n>]` | default `3002` | `packages/cli/src/commands/preview.ts` |
| Companion inspector | `bun run film:inspect --import <import.json> [--state <review.json>] [--workspace <Movies_Projects>] [--port 9362]` | default `9362` | `scripts/film-production/inspector-cli.mjs` |

Port 1962 is not assumed. Neither 1962 nor 9361 is defined by any launch or config code in the repo; the only repo-defined 936x port is the inspector's `9362`. Raw text matches for those digits exist only in unrelated files (changelog, release notes, catalog JSON, compiled test output). The producer's 9361 preview is most likely `hyperframes preview --port 9361` or a Vite override. This design binds to neither.

## 2. IA table (A19)

One row per region. Gate B must map its component tree one-to-one onto these rows (B18). "Studio shell" rows already exist and are listed for completeness.

Conventions: `Tab` = Tab key. `Arrows` = arrow keys. A "tab stop" is one Tab press into the region.

| ID | Region | Purpose | Controls | Keyboard path | ARIA role |
|---|---|---|---|---|---|
| S0 | Studio dock tab strip (existing) | Switch between Schedule, Production, Assistant and other panels | Dock tabs, "Maximize panel", panel menu | `Tab` to the strip, `Left/Right` move and activate (wraps), `Home/End` | `tablist` / `tab` (existing, `dockAccessibility.ts`) |
| R1 | Schedule panel (dock id `schedule`, zone `left`) | Master list of all scenes; see state, choose a scene, run its next action | Panel region wrapper | Enter by `Tab` from the dock strip, order R1.1 → R1.2 → R1.3 | `region`, `aria-label="Schedule"` |
| R1.1 | Schedule toolbar | Filter, rebuild from script, undo/redo, scene count | "Show" select, "Update from script" button, "Undo", "Redo", count text | `Tab` through the four controls in that order; select opens with `Enter`/`Space`/`Alt+Down`; `Esc` closes | `toolbar` (`aria-label="Schedule actions"`), `combobox`, `button` |
| R1.2 | Asset-folder banner | Say plainly when the asset folder is unset, missing or unreadable | Message, "Check again", "Setup details" | `Tab` after the toolbar (only when shown); details opens a popover, `Esc` closes and returns focus | `region` (`aria-labelledby` the message), details `dialog` |
| R1.3 | Scene list | One row per scene with state, title, next action and reason | Rows. Row menu via keyboard or the "More" button | One tab stop (roving `tabindex`). `Up/Down` move and select, `Home/End` first/last, `PageUp/PageDown` ±10, digits type-ahead to a scene number, `Enter` runs the primary action, `Shift+F10` or `ContextMenu` opens the row menu, `Alt+Up/Alt+Down` move the scene, `Delete` clears the scene (undoable), `Cmd/Ctrl+Z` undo (only while focus is in R1) | `listbox` (`aria-label="Scenes"`, `aria-orientation="vertical"`) / `option` (`aria-selected`, `aria-posinset`, `aria-setsize`, `aria-describedby` next-action text) |
| R1.4 | Scene row "More" and row menu | Scene actions without dragging | Menu items: "Draft this scene", "Move up", "Move down", "Move to position...", "Duplicate scene", "Clear scene", "Remove scene" | Row menu opens from `Shift+F10`/`ContextMenu`/the "More" button; `Up/Down` move, `Enter` choose, `Esc` close | `menu` / `menuitem` |
| R1.5 | Schedule empty state | No scenes yet: one action | "Create scenes from script" button, one-line reason | `Tab` after the toolbar | `region` with heading; button |
| R1.6 | Live status | Announce progress, errors, counts | Visually hidden text | none (not focusable) | `status` (`aria-live="polite"`, `aria-atomic="true"`) |
| R2 | Production panel (dock id `production`) | Inspect and edit the selected scene with presets | Panel region wrapper | Enter by `Tab` from the dock strip | `region`, `aria-label="Production"` |
| R2.1 | Scene header | Which scene, its state, step to neighbours | Heading "Scene 12 of 100", state label, "Previous scene", "Next scene" | `Tab`: Previous, Next. The heading is `tabindex="-1"` so "Open in Production" can move focus to it | `heading` level 2, `button`, `status` text for the state |
| R2.2 | Inspector tabs | Four sections: Scene, Look, References, Check | Tabs | `Tab` into the tablist (one stop), `Left/Right` switch and activate, `Home/End` | `tablist` (`aria-label="Scene sections"`) / `tab` / `tabpanel` |
| R2.3 | Scene tab | Script line, who, where, action, length, coverage, notes | Exact line (read-only text), title field, "Who is in this scene" multi-select, "Place" select, "Action" step list, "Scene length" select, "Coverage style" select, notes box | `Tab` in reading order inside the panel | `tabpanel`, `group`s with visible labels |
| R2.4 | Look tab | Camera, lens, light, mood, sound, continuity | Selects `P-SIZE` ... `P-MOOD`, "Sound plan" segmented, "Background sound" select, five continuity switches | `Tab` in reading order; selects as in R1.1 | `tabpanel`, `combobox`, `radiogroup`, `switch` |
| R2.5 | References tab | Bind reference assets to this scene | Bound references list, per-row "Role" select and "Remove link", "Add a reference" button, "Still needed" list with "Save the need" | `Tab` in reading order; "Add a reference" opens D3 | `tabpanel`, `list`, `combobox`, `button` |
| R2.6 | Check tab | What is missing, what is blocked, account settings, written prompt | Check list with "Go to field" buttons, "Account settings" selects, "See the written prompt" disclosure | `Tab` in reading order | `tabpanel`, `list`, `button` (`aria-expanded`) |
| R2.7 | Action bar | The scene's primary action, always reachable | One primary button (label by state), "Ask the assistant to help" secondary | Last stop in the panel; also reached from the list with `Enter` | `group` (`aria-label="Scene actions"`), `button` |
| R3 | Assistant panel (dock id `assistant`) | Ask for suggestions, review them, use or dismiss | Panel region wrapper | Enter by `Tab` from the dock strip | `region`, `aria-label="Assistant"` |
| R3.1 | Assistant status | Plain-words provider readiness | Provider select, status line with icon, "Check again" | `Tab`: provider select, Check again | `status`, `combobox`, `button` |
| R3.2 | Working-on card | Frozen target of the next request | Text "Scene 12, revision 4" | none | `group` (`aria-label="Working on"`) |
| R3.3 | Request form | Choose what to ask and where | "What should it do?" select, "Apply to" select, "Add a note (optional)" box | `Tab` in reading order | `form`, `combobox`, `textbox` |
| R3.4 | Request actions | Send, stop, hand off | "Ask the assistant", "Stop", "Copy for Claude or Codex" | `Tab` in that order | `group`, `button` |
| R3.5 | Suggestions | Review one suggestion against the current scene | Per-group checkboxes (Look, Action, Sound, Continuity), side-by-side dialogue check, "Use this suggestion", "Dismiss" | `Tab` in reading order | `region` (`aria-label="Suggestion"`), `checkbox`, `button` |
| D1 | Dialog "Create scenes from script" | Turn the script into empty scenes in one action | "Script source" select, "Split into scenes by" select, preview summary, "Create N empty scenes", "Cancel" | Modal; focus to the first control, `Tab` cycles, `Esc` cancels, focus returns to the opener | `dialog` (`aria-modal="true"`, `aria-labelledby`) |
| D2 | Dialog "Update from script" | Linked rebuild with a confirmed count of edited scenes | Summary counts, "Edited scenes" radio group, "Update schedule", "Cancel" | As D1 | `dialog`, `radiogroup` |
| D3 | Dialog "Pick a reference" | Choose one reference with thumbnail, kind, source and state | Filters (kind, source, show), "Find by name", list of references, "Use in this scene", "Cancel" | As D1; list is one tab stop with `Up/Down`, `Home/End`, `Enter` chooses | `dialog`, `listbox` / `option` (`aria-disabled` for unusable) |
| D4 | Dialog "Move scene" | Place a scene at a number without dragging | "New position" stepper, "Move scene", "Cancel" | As D1 | `dialog`, `spinbutton` |
| D5 | Popover "Asset folder details" | Diagnostics for whoever runs the computer | Folder list with reason per folder, "Check again" | `Tab` into popover, `Esc` closes, focus returns to the "Setup details" button | `dialog` (non-modal) |
| G1 | Hint (inline) | Persistent one-line guidance under a field | Text | none; always in the accessibility tree | plain text referenced by `aria-describedby` |
| G2 | Tooltip | Extra explanation for icon-only controls and abbreviations | Text bubble | Shows on hover and on keyboard focus, `Esc` dismisses, stays open while pointer is over it | `tooltip` (`aria-describedby` on the trigger) |
| G3 | Toast with undo | Confirm a change and offer undo | Message, "Undo", "Dismiss" | Not focus-stealing; "Undo" reachable by `Tab` while visible and via R1.1 | `status` for the message, `button` |

The region holding the Studio preview, the Studio timeline and the Studio undo history is untouched.

## 3. Visual system: DESIGN.md tokens only

### 3.1 Role names and how they are implemented

DESIGN.md defines brand tokens by hex. Studio does not use those names; it defines its own roles in `styles/theme.css` (`--color-*`, `--text-step-*`, `--spacing-ctl*`, `--radius-*`) and `hexRatchet.test.ts` forbids new colour literals elsewhere. The contract: **the spec speaks in DESIGN.md roles; Stage B implements each role only through the Studio token in the right-hand column, never a hex literal.** Fonts and radius/spacing follow DESIGN.md directly.

| DESIGN.md token | Role in film panels | Studio token (Stage B uses this) |
|---|---|---|
| `--bg` | Panel background | `--color-bg-0` |
| `--surface` | Cards, rows, dialogs, popovers | `--color-surface` (popups: `--color-raised`) |
| `--surface2` | Selected row, tab strip, inset areas | `--color-hover` wash on `--color-surface`, `--color-on` for selected |
| `--border` | Separators only | `--color-border` |
| `--border-light` | Hover/active separator | `--color-border-strong` |
| `--text` | Primary text | `--color-text-0` |
| `--text-secondary` | Labels, hints | `--color-text-muted` (documented 4.5:1) |
| `--text-tertiary` | **Never for text.** Disabled-control text only | `--color-text-off` |
| `--heading` | Headings, focus ring | `--color-text-0`, ring `--color-ring` |
| `--accent-green` | Ready, verified | `--color-accent-ink` |
| `--accent-blue` | Drafted, informational | `--color-selection` |
| `--accent-purple` | Not used | none |
| (no DESIGN.md token) | Blocked, error | `--color-danger-ink` (Studio role; see OQ-2) |

Fonts: `--font-body` (Inter) for UI text, `--font-mono` (IBM Plex Mono) for ids and short hashes. The Studio dock inherits `--font-sans`; film panels set `font-family` through the Studio `font-sans`/`font-mono` utilities and the DESIGN.md stacks are the intended families (OQ-3 asks whether Inter must be bundled).

### 3.2 Contrast facts that constrain the design (A11)

Computed from the DESIGN.md hex values (WCAG relative luminance). Studio equivalents must be measured again in Stage B (computed styles in a real browser, light and dark).

| Pair | Light | Dark | Rule |
|---|---|---|---|
| `--text` on `--surface` | 17.4 | 14.6 | OK for all text |
| `--text-secondary` on `--surface2` | 4.55 | 6.66 | OK for hints and labels on every surface |
| `--text-tertiary` on `--surface` | 2.85 | 3.21 | **Fails 4.5.** Not used for text |
| `--border` on `--surface` | 1.33 | 1.28 | **Fails 3:1.** Separators only, never a control boundary |
| `--accent-blue` on `--surface2` | 4.41 | 4.73 | **Fails 4.5 on light surface2.** No blue text on surface2 |
| `--accent-green`, `--accent-purple` on any surface | 4.68 to 5.70 | 6.40 to 8.08 | OK |

Consequences: (1) a form-control boundary uses the `--text-secondary` role (Studio `--color-text-muted`, about 5.2 to 8.2:1 in Studio's oklch values), not `--border` and not Studio's `--color-border-input` (a 14 to 15% wash of text, far under 3:1); (2) the focus ring is 2px in the heading role with 2px offset; (3) status is never colour alone, so no state depends on hue (3.4).

### 3.3 Type, spacing, radius, motion

- Text: body 0.82rem (DESIGN.md Caption) so the panel is at least 13px; hints and labels 0.82rem in `--text-secondary`; ids and hashes 0.75rem mono; headings 1rem weight 600. No text under 12px (existing `text-[11px]` is retired for film panels).
- Spacing from DESIGN.md `xs 4`, `sm 8`, `md 16`, `lg 24` only. Panel padding `md`. Gap between fields `sm`; between groups `md`.
- Radius: `sm 4` badges, `md 6` buttons and inputs, `lg 8` cards, dialogs and the banner.
- Elevation: borders over shadows. Only popups (menu, select list, tooltip, dialog) use Studio's `shadow-menu`/`shadow-popover`, as Studio already does.
- Targets: every control at least 28px high (Studio `h-ctl`), rows and list options at least 40px. Nothing below the WCAG 2.5.8 floor of 24px.
- Motion: 150 to 200 ms, `ease`/`ease-out`, only on hover, press, focus, popup open/close. `prefers-reduced-motion: reduce` removes all transitions and replaces any spinner with static text "Working..." plus the pending icon (A18).

### 3.4 State vocabulary: text plus icon, never colour alone (A2)

Each state has a distinct icon shape, a text label and a plain-language definition. Hue is an optional reinforcement. Phosphor icon names are proposals.

| State | Icon (shape) | Label | Hue role | Meaning |
|---|---|---|---|---|
| empty | dashed circle (`CircleDashed`) | "Empty" | `--text-secondary` | A scene exists from a script line. No brief has been started. |
| drafted | half-filled circle (`CircleHalf`) | "Drafted" | `--accent-blue` | A brief exists but at least one required choice is still open. |
| ready | circle with check (`CheckCircle`) | "Ready" | `--accent-green` | No blocking issue, all required choices made. May carry a "Creative only" badge. |
| blocked | prohibition sign (`Prohibit`) | "Blocked" | Studio danger role (OQ-2) | At least one issue needs a decision before preparing (for example, "two camera moves at once"). |
| working (transient, not a fifth state) | circular arrow (`CircleNotch`), static in reduced motion | "Drafting..." | `--text-secondary` | A request for this scene is running. Scoped to this row only (A12). |

Precedence when several apply: blocked beats drafted beats ready; empty only when there is no brief. "Required choices" are: coverage style, shot size, lens, light type, mood, scene length. A missing reference never blocks and never gets a fake default: it keeps the scene "Ready" with the badge "Creative only: 1 reference needed" (C11, A16). A pending request adds the working marker next to the state label and does not change the stored state.

## 4. Wireframes

ASCII only, checked in so they diff. Width 56 columns for a panel at about 360px. `[ ]` button, `[v]` select (the `v` is the chevron), `( )` radio, `[x]` switch on, `<...>` text that changes. State glyphs in the list: `(-)` empty, `(~)` drafted, `(v)` ready, `(x)` blocked, `(..)` working. Message glyphs: `(i)` information, `(!)` warning. `>` marks the selected or highlighted row.

### 4.1 Where things live in the Studio shell

```
+-----------------+--------------------------------+-------------------+
| LEFT dock       | CENTER dock (unchanged)        | RIGHT dock        |
| [Schedule]      |  Preview                       | [Design][Layers]  |
|  Compositions   |  --------------------------    |  ...              |
|  Assets  Code   |  Timeline                      | [Production]      |
|  Catalog        |  (existing, untouched)         | [Assistant]       |
+-----------------+--------------------------------+-------------------+
 master list        picture + edit                    inspector + helper
```

Registry change (DEP1): `schedule` joins `PANEL_IDS`, zone `left`, `reopen: { near: "compositions", direction: "within" }`. `production` and `assistant` keep their ids and zone. A stored layout without `schedule` still parses (the panel is simply reopened from the Window menu or the layout default). Selecting a scene does not switch dock tabs; "Open in Production" does (focus moves to R2.1 heading).

### 4.2 Schedule, no scenes yet (R1, R1.5)

```
+----------------------------------------------------------+
| Schedule                              [Maximize] [Menu]  |  <- dock strip S0
+----------------------------------------------------------+
| Scenes: 0                                                |
|                                                          |
|   No scenes yet                                          |
|   Turn each script line into an empty scene.             |
|   Nothing is generated.                                  |
|                                                          |
|   [ Create scenes from script ]                          |
|                                                          |
+----------------------------------------------------------+
```

### 4.3 Schedule with 100 scenes, mixed states, folder banner (R1.1 to R1.4)

```
+----------------------------------------------------------+
| Schedule                              [Maximize] [Menu]  |
+----------------------------------------------------------+
| Scenes: 100   Show: [All scenes (100)             v]     |
| [Update from script] [Undo] [Redo]                       |
+----------------------------------------------------------+
| (i) Asset folder not configured.                         |
|     Scenes still work. References can't be picked yet.   |
|     [Check again] [Setup details]                        |
+----------------------------------------------------------+
| Scenes (list, 100)                                       |
|  (v) Scene 01  Galileo: "Good evening, gentlemen..."     |
|      Ready - Medium close-up, Candlelight, Tense         |
|      Creative only: 1 reference needed          [More]   |
| > (~) Scene 02  Newton: "You have not eaten."            |   <- selected
|      Drafted - 2 choices left: Lens, Mood                |
|      Next: Finish choices                        [More]  |
|  (-) Scene 03  Galileo: "The wine is from Padua."        |
|      Empty - Next: Draft this scene                      |
|      Choose how it looks, or let the assistant suggest.  |
|  (x) Scene 04  Newton: "Then explain the moon."          |
|      Blocked - Next: Fix "Two camera moves at once"      |
|      Pick one camera move.                      [More]   |
|  (..) Scene 05  Galileo: "It moves, as I said."          |
|      Drafting...                                         |
|  ... 95 more (virtualized; DOM holds visible rows only)  |
+----------------------------------------------------------+
```

Row anatomy (R1.3), top to bottom:

1. Line 1: state icon, scene number, title. The title is the script line's speaker and first words, truncated with an ellipsis (the full title is in the inspector).
2. Line 2: state label plus one fact. For ready scenes the fact is the chosen look in words; for others it is the next action as text.
3. Line 3 (empty, drafted, blocked only): the one-line reason. Ready scenes show "Creative only" or a reference count here.
4. Right edge: reference chip when relevant ("2 refs", "1 unavailable" with the unavailable icon), then "More".
5. Wide layout (panel at least 640px, for example maximized): adds columns Speaker, Length, Coverage, References, line id in mono.

Pointer behaviour: clicking a row selects it (the inspector updates; list scroll and focus are not touched, A4). Clicking the "Next:" text runs the primary action. Keyboard: `Enter` on the row runs the same action. The equivalent real button is the primary button in the inspector action bar (R2.7), so nothing is reachable only by pointer.

### 4.4 Production inspector, Scene tab, empty scene (R2.1 to R2.3, R2.7)

```
+----------------------------------------------------------+
| Production                           [Maximize] [Menu]   |
+----------------------------------------------------------+
| Scene 3 of 100            (-) Empty                      |
| [< Previous scene]  [Next scene >]                       |
+----------------------------------------------------------+
| [Scene] [Look] [References] [Check]                      |
+----------------------------------------------------------+
| Script line (exact words, can't be edited here)          |
| Galileo: "The wine is from Padua."          line L-003   |
|                                                          |
| Scene title (optional)                                   |
| [ The wine from Padua                              ]     |
|                                                          |
| Who is in this scene                                     |
| [ Galileo, Newton                                  v]    |
| Place                                                    |
| [ Choose a place                                   v]    |
| Choose from your project's places, or Custom.            |
|                                                          |
| Coverage style                                           |
| [ Choose a coverage style                          v]    |
| How the scene is shot, for example one face, or a hand.  |
|                                                          |
| Scene length                                             |
| [ Choose a length                                  v]    |
|                                                          |
| Action (one clear action per step)                       |
|  No steps yet.  [ Add an action step ]                   |
|                                                          |
| Notes (optional)                                         |
| [                                                  ]     |
+----------------------------------------------------------+
| [ Draft this scene ]   [ Ask the assistant to help ]     |   <- R2.7, sticky
+----------------------------------------------------------+
```

The sticky action bar never covers the focused control: the scroll container sets `scroll-padding-bottom` to the bar height so focus scrolls clear of it (A9).

### 4.5 Look tab, with one open dropdown (R2.4, G1, A5)

```
| [Scene] [Look] [References] [Check]                      |
+----------------------------------------------------------+
| Camera                                                   |
| Shot size   [ Medium close-up                      v]    |
|   +--------------------------------------------------+   |
|   | Extreme wide     Tiny figures in a big place.    |   |
|   | Wide             The whole room and everyone.    |   |
|   | Medium wide      People from the knees up.       |   |
|   | Medium           People from the waist up.       |   |
|   | > Medium close-up Head and shoulders.            |   |
|   | Close-up         The face fills the frame.       |   |
|   | Extreme close-up One detail: eyes, a ring.       |   |
|   | Insert           An object or hand, shown big.   |   |
|   | Over the shoulder Look past one person.          |   |
|   | Two-shot         Two people share the frame.     |   |
|   | Custom           None of these; say it in words. |   |
|   +--------------------------------------------------+   |
| Angle       [ Eye level                            v]    |
| Movement    [ Locked                               v]    |
|   The camera does not move.                              |
| Lens        [ Natural (about 35 mm)                v]    |
| Focus       [ Soft background                      v]    |
|                                                          |
| Light                                                    |
| Light type  [ Candlelight                          v]    |
| Direction   [ From the side, left                  v]    |
| (!) Candlelight is dim; a long scene may look dark.      |   <- smart hint H5
|                                                          |
| Mood and colour                                          |
| Mood        [ Tense                                v]    |
| Colour feel [ Warm amber                           v]    |
|                                                          |
| Sound                                                    |
| ( ) With the video  (o) I'll add it  ( ) No sound        |
| Background  [ Quiet room                           v]    |
|                                                          |
| Keep the same as the previous scene                      |
| [x] Era       [x] Clothes     [x] Table props            |
| [x] Seating and screen direction   [ ] Light             |
```

Each option row in an open dropdown is the label plus its one-line hint, at least 40px high, with the full hint (no truncation: wrap to two lines on narrow panels). The currently chosen option's hint also appears under the closed control, so the hint does not live only in the popup (A6).

### 4.6 References tab (R2.5)

```
| [Scene] [Look] [References] [Check]                      |
+----------------------------------------------------------+
| This scene's references                                  |
| +------------------------------------------------------+ |
| | [thumb] Galileo portrait            image            | |
| |         ref-galileo-01  3f9a12bc                     | |
| |         (v) Verified - Asset registry                | |
| |         Role [ Who it is (face and look)        v]   | |
| |         [ Remove link ]                              | |
| +------------------------------------------------------+ |
| | [ no   ] Newton, wine glass          image           | |
| | [preview] ref-prop-007  --------                     | |
| |         (!) Unavailable - file not found in the      | |
| |         asset folder. The link is kept.              | |
| |         Role [ An object in the scene           v]   | |
| |         [ Remove link ]                              | |
| +------------------------------------------------------+ |
|                                                          |
| [ Add a reference ]                                      |
|                                                          |
| Still needed                                             |
|  - Needs: Portrait of Newton               [ Remove ]    |
| Add a need: [Role v] of [Character v]  [ Save the need ] |
```

An unavailable reference keeps its id and shows "Unavailable" plus the reason (A17). It is never dropped silently. "No preview" is plain text in an empty box, never a sample image (A16). "Remove link" is the only way a link disappears, and it is undoable.

### 4.7 Check tab (R2.6)

```
| [Scene] [Look] [References] [Check]                      |
+----------------------------------------------------------+
| Checks                                                   |
|  (x) Two camera moves at once. Pick one.  [Go to Movement]|
|  (!) 1 reference needed (Newton portrait). The scene will |
|      be creative only.                    [Go to References]|
|  Still to choose: Lens, Mood              [Go to Lens]   |
|                                                          |
| Account settings                                         |
|  Shown when your account has been read. Not read yet.    |
|  [ Check again ]                                         |
|                                                          |
| > See the written prompt (read only)                     |
+----------------------------------------------------------+
| [ Fix: two camera moves ]   [ Ask the assistant to help ]|
```

With no blocking issue the primary button reads "Prepare for generation" and the line above it reads "Saves your plan. Nothing is sent or paid for."

### 4.8 Assistant panel, ready with a suggestion (R3)

```
+----------------------------------------------------------+
| Assistant                            [Maximize] [Menu]   |
+----------------------------------------------------------+
| Use: [ Codex (works inside Studio)                 v]    |
| (v) Ready                                  [Check again] |
| Working on: Scene 3, revision 4                          |
|                                                          |
| What should it do?                                       |
| [ Draft this scene                                 v]    |
| Fills every empty choice from the script line.           |
| Apply to                                                 |
| [ This scene                                       v]    |
| Dialogue is never changed.                               |
| Add a note (optional)                                    |
| [                                                  ]     |
| [ Ask the assistant ] [ Stop ] [ Copy for Claude or Codex]|
+----------------------------------------------------------+
| Suggestion for Scene 3                                   |
| Dialogue  Scene: "The wine is from Padua."               |
|           Suggestion: "The wine is from Padua."          |
|           (v) Dialogue unchanged                         |
| [x] Look  [x] Action  [x] Sound  [ ] Continuity          |
| Shot size: (empty)  ->  Medium close-up                  |
| Lens:      (empty)  ->  Portrait (about 85 mm)           |
| [ Use this suggestion ]  [ Dismiss ]                     |
+----------------------------------------------------------+
```

### 4.9 Assistant panel, not available

```
| Use: [ Codex (works inside Studio)                 v]    |
| (x) Assistant app not installed on this computer         |
|     You can still copy the request and paste it into     |
|     Claude or Codex yourself.            [Check again]   |
| ...request form stays usable...                          |
| [ Ask the assistant ] (disabled, says why)               |
| [ Copy for Claude or Codex ]  (works)                    |
```

"Ask the assistant" stays focusable with `aria-disabled="true"` and the reason in `aria-describedby`, so a keyboard or screen-reader user learns why. It does not simply vanish or grey out silently.

### 4.10 Reference picker, D3

```
+----------------------------------------------------------+
| Pick a reference for Scene 3                        [x]  |
+----------------------------------------------------------+
| Kind [All v]  Source [All v]  Show [Usable only v]       |
| Find by name [                                     ]     |
+----------------------------------------------------------+
| References (list, 14)                                    |
| > [thumb] Galileo portrait                               |
|   image - Asset registry        ref-galileo-01  3f9a12bc |
|   (v) Verified                                           |
|   [thumb] Table, evening, wide                           |
|   image - Import v2             ref-env-002     71cc0d9e |
|   (v) Verified                                           |
|   [no preview] Dinner ambience                           |
|   audio - Asset registry        ref-aud-003     --------  |
|   (!) Missing - file not found in the asset folder       |
|   (can't be used until the file is back)                 |
|   [thumb] Newton study                                   |
|   image - Review file           ref-newton-04   b0e1aa77 |
|   (!) Changed - file differs from its recorded checksum  |
|   ... Found, not verified / Invalid / Archived rows ...  |
|                                                          |
| Files not in the registry (14 hidden)  [Show] (can't be  |
| used: they have no registered id)                        |
+----------------------------------------------------------+
| Role [ Who it is (face and look)               v]        |
| [ Use in this scene ]  [ Cancel ]                        |
+----------------------------------------------------------+
```

The state glyph set in the picker is its own (state label text is always present): verified `ShieldCheck`, observed-unverified `Eye`, hash-mismatch `Warning`, missing `FileX`, invalid `XCircle`, archived `Archive`.

### 4.11 Asset-folder banner variants (R1.2)

```
unset:    (i) Asset folder not configured.
              Scenes still work. References can't be picked yet.
              [Setup details]

missing:  (!) Asset folder not found at <path>.
              Scenes still work. References can't be picked yet.
              [Check again] [Setup details]

denied:   (!) Asset folder can't be read at <path>.
              Check that this computer is allowed to open it.
              [Check again] [Setup details]

partial:  (!) 1 of 2 asset folders is unavailable: <path>.
              References from the other folder still work.
              [Check again] [Setup details]
```

The banner never carries a sample asset, a stand-in thumbnail or invented counts.

### 4.12 Create scenes from script, D1 and D2

```
+--------------------------------------------------+
| Create scenes from script                        |
+--------------------------------------------------+
| Script source                                    |
| [ Script already imported for this project     v]|
| Split into scenes by                             |
| [ One scene per script line                    v]|
| Preview                                          |
|  Found 98 script lines. 98 scenes will be made.  |
|  3 lines have no speaker. First: Galileo, ...    |
| [ Create 98 empty scenes ]  [ Cancel ]           |
+--------------------------------------------------+

+--------------------------------------------------+
| Update schedule from script                      |
+--------------------------------------------------+
| The script changed since the scenes were made.   |
|  92 scenes stay the same                         |
|  4 new scenes will be added                      |
|  2 scenes no longer have a script line           |
|  6 scenes you edited would be replaced if you    |
|  choose to replace them.                         |
| Edited scenes                                    |
|  (o) Keep my edits (recommended)                 |
|  ( ) Replace 6 edited scenes with the new script |
| [ Update schedule ]  [ Cancel ]                  |
+--------------------------------------------------+
```

### 4.13 Reflow at 400% zoom (A18)

At 400% zoom a 1280px window is 320 CSS px wide. The panels reflow to one column, nothing scrolls sideways, the same content stays reachable:

```
+------------------------+
| Production   [Maximize]|
| Scene 3 of 100         |
| (-) Empty              |
| [< Previous][Next >]   |
| [Scene][Look]          |
| [References][Check]    |  <- tab strip wraps to two rows
| Script line (exact)    |
| Galileo: "The wine..." |
| Scene title (optional) |
| [                  ]   |
| ...                    |
| [ Draft this scene ]   |
| [ Ask the assistant ]  |
+------------------------+
```

Rules: no fixed widths in the panels; row columns beyond title collapse (the wide-layout columns hide); buttons wrap; dialogs become full-screen sheets under 480px; "Maximize panel" gives a panel the whole viewport.

## 5. Slot states and next actions (A2, A3)

The primary action and one-line reason come from the state. The label is final copy. The same label is used on the list row (text), the row menu and the inspector action bar (real button).

| State | Primary action (label) | One-line reason | Opens |
|---|---|---|---|
| empty, no pending need | "Draft this scene" | "Choose how it looks, or let the assistant suggest." | Production, Scene tab, first unset choice focused |
| empty, with a pending reference need | "Pick a reference" | "Needs: portrait of Galileo." (the saved need) | Production, References tab, picker D3 open |
| drafted | "Choose <first open choice>" for example "Choose lens" | "2 choices left: Lens, Mood." | Production, tab holding that choice, field focused |
| blocked | "Fix: <first blocking issue>" | The issue in plain words, for example "Two camera moves at once. Pick one." | Production, Check tab, "Go to field" target focused |
| ready | "Prepare for generation" | "All checks pass. Nothing is sent until you release it." | Runs prepare for this scene (`onPrepare`) |
| any, request running | no new action | "Drafting..." in this row only | none |

Rules:

- One primary action per slot, never two. Secondary actions live in the row menu.
- An empty slot is never a blank box: it always shows the action and the reason on its own lines.
- State counts feed the "Show" filter: "All scenes (100)", "Empty (87)", "Drafted (9)", "Ready (3)", "Blocked (1)", "Needs a reference (12)". Changing the filter announces "Showing 87 of 100 scenes" through R1.6.

## 6. Preset and dropdown inventory (A5)

Every list ends with "Custom". Choosing "Custom" reveals one short box under the select, "Describe it in a few words" (up to 120 characters), which is a note, stored as prose intent. A hint is one line, at most about 70 characters. Ids are stable. The "Stored in" column is the `SceneBriefV1` field Stage C fills; it is informational.

The first option in every select is a non-choice, "Choose ..." (value empty), which keeps "unset" visible and counts as an open required choice. The select never silently picks a default.

### 6.1 Coverage style `P-COVER` (Stored in: `authoring.patternId`; `Custom` stores null)

| id | Label | Hint |
|---|---|---|
| restrained-dialogue | Restrained dialogue | Hold a readable face and let the line land. |
| listening-reaction | Listening reaction | Show who hears the line and how it changes them. |
| prop-hand-insert | Prop and hand insert | A hand and an object finish one action up close. |
| establishing-continuity | Establishing the room | Show the room, light and direction the next scene must match. |
| reference-led-motion | Follow a motion reference | Copy the movement from a reference; add no new camera idea. |
| custom | Custom | None of these. Describe it in a few words. |

These five ids and their meaning come from `SCENE_PATTERNS`. Labels are shortened for producers. Extra detail already in the repo (`cameraConstraint`, `soundConstraint`, required reference roles) is shown as the hint under the closed control and in smart hints H1 and H2, not as a second control.

### 6.2 Shot size `P-SIZE` (`camera.framing`)

| id | Label | Hint |
|---|---|---|
| extreme-wide | Extreme wide | Tiny figures in a big place. |
| wide | Wide | The whole room and everyone in it. |
| medium-wide | Medium wide | People from the knees up, with the room around them. |
| medium | Medium | People from the waist up. |
| medium-close | Medium close-up | Head and shoulders. |
| close | Close-up | The face fills the frame. |
| extreme-close | Extreme close-up | One detail: eyes, a ring, a ripple in the wine. |
| insert | Insert | An object or a hand, shown big. |
| over-shoulder | Over the shoulder | Look past one person at the other. |
| two-shot | Two-shot | Two people share the frame. |
| custom | Custom | None of these. Describe it in a few words. |

### 6.3 Angle `P-ANGLE` (`camera.angle`)

| id | Label | Hint |
|---|---|---|
| eye-level | Eye level | Neutral and honest, like standing there. |
| slightly-low | Slightly low | Looks up a little. The person feels confident. |
| low | Low | Looks up a lot. Powerful or imposing. |
| slightly-high | Slightly high | Looks down a little. The person feels smaller. |
| high | High | Looks down from above. Shows the layout. |
| overhead | Overhead | Straight down, like looking at the table top. |
| tilted | Tilted | The frame leans. Something feels off. |
| custom | Custom | None of these. Describe it in a few words. |

### 6.4 Movement `P-MOVE` (`camera.path`)

| id | Label | Hint |
|---|---|---|
| locked | Locked | The camera does not move. |
| push-in | Slow push in | Drifts closer. Attention tightens. |
| pull-back | Slow pull back | Drifts away. Reveals more of the room. |
| pan-left | Pan left | Turns left without changing position. |
| pan-right | Pan right | Turns right without changing position. |
| follow | Follow the subject | Moves along with the person. |
| handheld | Gentle handheld | A little human wobble. Feels present. |
| orbit | Slow orbit | Circles the subject once, slowly. |
| custom | Custom | None of these. Describe it in a few words. |

One camera idea per scene is built in: the control is single choice, so "Locked and also move" cannot be selected (matches the repo's `cameraConstraint`). If a bad pair arrives from an assistant suggestion, it is a blocking check, not a silent fix (`H3`).

### 6.5 Lens `P-LENS` (`camera.lensIntent`)

| id | Label | Hint |
|---|---|---|
| wide-24 | Wide (about 24 mm) | Big space. Edges stretch a little. |
| natural-35 | Natural (about 35 mm) | Close to how people see a room. |
| standard-50 | Standard (about 50 mm) | Neutral, balanced faces. |
| portrait-85 | Portrait (about 85 mm) | Flattering faces. The background softens. |
| long-135 | Long (about 135 mm) | Compresses distance. Isolates the subject. |
| macro | Macro | Extreme close detail of small things. |
| custom | Custom | None of these. Describe it in a few words. |

### 6.6 Focus `P-FOCUS` (`camera.focusIntent`)

| id | Label | Hint |
|---|---|---|
| all-sharp | Everything sharp | Foreground and background both clear. |
| soft-background | Soft background | Subject sharp, background blurred. |
| on-face | Stay on the face | Focus holds on the person's face. |
| on-object | Stay on the object | Focus holds on the prop. |
| shift-focus | Shift focus | Focus moves from one person or object to another. |
| custom | Custom | None of these. Describe it in a few words. |

### 6.7 Lighting: type `P-LIGHT` (`setting.lightSources`) and direction `P-LIGHTDIR` (`setting.lightDirection`)

| id | Label | Hint |
|---|---|---|
| window-day | Window daylight | Soft natural light from a window. |
| overcast | Overcast daylight | Even, grey-white light with no hard shadows. |
| golden-hour | Golden hour | Low warm sun. Long soft shadows. |
| candle | Candlelight | Small warm flicker. Deep shadows. |
| lamp | Warm lamp | A cosy indoor glow. |
| fire | Firelight | Orange, moving light from a fire. |
| moon | Moonlight | Cool, dim blue light at night. |
| mixed | Mixed sources | Two or more lights of different colours. |
| neutral | Neutral studio light | Clean, even light with no mood. |
| custom | Custom | None of these. Describe it in a few words. |

| id | Label | Hint |
|---|---|---|
| front | From the front | Flat and even. Shows everything. |
| side-left | From the side, left | Shapes the face. Shadow falls right. |
| side-right | From the side, right | Shapes the face. Shadow falls left. |
| back | From behind | A bright edge around the person. |
| top | From above | Shadows under the brow and chin. |
| under | From below | Eerie, like a flashlight under the chin. |
| all-around | Soft from all around | Very gentle. Almost no shadow. |
| custom | Custom | None of these. Describe it in a few words. |

### 6.8 Mood `P-MOOD` (`setting.atmosphere`) and colour feel `P-COLOUR` (`setting.palette`)

| id | Label | Hint |
|---|---|---|
| calm | Calm | Still and unhurried. |
| tense | Tense | Something could go wrong. |
| curious | Curious | Leaning in to learn something. |
| warm | Warm and close | Friendly. Intimate. |
| wistful | Wistful | Quiet sadness or longing. |
| playful | Playful | Light and a little mischievous. |
| awe | Awe | Wonder at something huge. |
| ominous | Ominous | A threat is near. |
| hopeful | Hopeful | Things might turn out well. |
| neutral | Neutral | No strong feeling. |
| custom | Custom | None of these. Describe it in a few words. |

| id | Label | Hint |
|---|---|---|
| warm-amber | Warm amber | Candle and wood tones. |
| cool-blue | Cool blue | Night, distance, calm. |
| earth | Earth tones | Browns, ochre, olive. Period feel. |
| muted | Muted and faded | Low colour, like an old print. |
| vivid | Vivid | Rich, saturated colour. |
| black-white | Black and white | No colour at all. |
| custom | Custom | None of these. Describe it in a few words. |

### 6.9 Sound `P-SOUND` (segmented, `sound.strategy`) and background `P-AMBIENCE` (`sound.ambience`)

| id | Label | Hint |
|---|---|---|
| native | With the video | The provider makes voice and room sound with the picture. |
| separate-edit | I'll add it in the edit | Picture only. Sound comes later in the edit. |
| silence | No sound | The scene is silent. |

The repo's fourth value, `unsupported`, is host-reported and never offered as a choice. If the provider cannot make sound, "With the video" is disabled with the reason beside it.

| id | Label | Hint |
|---|---|---|
| room-tone | Quiet room | A faint hum of the room. |
| street | Street | Distant footsteps and voices outside. |
| nature | Nature | Wind, birds, leaves. |
| crowd | Crowd murmur | Many people talking low. |
| fire-crackle | Fire or candles | A soft crackle. |
| none | None | No background sound. |
| custom | Custom | None of these. Describe it in a few words. |

### 6.10 Continuity (switches, `continuity.locks` and `continuity.allowedChanges`) and anchors

Group label: "Keep the same as the previous scene". A switch that is on goes to `locks`. A switch that is off goes to `allowedChanges`, so nothing is silently dropped.

| id | Label | Hint |
|---|---|---|
| era | Era | Same time period, props and setting details. |
| wardrobe | Clothes | Same costumes and accessories. |
| table-props | Table props | Same cups, plates, candles and papers on the table. |
| seating | Seating and screen direction | Same seats and the same side of the table. |
| light | Light | Same light type and direction. |

| Control | id | Label | Hint |
|---|---|---|---|
| Entry `P-ENTRY` (`continuity.entryAnchor`) | match-previous | Starts where the previous scene ended | The first frame matches the last frame before. |
| | fresh | Fresh start | No match needed. |
| | custom | Custom | None of these. Describe it in a few words. |
| Exit `P-EXIT` (`continuity.exitAnchor`) | ready-next | Ends ready for the next scene | Leaves things set up for what follows. |
| | open | Open ending | No match needed. |
| | custom | Custom | None of these. Describe it in a few words. |

### 6.11 Scene fields

| Control | Options | Hint |
|---|---|---|
| Who is in this scene `P-CAST` (multi-select, `subjects[]`) | Characters from the project (provided by props); "Custom" adds a name | "Pick everyone who appears, even if they don't speak." |
| Place `P-PLACE` (`setting.place`) | Places from the project (provided by props); "Custom" | "Choose from your project's places, or Custom." |
| Scene length `P-LENGTH` (`output.durationFrames`) | 2 s, 3 s, 4 s, 5 s, 6 s, 8 s, 10 s | "About how long the scene runs. Account limits are checked in Check." |
| Action step `P-ACTION` (`beats[]`, one select per step plus "Starts at" and "Ends at" steppers in seconds) | Stays still and speaks; Turns to look; Walks into frame; Sits down or stands up; Picks up an object; Sets an object down; Leans in; Reacts to what was said; Custom | "One clear action per step with a visible end." |
| Where to make it `P-ROUTE` (`output.routePreference`, in Check) | No preference; Kling; Higgsfield; ComfyUI; Local | "No preference decides at release. Choosing one sends nothing." |
| Output kind `P-KIND` (segmented, `output.kind`) | Video; Still image | "Video makes a clip. Still image makes one picture." |

Action steps are bounded by the scene length: the "Ends at" stepper cannot exceed it and steps cannot overlap (the stepper clamps with a visible message, never silently).

### 6.12 Account settings (Check tab) humanising table

Options are copied from the account snapshot only; nothing is invented. Labels: `duration-frames` becomes "Length (frames)" with the seconds equivalent shown beside it, `ratio` "Picture shape", `resolution` "Picture size", `count` "How many versions", any `enum-<name>` becomes the name with hyphens as spaces in sentence case plus the hint "Offered by your account." When no snapshot is present, the group shows "Not read yet" and a "Check again" button, never guessed defaults (matches the repo's `NativeParameters` honesty).

### 6.13 Reference role `P-ROLE` (`REFERENCE_ROLES`)

| id | Label | Hint |
|---|---|---|
| identity | Who it is (face and look) | Keeps the person recognisable. |
| wardrobe | What they wear | Keeps clothes and accessories the same. |
| prop | An object in the scene | Keeps a specific object looking the same. |
| start-frame | How the shot begins | The first picture of the shot. |
| end-frame | How the shot ends | The last picture of the shot. |
| motion | How it moves | Copy the movement from this clip. |
| environment | Where it takes place | Keeps the room or location consistent. |
| style | Overall look | Matches colour, grain and mood. |
| exclusion | What to keep out | Things that must not appear. |

### 6.14 Assistant: task `P-TASK`, apply-to `P-SCOPE`, provider `P-PROVIDER`

| id | Label | Hint |
|---|---|---|
| draft | Draft this scene | Fills every empty choice from the script line. |
| other-camera | Suggest a different camera setup | Keeps your script. Tries another shot size, angle and move. |
| tighten-action | Tighten the action | Makes each step one clear action with a visible end. |
| check-continuity | Check against the previous scene | Compares era, clothes, table props, seating and light. |
| suggest-references | List what references to find | Lists what to look for. Nothing is attached for you. |
| explain-checks | Explain the checks | Says in plain words what is blocking this scene. |

| id | Label | Hint |
|---|---|---|
| this | This scene | Only the scene you are viewing. |
| empty | All empty scenes (87) | Each scene gets its own suggestion. You review them one by one. |
| filtered | Scenes in the current filter (N) | Uses the "Show" filter in the Schedule. |

| id | Label | Hint |
|---|---|---|
| codex | Codex (works inside Studio) | Uses your signed-in Codex app on this computer. |
| claude | Claude (copy and paste) | Studio prepares the request. You paste it into Claude Code yourself. |

## 7. Tooltips, hints and labels (A6)

### 7.1 Three tiers

1. **Label.** Always visible, never replaced by an icon alone for any action that changes data.
2. **Hint (G1).** One line of persistent text under a field, referenced by `aria-describedby`. This is where the useful explanation lives. Hints are always in the accessibility tree, so no essential information lives only in a tooltip.
3. **Tooltip (G2).** Optional extra for icon-only controls and abbreviations ("About 24 mm"), and for the long form of a status. A tooltip may repeat what is in the label or hint; it must never be the only place something is said.

### 7.2 Tooltip behaviour (WCAG 1.4.13, APG tooltip)

- Opens on pointer hover after 400ms (Studio's existing delay) and immediately on keyboard focus. Does not open on touch tap (hints cover that).
- Dismisses with `Esc` without moving focus and without closing a parent dialog (the first `Esc` closes the tooltip, the next closes the dialog).
- Persistent while the pointer is over the trigger or over the tooltip, until `Esc`, blur or the pointer leaves both. This needs the popup to accept pointer events (DEP3).
- `role="tooltip"`, `id`, and the trigger carries `aria-describedby` for as long as it is mounted, not only while open.
- Maximum 2 sentences, plain words, no jargon, no required action inside it (no buttons or links in a tooltip).

### 7.3 Smart-hint rules

A smart hint is a single sentence shown under the field it concerns, computed from the current choices. It is advice, never a hidden change: nothing is auto-corrected. Each hint has an id, a severity (`info` or `warning`, icon plus text), an optional single fix button, and is announced once when it appears through R1.6 (polite). A hint appears at most once per field and disappears when its condition is gone. Hints are data supplied by props (`{ id, severity, text, fieldId, action? }`); the rule engine is Stage B/C.

| ID | When | Copy (final) | Fix button |
|---|---|---|---|
| H1 | Coverage needs an identity reference and none is bound | "This style works best with a face reference. Add one in References." | "Go to References" |
| H2 | Coverage is "Restrained dialogue" and the scene has no spoken line | "This scene has no spoken line. Try Listening reaction." | "Use Listening reaction" |
| H3 | Movement is not "Locked" and a second camera move was proposed by the assistant | "Two camera moves at once. Pick one." (this is a blocking check) | "Go to Movement" |
| H4 | Lens "Wide" with shot size "Extreme close-up" | "A wide lens this close distorts faces. Try Natural or Portrait." | "Use Portrait" |
| H5 | Light type "Candlelight" or "Moonlight" and length over 6 s | "This light is dim. A long scene may look dark." | none |
| H6 | Estimated speaking time is longer than the scene length | "This line takes about 6 s to say. The scene is 4 s." (estimate, labelled "about") | "Set length to 6 s" |
| H7 | Continuity "Clothes" is on and the previous scene has a different wardrobe lock | "Scene 2 has different clothes. Turn this off, or change one scene." | "Turn off Clothes" |
| H8 | Sound plan "With the video" and the provider cannot make sound | "Your provider can't make sound. Choose I'll add it in the edit." | "Use I'll add it" |
| H9 | A bound reference is unavailable | "Newton portrait is unavailable. The scene is creative only until it is back." | "Go to References" |
| H10 | Asset folder unavailable | "Asset folder not configured. Scenes still work. References can't be picked yet." | "Setup details" |
| H11 | Assistant suggestion differs from the script line | "The suggestion changed the dialogue. It can't be used." (suggestion is rejected, host re-validates) | "Dismiss" |

H2, H4, H6 are the only hints with a one-click fix. A fix button is a normal button, announces the change through R1.6 and is undoable.

### 7.4 Button labels (clear and plain)

| Old (current code) | New | Notes |
|---|---|---|
| `Prepare` | "Prepare for generation" | Hint: "Saves your plan. Nothing is sent or paid for." |
| `Apply proposal` / `Apply` | "Use this suggestion" | Never "Apply". Disabled with reason when there is nothing to use. |
| `Send` | "Ask the assistant" | |
| `Cancel` (assistant) | "Stop" | Stops the running request. Distinct from dialog "Cancel". |
| `Copy handoff` | "Copy for Claude or Codex" | Result toast: "Copied. Paste it into Claude or Codex." |
| (none) | "Draft this scene", "Pick a reference", "Choose lens" (and other `Choose <choice>`), "Fix: <issue>" | Section 5 |
| (none) | "Create scenes from script", "Create N empty scenes" | N is the real count |
| (none) | "Update from script", "Update schedule" | |
| (none) | "Add a reference", "Use in this scene", "Remove link" | |
| (none) | "Go to <field>" | Moves focus to the field named in a check |
| (none) | "Undo", "Redo", "Dismiss", "Check again", "Setup details", "Previous scene", "Next scene" | |

Rules: a label is a verb plus the object, in sentence case, with no abbreviations and no codes. A destructive label names what is lost ("Replace 6 edited scenes"). A button never says only "OK" or "Apply". Dialog primary buttons repeat the action and the count.

## 8. Script to about 100 empty scenes (A2, A14)

Goal: one action, offline, no model. All scenes start empty. IDs derive from the source line ids so re-running is idempotent (Gate C item C7).

1. The producer opens Schedule. With no scenes, R1.5 shows "No scenes yet" and one button, "Create scenes from script" (section 4.2).
2. The button opens D1. Focus lands on "Script source".
3. "Script source" lists what exists, each with a hint:
   - "Script already imported for this project" (default when an import with script lines is present): "Uses the lines from your film import."
   - "Script from the asset folder": enabled only when the asset folder is available; otherwise disabled with "Asset folder not configured." beside it.
   - "Paste a script": shows a box for the pasted dialogue. Dialogue is free text by A1. Lines get ids in order of appearance (`line-001`, ...), marked "provisional ids" until the project script defines them (OQ-6).
4. "Split into scenes by": "One scene per script line" (default), "One scene per speaker turn", "One scene per paragraph". Each has a hint ("Each line becomes its own scene.", "Consecutive lines by the same speaker share a scene.", "A blank line starts a new scene.").
5. The preview updates live and is read by R1.6: "Found 98 script lines. 98 scenes will be made. 3 lines have no speaker." No scene is created yet. A line without a speaker still makes a scene, flagged "No speaker" in its row (a Stage C diagnostic).
6. "Create 98 empty scenes" is the only way forward. The number on the button is the real count. It is disabled while the preview is loading or the source is empty, with the reason shown.
7. On confirm: the dialog closes, focus moves to the scene list, Scene 1 is selected, all rows read "Empty - Next: Draft this scene", and R1.6 announces "Created 98 empty scenes. Scene 1 selected." A toast offers "Undo" (removes all 98 in one step, A13). The "Show" filter reads "Empty (98)".
8. The producer then works scene by scene, or asks the assistant with "Apply to: All empty scenes (98)".
9. When the script changes later, "Update from script" opens D2. It reports four counts (unchanged, new, no longer in the script, edited). Edited scenes are kept by default ("Keep my edits (recommended)"). Choosing "Replace N edited scenes" changes the confirm button to "Replace 6 scenes" and requires a second confirm line: "This replaces your edits in 6 scenes. You can undo." If nothing changed, D2 says "Nothing to update. 98 scenes already match." and offers only "Close".
10. Empty, drafted, ready and blocked states survive an update. Removed script lines never delete a scene silently: the scene stays with a "Script line removed" tag until the producer chooses "Remove scene".

Undo coverage (A13): create, update, clear, remove, duplicate, move, preset change, reference link/unlink, assistant "Use this suggestion". Each mutation is one undo step with a named label ("Undo: move scene 12"), shown in the Undo button tooltip. Studio's own editor undo is separate; see DEP2.

## 9. References and the asset folder

### 9.1 Reference rows and importer vocabulary (A15)

Every row in the picker and every bound reference in R2.5 shows thumbnail, kind, source and a state label. The six state names are exactly those in `legacy/import-movies.mjs` (no new names), with this plain-language gloss:

| State (importer name) | Label shown | Gloss | Selectable |
|---|---|---|---|
| `verified` | Verified | File matches its recorded checksum. | Yes |
| `observed-unverified` | Found, not verified | File exists but no checksum was recorded to compare. | No ("Can't be used until it has a recorded checksum.") |
| `hash-mismatch` | Changed | File differs from its recorded checksum. | No ("The file changed since it was recorded.") |
| `missing` | Missing | File not found in the asset folder. | No |
| `invalid` | Invalid | Path is outside the asset folder or can't be opened. | No |
| `archived` | Archived | Retired. Can't be used in new scenes. | No |

Only `verified` is selectable, matching the companion inspector's rule (`mediaState === "verified"` for reference assignment) and the scene-brief binding that needs `referenceId` plus `sha256` (`parse/scene.ts`). Unusable rows stay focusable (`aria-disabled="true"`) and carry their reason in `aria-describedby`, so the reason is never hidden.

Kind: image, video or audio. Source: Asset registry (`asset-registry.csv`), Import (import JSON), Review file (review JSON), matching the provenance values in B27. Id: the registered id in mono. Short hash: first 8 hex characters of the sha256 in mono, `--------` when none. Thumbnail 48px; for audio a waveform icon; when the file is not available the box shows the text "No preview". No sample or placeholder asset ever appears (A16).

Files on disk with no registered id appear only under "Files not in the registry", collapsed by default, listing path and short hash, not selectable, with "No registered id, so it can't be used." (B28). The producer is never offered a generated id.

### 9.2 Unavailable references (A17)

When a bound reference's asset is not usable (any state other than verified, or the folder is down), the link stays: the row keeps the reference id, shows an icon and "Unavailable" plus the reason from 9.1 or from the folder state, and the scene gets the badge "Creative only: 1 reference needed". Slots and character entries keep working. The link is only removed by "Remove link". Reconnecting the folder re-checks and the row returns to its real state without any rebind.

### 9.3 Asset-folder banner (A16)

Copy and variants are in 4.11. Rules: it appears only when no usable folder exists (or one of several is down), it is persistent while true (no dismiss), it is one banner not many, it does not block anything outside reference picking, and it announces once, politely, when it first appears. "Setup details" opens D5, a non-modal popover listing each configured folder with its reason code in words (Not configured, Not found, Can't be read, OK), the path, and for the unset case a short explanation for the person who runs this computer, including the key name from section 9.4. The producer never needs D5 to keep working.

### 9.4 Proposed host-path config key

| Property | Proposal |
|---|---|
| Key name | `filmAssetRoots` (typed config), environment variable `HYPERFRAMES_FILM_ASSET_ROOTS` |
| Form | An ordered list of absolute host folders. In the environment variable, entries are separated by the OS path delimiter (`:` on Linux, the only host the design qualifies). Optional repeatable CLI flag `--film-asset-root <path>` on `hyperframes preview`; the flag wins over the variable. |
| Default | **Unset** (empty list). No built-in path, no `/mnt/data`, no sample folder. |
| Why an env var plus flag | `bun run studio` starts Vite and takes no CLI flags, while `hyperframes preview` is the built-CLI route. An environment variable is the only form that reaches both. The existing `film:*` scripts keep their own flags (`--workspace`) and are untouched. |
| Validation at startup | Each entry must be absolute, exist (else reason `missing`), and be a readable directory (else reason `denied`). Unset gives reason `unset`. The result is a typed `root-unavailable` with the reason (B33), never a fallback to samples. Paths are canonicalised with `realpath`; escaping symlinks are refused (B30). |
| Where it is shown | The Schedule banner (R1.2) and D5. A diagnostics line in the same popover lists each folder and its state. |
| Producer-facing | None. The producer sees only the banner. Setting the key is a one-time host step for whoever runs the computer, documented in `docs/` in the Stage B PR (B32). |
| Read-only | The indexer never writes, creates or deletes inside a root (B26). |

This is a proposal for Stage B to ratify. It fits the two producer roots in `local-asset-roots.md` (the film workspace and the movie project) as two entries of the list, with no per-root role flag (the index finds `asset-registry.csv` and the import/review JSON by name).

## 10. Empty, loading and error states (A3, A12, A16, A17)

Pending and error states are scoped to the smallest region that owns them. Every state change that is not a direct result of the keystroke goes through R1.6 (polite) except hard errors, which use a toast with `role="alert"` only for failures that block the producer's current action.

| Region | Empty | Loading | Error |
|---|---|---|---|
| R1 Schedule | "No scenes yet" with "Create scenes from script" (4.2). Filter yields none: "No scenes match this filter." plus "Show all scenes". | Scenes come from the script offline and appear immediately; only badges (reference counts, folder status) load. Skeleton rows are not used for scenes. | Script source unreadable: "Couldn't read the script. Nothing was changed." plus "Try again" in D1. Save failure on a row: toast "Couldn't save changes to Scene 12. Retry" with "Retry". |
| R1 row | The empty-slot layout in 4.3 | "Drafting..." with the working icon, this row only | Blocked state with the issue and "Fix: ..." |
| R1.2 Banner | not shown when folders are fine | "Checking asset folder..." replaces the text with a static label under reduced motion | The four variants in 4.11 |
| R2 Production | No scene selected: "Pick a scene in Schedule." plus "Go to Schedule". No project connected: "No film project is connected. You can still read presets; saving is off." | Per-tab loading text only where data is truly loading: "Reading your references..." | Save failure and conflict (below) |
| R2.5 References | "No references yet. Add one, or save what the scene needs." with "Add a reference" | "Reading your references..." | Unavailable rows (4.6); folder down: banner copy repeated inline once |
| D3 Picker | "No references found. Check the filters." / folder down: "Asset folder not configured. Nothing to pick." | "Reading your references..." | "Couldn't read the references. Nothing was changed." plus "Try again" |
| R3 Assistant | Nothing to review: "No suggestion for this scene." | "Asking Codex about Scene 12..." with the "Stop" button focusable | Readiness errors in 10.1; invalid output: "The suggestion wasn't usable, so nothing changed. Try again or copy the request." (one repair retry is host behaviour, D10) |
| Conflict | | | "Scene 12 was changed elsewhere. [Keep mine] [Use theirs]" in the inspector; both versions are retained until chosen |

### 10.1 Assistant readiness in plain words

Never show the raw states. Text is final copy; icon shapes follow 3.4 (ready check, blocked sign, warning triangle).

| Host state | Shown | Help line |
|---|---|---|
| ready | "Ready" | |
| missing CLI | "Assistant app not installed on this computer" | "You can still copy the request and paste it into Claude or Codex yourself." |
| unauthenticated | "Not signed in" | "Sign in in the Codex app, then Check again." |
| unsupported protocol | "This version of the app isn't supported yet" | "Copy the request instead." |
| unavailable mode | "Not available in this mode" | "Copy the request instead." |
| limited usage | "Usage limit reached" | "Try later, or copy the request." |
| host not connected (today's stub) | "No assistant is connected to this Studio" | "Copy the request keeps your note." |

"Ask the assistant" is enabled only on "Ready". Executable found or process started is never shown as "Ready".

## 11. Accessibility and keyboard details

### 11.1 Focus and structure

- One `h2` per dock panel (existing). Panel sub-sections are `h3`. State labels are visible text, not `aria-label` only.
- Visible focus on every control: 2px ring in the heading role (`--color-ring`) with 2px offset; never removed with `outline: none` without an equal replacement. Studio's `outline-hidden` pattern is only allowed when a `:focus-visible` replacement is present (A7).
- Tab order follows reading order. Dialogs trap focus, return it to the opener on close and label themselves. The tooltip layer never takes focus.
- Selecting a scene by arrows does not move focus anywhere. After actions: create scenes returns focus to the list; "Use this suggestion" returns focus to the assistant heading; "Remove link" moves focus to the next reference row or "Add a reference".

### 11.2 Scene list (A7, A8, B2)

`role="listbox"`, `aria-label="Scenes"`, `aria-multiselectable="false"`. Each `option` has `aria-selected`, `aria-posinset`, `aria-setsize` (100, the real total, because rows are virtualized; B2), and `aria-describedby` pointing to the hidden next-action text. Roving `tabindex`: the selected option has `tabindex="0"`, the others `-1`. Selection follows focus. `Home/End/PageUp/PageDown` scroll to the target index first, then focus the row so unmounted rows are reachable. Digits type-ahead to a scene number (200ms buffer). `Enter` runs the primary action and then announces what it did.

### 11.3 Studio key conflicts (DEP2)

Studio's global hotkeys claim `Space`, `f`, `s`, `r`, `k`, `g`, `z`, `j`, `l`, `m`, `Delete`, `Cmd/Ctrl+Z` and arrows over the player. The film panels use only: arrows, `Home/End`, `PageUp/PageDown`, `Enter`, `Esc`, digits, `Delete`, `Alt+Up/Down`, `Shift+F10`, and `Cmd/Ctrl+Z` scoped to the Schedule panel. No single-letter shortcuts are added. Stage B must (a) mark the listbox as owning plain keys, the way `[role='slider']` already is, and (b) scope `Cmd/Ctrl+Z` and `Shift+Cmd/Ctrl+Z` to the Schedule history while focus is inside `[data-film-schedule]`, using the same pattern as `timelineOwnsKey` (`[data-studio-timeline]`). Outside the Schedule, Cmd/Ctrl+Z keeps its Studio meaning.

### 11.4 Non-dragging alternatives (A10)

Every drag has a menu or keyboard equivalent: reorder with `Alt+Up/Down` or "Move up / Move down" or "Move to position..." (D4, a stepper); linking a reference uses the picker button, never drag from the asset browser; bulk apply uses the "Apply to" select. No control in this design requires a drag at all.

### 11.5 Live regions (A12)

R1.6 is the single polite region for the Schedule and Production (`aria-live="polite"`, `aria-atomic="true"`), the Assistant owns one more for its status. Messages are short and scoped: "Drafting Scene 12...", "Scene 12 drafted.", "Showing 87 of 100 scenes.", "Created 98 empty scenes. Scene 1 selected.", "Asset folder not found." Pending state is shown on the row or field that owns it, never as a page-level spinner.

### 11.6 Targets, contrast, reflow, motion

Targets, contrast and tokens are in section 3. Reflow is in 4.13. Under `prefers-reduced-motion: reduce` there are no transitions or spinners, and "Drafting..." is static text with the working icon.

## 12. Signature interaction slots (TBD by the Creative Director stage)

Stage A does not propose signature interactions. Up to three are reserved; each attaches to an existing region so the conventional layout stays complete underneath (CD8: novelty never removes a familiar affordance). Each must arrive as a CD card that carries its own keyboard path, ARIA mapping, reduced-motion alternative and 100-scene performance note (CD5), and must pass A and B items on paper (CD10).

| Slot | Attaches to | Status |
|---|---|---|
| SIG-1 | Schedule structure (how the list of scenes is grouped or shown above R1.3) | TBD by the Creative Director stage |
| SIG-2 | Scene row decoration or inspector header (R1.3 / R2.1) | TBD by the Creative Director stage |
| SIG-3 | Assistant or continuity review (R3 / R2.4) | TBD by the Creative Director stage |

## 13. Self-score against Gate A (A1 to A19)

Scoring is on paper (design level). "Verify in B" means Gate B must prove it in the running build; it does not mean the design is incomplete.

| ID | W | Result | Evidence |
|---|---|---|---|
| A1 | must | **Pass, with two interpretations flagged** | Every control is select, segmented, switch, stepper or button (sections 6, 2). Free text is limited to dialogue (read-only exact line, plus the "Paste a script" box in section 8), scene title, notes, the `Custom` description box (a note) and "Find by name" in the picker. The `Custom` box and the filter box are a reviewer judgement (OQ-1). No JSON, CLI text or schema is required or shown on the producer path; D5 "Setup details" is a collapsed operator-facing disclosure that names the config key (OQ-1). The ~20 existing textareas are replaced (1.2). |
| A2 | must | **Pass** | One action "Create scenes from script" yields all empty scenes (8, 4.2, 4.12). States empty, drafted, ready, blocked as text plus a distinct icon shape (3.4, 4.3), never hue alone. |
| A3 | must | **Pass** | Section 5 table: every state has one primary action and a one-line reason; empty rows show both (4.3). |
| A4 | must | **Pass** | Master (R1, left dock) and detail (R2, right dock) (4.1). Selection follows focus and updates R2 without moving focus or scroll (4.3, 11.2). Verify in B. |
| A5 | must | **Pass** | Camera, lens, lighting, mood, coverage and more are dropdowns, each option with a one-line hint, `Custom` last (6.1 to 6.14). Current `Select` has no hint line (DEP4). |
| A6 | must | **Pass at design; two dependencies** | 7.2: hover and focus, `Esc`, persistent hover, `role="tooltip"`, `aria-describedby`. Hints are persistent text, nothing essential is tooltip-only (7.1). Studio's `Tooltip` is `pointer-events-none` today (DEP3). Verify in B. |
| A7 | must | **Pass** | Keyboard paths for every region in the IA table; roving tabindex list with one tab stop (2, 11.2); visible 2px focus ring (11.1). Key conflicts handled (11.3, DEP2). |
| A8 | must | **Pass** | `listbox/option` with `aria-selected` for scenes (R1.3); inspector `tablist/tab/tabpanel` with arrow switching (R2.2); the reference picker is also a listbox (D3). |
| A9 | must | **Pass at design** | Controls at least 28px, rows at least 40px (3.3). Sticky action bar with `scroll-padding-bottom` (4.4). Verify in B with a focus-obscured test at 400% zoom. |
| A10 | must | **Pass** | 11.4: menu and keyboard for reorder, move, place and link; no control needs a drag. |
| A11 | must | **Pass with a documented mapping** | Roles from DESIGN.md mapped to Studio tokens, no hex (3.1). Contrast computed and constraining rules added (3.2): no `--text-tertiary` text, no `--border` control boundaries, no blue text on `surface2` in light. DESIGN.md has no danger or warning role (OQ-2) and Inter is not loaded by Studio (OQ-3). Studio-token equivalents must be measured in light and dark in Stage B. |
| A12 | should | **Pass** | 11.5: polite live region; pending state scoped to the row or field (3.4 working marker, 10). |
| A13 | should | **Pass** | Section 8 undo coverage and the toast "Undo" (G3). |
| A14 | should | **Pass** | D2 states the number of edited scenes it would replace, keeps them by default, and requires an explicit confirm to replace (8 step 9, 4.12). |
| A15 | must | **Pass** | 9.1 and 4.10: thumbnail, kind, source and the six importer states verbatim. |
| A16 | must | **Pass** | 4.11 and 9.3: "Asset folder not configured" and "not found at <path>" in plain words, scenes fully usable, no sample or placeholder asset anywhere ("No preview" text only). |
| A17 | must | **Pass** | 9.2 and 4.6: the reference id stays, "Unavailable" plus reason is shown, link removed only by explicit action. |
| A18 | should | **Pass at design** | 4.13 reflow; reduced motion in 3.3 and 11.6. Verify in B at 400% zoom with a real browser. |
| A19 | must | **Pass** | Section 2: region, purpose, controls, keyboard path, ARIA role for every region, dialog and global element, with stable IDs for the Gate B trace. |

Totals: 15 of 15 musts pass at design level with the caveats above (A1, A6, A9, A11 carry named caveats); 4 of 4 shoulds pass at design level.

## 14. Open questions

| ID | Question | Why it matters |
|---|---|---|
| OQ-1 | May "Custom" description boxes and the picker's "Find by name" box count as notes and filters under A1, and is a collapsed operator-facing "Setup details" acceptable? | If not, the picker needs a four-way dropdown filter only and the folder details move out of the UI entirely. |
| OQ-2 | DESIGN.md has no danger or warning colour. May the film panels use Studio's `--color-danger-ink` for "Blocked" (text and icon always carry the meaning)? | A11 says DESIGN.md tokens only. The alternative is neutral ink with a stronger border and the prohibition icon. |
| OQ-3 | DESIGN.md names Inter and IBM Plex Mono, but Studio ships a system stack with JetBrains Mono first. Bundle Inter and Plex for the film panels, or inherit Studio fonts? | A11 names the fonts. Bundling adds weight (B11). |
| OQ-4 | Is a left dock panel the right home for Schedule, or should it sit in the centre group beside Timeline? | It changes width and whether the list is a column or a wide strip. The layout is built to work in both (wide columns in 4.3). |
| OQ-5 | Does the producer need a "Choose folder" browser for the asset folder, or is a one-time host setting (env var) acceptable? | A browser is a larger server feature and is not designed here. |
| OQ-6 | What are the source line ids for a project script, and what is the pasted-script id scheme? Where does the importer store script lines? | D1's "Script already imported" and idempotent ids depend on it (C7). |
| OQ-7 | Which fields are "required" for Ready (3.4 proposes six)? Should "Place" and "Who is in this scene" be required? | Changes the empty, drafted and ready counts shown to the producer. |
| OQ-8 | Should an unverified or changed reference be bindable with a warning, or only `verified`? (This doc says only `verified`, as in the inspector.) | Producers may have real references without recorded checksums. |
| OQ-9 | The exact `asset-registry.csv` columns and whether `workspace.json` exists at the Movies_Projects root (Gate 0 ambiguities 1 and 2). | Decides what "Source" shows and how the index starts. |
| OQ-10 | What launch command and port does the producer actually use for the 9361 preview? | Needed for Stage B before/after captures. |
| OQ-11 | Studio's global Undo covers editor edits only. Is a separate Schedule undo history (scoped by focus) acceptable, or should film mutations join Studio's history? | Affects DEP2 and the PRODUCTION-DESIGN rule "never overwrite a human edit". |

## 15. Stage B dependencies and risks

| ID | Dependency or risk | Where |
|---|---|---|
| DEP1 | Register `schedule` in `PANEL_IDS` and `PANEL_DEFINITIONS` (zone `left`), mount it from `FilmDockPanels`. | `components/dock/panelRegistry.ts`, `film/FilmDockPanels.tsx` |
| DEP2 | The scene list must own plain keys; scope Cmd/Ctrl+Z to `[data-film-schedule]`. | `utils/typingTarget.ts`, `hooks/appHotkeysDispatch.ts` |
| DEP3 | Tooltip must stay open under the pointer (remove `pointer-events-none` or add a hoverable variant) and keep `aria-describedby` mounted. | `components/ui/Tooltip.tsx` |
| DEP4 | `Select` options need a one-line hint, a 40px row, wrapping text and a visible reason for disabled options (today 24px, truncate, 40% opacity). A film-scoped wrapper is acceptable if the shared one must not change. | `components/ui/Select.tsx` |
| DEP5 | No new colour literals outside `theme.css` (hex ratchet). Film CSS uses only the Studio tokens in 3.1. Film panels' `text-[11px]` and `neutral-*` are retired. | `styles/hexRatchet.test.ts` |
| DEP6 | Virtualized list must keep `aria-posinset` and `aria-setsize` and reach unmounted rows with Home/End (B1, B2). Reuse `useTimelineVirtualRows`. | `player/components/useTimelineVirtualRows.ts` |
| DEP7 | Host-path config key and `root-unavailable` result (9.4); docs in `docs/` in the same PR. | Stage B index work |
| DEP8 | Film-specific dock panels stay under 600 lines per file; extract per region. | `packages/studio/AGENTS.md` |
| RISK1 | `Cmd/Ctrl+Z` meaning differs by focus. Mitigated by always-visible Undo/Redo buttons labelled with the action. | 11.3 |
| RISK2 | Hint text lengths and wrapping at 320px. Verify with a real browser, not happy-dom (no layout). | 4.13 |
| RISK3 | The producer's real asset folder cannot be reached from the cloud VM. All states are designed to work, and be tested, with a synthetic fixture and an absent root (B35). | 9 |
