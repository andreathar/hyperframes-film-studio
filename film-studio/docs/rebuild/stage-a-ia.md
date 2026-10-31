# Stage A: information architecture and UI contract

Status: Stage A deliverable for Gate A, **revision 2** (answers the Gate A round 1 review, verdict FAIL). Branch `film-studio-rebuild`. Date 2026-10-31.
Author: Stage A (UI/UX). No React was written for this stage. This file is the only input contract for Stage B.

Scored against `BEST-PRACTICES.md` Gate A items A1 to A20. Section 14 is the self-score. Section 15 lists decisions taken and what is still open.

Revision 2 changes, mapped to the review's required fixes:

| Review fix | What changed | Where |
|---|---|---|
| F1 (A1) | Env var, flag, config key and diagnostic codes removed from every producer-visible surface. Assistant return path without JSON added. Paste-script grammar defined. Free-text boxes renamed and listed as explicit exceptions | 0, 2 (R3.4, D5), 8, 9.3, 9.4, 4.8 |
| F2 | Preset storage rule | 12.2 |
| F3 (A4) | Default dock layout with separate tab groups, `keepMounted` for Schedule, film host above the panels for state and live region | 4.1, 16 (DEP1) |
| F4 (A8) | Options contain text only. Row actions moved out of the options | 2 (R1.3, R1.4), 4.3, 11.2 |
| F5 (A11) | Status colours, one focus-ring rule, field-boundary rule, warning and danger roles, fonts inherit Studio | 3 |
| F6 (A13, A3) | One film undo scope across Schedule, Production and Assistant; empty-row action renamed | 5, 11.3 |
| F7 | `ScriptLine`, hash-based line ids, scene identity, definition of "edited" | 8, 12.1 |
| F8 | Thumbnail contract | 12.6 |
| F9, F10 | Honest degraded states. Then closed by the producer's three authorised answers: the exact registry header and column mapping, `workspace.json` exists, the verified live preview launch command | 9.5, 12.12, 4.11, 4.12, 1.4 |
| F11 | Port 9361 guess deleted; the producer's verified launch command added instead | 1.4 |
| F12 | Frames, fps and still-image rules, action beats, voice, needs, checks, row height | 12.3 to 12.8 |
| F13 | No placeholder UI for Creative Director slots | 13 |
| F14 | Props per region and a "Stage B decides nothing about" list | 12.9, 12.13 |

## 0. How to read this

- IDs are stable so Gate B can trace to them: regions `R*`, dialogs `D*`, presets `P*`, smart hints `H*`, states `S*`, Stage B dependencies `DEP*`.
- "Producer" means the human who makes the film and never writes code. Every producer-facing control is a select, segmented control, switch, stepper or button.
- **Free text is allowed only in these five places, and each is an explicit A1 exception:**
  1. Dialogue: the "Paste a script" box in D1 (and the exact script line, which is read-only everywhere else).
  2. Titles: the scene title.
  3. Notes: the scene notes box and the assistant "Add a note (optional)" box.
  4. **"Note for Custom"**: a box under a preset whose chosen option is "Custom" (up to 120 characters). It is a note about that one field, never required, and creates no new option.
  5. **"Search"**: a box on a long list (the reference picker). It creates no data, is never required, and sits beside dropdown filters that already narrow the same list.
- **Nothing else is typed, and nothing the producer sees or must handle is JSON, a command, a flag, an environment variable, a configuration key, a path to compose, or a diagnostic code.** Folder paths appear as read-only text only where the checklist requires them (A16). Operator setup lives in `docs/` and the Stage B PR, never in the UI.
- Copy in quotes is final UI copy unless it says TBC. Preset ids and the one-line labels and hints are the Stage A contract. The phrase each id contributes to the compiled prompt is Stage C's (12.2).
- Signature interactions are not in this document. Section 13 states what Stage B does and does not do for them.

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
| `ProductionPanel`: one scrolling column of `Block`s | No master-detail, no tabs (A4, A8) | Schedule panel (master) plus Production inspector with four tabs (R1, R2), each its own dock panel (4.1) |
| `PatternChoice`: five `role="radio"` buttons | Not a dropdown, no hints, no Custom (A5) | Coverage select `P-COVER` |
| `ReferenceRoles`: raw ids (`start-frame`) in a native select, raw `referenceId` as the row title | No thumbnail, source or state (A15), jargon (A1) | Reference picker `D3` with role labels `P-ROLE` |
| `PromptSections` / `FieldControl`: about 20 per-field `<textarea>`s (opening, framing, angle, path, light direction, atmosphere, locks, exclusions...) | Free text everywhere (A1) | Presets `P-*` plus one optional notes box |
| `DiagnosticsList`: raw `item.code` in mono | Jargon, and a diagnostic code is visible to the producer (A1) | Plain sentence plus "Go to field". No code is rendered; "Copy details for support" copies a plain-text summary |
| `NativeParameters`: labels like `Duration frames`, `enum-<name>` | Jargon | Check tab "Account settings", labels from the humanising table in 6.12 |
| `AssistantPanel`: `Instruction` textarea, `Readiness {state} {evidence}` raw, `Copy handoff` with no way back | Free text, jargon, no non-JSON return path (A1) | Task select plus optional note, plain readiness (10.1), "Use a pasted suggestion" (4.8) |
| Buttons `Prepare`, `Apply proposal`, `Send`, `Cancel`, `Copy handoff`, `Apply` | Unclear (see 7.4) | Labels in 7.4 |
| `chrome.tsx`: `text-[11px]`, `neutral-*` classes | Sub-12px type, legacy neutral scale, no tokens by role | Section 3 |
| `useFilmSession`: stub host, "unavailable" readiness, toasts for blocked actions | Fine and honest | Keep the honesty; show the same states in the new UI (section 10) |

What stays: `Dock.Panel` mounting, `memo` panels taking props and callbacks only, the exact-dialogue rule (dialogue is rendered as exact text, never an editable field the pattern can rewrite), the "no proposal for this context" honesty, `useVisibleProposal` context isolation (a proposal never shows on a different shot).

### 1.3 Studio components to reuse (no new UI framework, B19)

`components/ui`: `Button`, `IconButton`, `Select`, `Tabs`/`TabsList`/`Tab`, `Tooltip`, `Menu`, `Popover`, `Toggle`, `NumberField`, `Input`, `SearchInput`, `useDialogBehavior`. Dock tabs already have `role="tablist"`, wrapping arrow keys and a "Maximize panel" button (`DockStripActions.tsx`), which is also the 400% zoom escape hatch (A18). Icons: Phosphor through the existing `IconContext`.

Gaps found (each becomes a Stage B dependency in section 16):

- `Select` options carry no hint line and the item row is `h-ctl-sm` (24px) with `truncate`. A5 needs a hint per option. `Tabs` use the same 24px size.
- `Select`, `Input`, `NumberField` and `SearchInput` draw their boundary with `--color-border-input`, far under 3:1 (A11).
- `Tooltip` popup is `pointer-events-none`, so it cannot stay open under the pointer (A6 and WCAG 1.4.13 "hoverable" fail today), and `aria-describedby` is set only while it is open.
- Global hotkeys claim Space, `f`, `s`, `r`, `k`, `g`, `z`, `j`, `l`, `m`, Delete and Cmd/Ctrl+Z unless the target is a typing target or `[role=slider]` (`utils/typingTarget.ts`, `hooks/appHotkeysDispatch.ts`). A listbox is not on that list. Undo and redo are global (`shouldIgnoreHistoryShortcut` only skips typing targets).
- `styles/hexRatchet.test.ts` fails the build on new colour literals outside `theme.css`.
- Dock defaults (`dockLayout.ts`): `DEFAULT_LEFT` is compositions, assets, code, catalog and `DEFAULT_RIGHT` is design, layers, renders, variables, motionBlur. `production` and `assistant` are in neither, so today they open only from the Window menu, and `schedule` does not exist. Only `preview` and `timeline` are `keepMounted` (`Dock.tsx`: `shown = visible || definition.keepMounted`), so every other panel unmounts its content when its tab is hidden.

### 1.4 Start commands found (for Stage B captures and the producer)

| Purpose | Command | Port | Source |
|---|---|---|---|
| Studio dev server | `bun run studio` (root `package.json`; runs `vite --host 127.0.0.1` in `packages/studio`) | Vite default, not pinned | `packages/studio/package.json` `dev` |
| Built CLI Studio preview | `node packages/cli/bin/hyperframes.mjs preview <dir> [--port <n>]` | default `3002` | `packages/cli/src/commands/preview.ts` |
| Verified live preview on pop-os (producer-verified; repo at `/mnt/data/Projects_SSD/hyperframes-film-studio`, cwd the repo root) | `node <repo>/packages/cli/bin/hyperframes.mjs preview .film-workspace/galileo-feasibility-v1 --port 9361 --foreground --no-open --force-new` | `9361` (explicit `--port`) | Producer report; the flags exist in `packages/cli/src/commands/preview.ts` |
| Companion inspector | `bun run film:inspect --import <import.json> [--state <review.json>] [--workspace <Movies_Projects>] [--port 9362]` | default `9362` | `scripts/film-production/inspector-cli.mjs` |

Port 1962 is not assumed. Neither 1962 nor 9361 is defined by any launch or config code in the repo; the only repo-defined 936x port is the inspector's `9362`. Raw text matches for those digits exist only in unrelated files (changelog, release notes, catalog JSON, compiled test output). The 9361 row is the producer's verified live preview launch (OQ-10, closed); the cloud VM cannot reach pop-os, so it is documented, never run, and no pop-os server is restarted for this work. It is an explicit `--port`, not a repo default: the repo defaults remain 3002 (CLI preview) and 9362 (inspector), and 1962 remains unverified and unused. This design binds to no port. Stage B captures name the exact command they used.

## 2. IA table (A19)

One row per region. Gate B must map its component tree one-to-one onto these rows (B18). "Studio shell" rows already exist and are listed for completeness. A "tab stop" is one Tab press into the region.

| ID | Region | Purpose | Controls | Keyboard path | ARIA role |
|---|---|---|---|---|---|
| S0 | Studio dock tab strip (existing) | Switch between panels in a group | Dock tabs, "Maximize panel", panel menu | `Tab` to the strip, `Left/Right` move and activate (wraps), `Home/End` | `tablist` / `tab` (existing, `dockAccessibility.ts`) |
| R0 | Film host (non-visual, above all film panels, always mounted) | Own film state, the single film history, the live region and the toast host so they survive dock tab switches | None visible | none | contains R0.1 and G3 |
| R0.1 | Live status | Announce progress, errors and counts for all three panels | Visually hidden text | none (not focusable) | `status` (`aria-live="polite"`, `aria-atomic="true"`) |
| R1 | Schedule panel (dock id `schedule`, left group, `keepMounted`) | Master list of all scenes; see state, choose a scene, run its next action | Panel wrapper carrying `data-film-scope` | Enter by `Tab` from the dock strip, order R1.1 → R1.2 → R1.3 | `region`, `aria-label="Schedule"` |
| R1.1 | Schedule toolbar | Filter, rebuild from script, undo and redo, scene count | "Show" select, "Update from script", "Undo", "Redo", count text | `Tab` through the four controls in that order. Select opens with `Enter`, `Space` or `Alt+Down`, `Esc` closes | `toolbar` (`aria-label="Schedule actions"`), `combobox`, `button` |
| R1.2 | Asset-folder banner | Say plainly when the asset folder or its asset list cannot be used | Message, "Check again", "Folder details" | `Tab` after the toolbar (only when shown). "Folder details" opens D5, `Esc` closes and returns focus | `region` (`aria-labelledby` the message) |
| R1.3 | Scene list | One fixed-height row per scene with state, title, next action and reason. **Options contain text only; no interactive descendants** | Options. No buttons, links or menus inside an option | One tab stop (roving `tabindex`). `Up/Down` move and select, `Home/End`, `PageUp/PageDown` ±10, digits type-ahead to a scene number, `Enter` runs the primary action, `Shift+F10` or `ContextMenu` opens R1.4, `Alt+Up/Alt+Down` move the scene, `Delete` clears the scene, `Cmd/Ctrl+Z` undo (film scope, 11.3). Pointer: click selects, double-click runs the primary action, right-click opens R1.4 | `listbox` (`aria-label="Scenes"`, `aria-orientation="vertical"`, `aria-describedby` the key hint) / `option` (`aria-selected`, `aria-posinset`, `aria-setsize`) |
| R1.4 | Scene actions menu | Scene actions without dragging, for the selected scene | Items: "Ask the assistant to draft this scene", "Move up", "Move down", "Move to position...", "Duplicate scene", "Clear scene", "Remove scene". Opened from the list (`Shift+F10`, `ContextMenu`, right-click) and from the "Scene actions" button in R2.1 | `Up/Down` move, `Enter` choose, `Esc` closes and returns focus to where it opened | `menu` / `menuitem` |
| R1.5 | Schedule empty state | No scenes yet: one action | "Create scenes from script" button, one-line reason | `Tab` after the toolbar | `region` with heading; `button` |
| R2 | Production panel (dock id `production`, right group, not `keepMounted`) | Inspect and edit the selected scene with presets | Panel wrapper carrying `data-film-scope` | Enter by `Tab` from the dock strip | `region`, `aria-label="Production"` |
| R2.1 | Scene header | Which scene, its state, step between scenes, scene actions, undo | Heading "Scene 12 of 100", state label, "Previous scene", "Next scene", "Scene actions" (opens R1.4), "Undo", "Redo" | `Tab` in that order. The heading is `tabindex="-1"` so "Open in Production" can move focus to it | `heading` level 2, `button`, `menu` button (`aria-haspopup="menu"`) |
| R2.2 | Inspector tabs | Four sections: Scene, Look, References, Check | Tabs | `Tab` into the tablist (one stop), `Left/Right` switch and activate, `Home/End` | `tablist` (`aria-label="Scene sections"`) / `tab` / `tabpanel` |
| R2.3 | Scene tab | Script line, voice, who, where, action steps, length, coverage, notes | Exact line (read-only text), "Voice" select (host list) or read-only voice, title field, "Who is in this scene" multi-select, "Place" select, "Output" segmented, "Action steps" list with selects and steppers, "Scene length" select, "Coverage style" select, notes box | `Tab` in reading order | `tabpanel`, `group`s with visible labels |
| R2.4 | Look tab | Camera, lens, light, mood, sound, continuity | Selects `P-SIZE` to `P-MOOD`, "Sound plan" segmented, "Background sound" select, five continuity switches, entry and exit selects | `Tab` in reading order. Selects open as in R1.1 | `tabpanel`, `combobox`, `radiogroup`, `switch` |
| R2.5 | References tab | Bind reference assets to this scene and record what is still needed | Bound references list, per-row "Role" select and "Remove link", "Add a reference" (opens D3), "Still needed" list, role and character selects with "Save the need" | `Tab` in reading order | `tabpanel`, `list`, `combobox`, `button` |
| R2.6 | Check tab | What is missing, what is blocked, account settings, written prompt | Check list with "Go to field" buttons, "Account settings" selects, "See the written prompt" disclosure | `Tab` in reading order | `tabpanel`, `list`, `button` (`aria-expanded`) |
| R2.7 | Action bar | The scene's primary action, always reachable | One primary button (label by state), "Ask the assistant to help" secondary | Last stop in the panel. The same action also runs from the list with `Enter` | `group` (`aria-label="Scene actions"`), `button` |
| R3 | Assistant panel (dock id `assistant`, its own right group below Production, not `keepMounted`) | Ask for suggestions, review them, use or dismiss them | Panel wrapper carrying `data-film-scope` | Enter by `Tab` from the dock strip | `region`, `aria-label="Assistant"` |
| R3.1 | Assistant status | Plain-words provider readiness, undo | Provider select, status line with icon, "Check again", "Undo", "Redo" | `Tab` in that order | `status`, `combobox`, `button` |
| R3.2 | Working-on card | Frozen target of the next request | Text "Scene 12, revision 4" | none | `group` (`aria-label="Working on"`) |
| R3.3 | Request form | Choose what to ask and where | "What should it do?" select, "Apply to" select, "Add a note (optional)" box | `Tab` in reading order | `form`, `combobox`, `textbox` |
| R3.4 | Request actions | Send, stop, hand off, and bring an answer back without seeing JSON | "Ask the assistant", "Stop", "Copy for Claude or Codex", "Use a pasted suggestion", "Choose a suggestion file" | `Tab` in that order | `group`, `button`. The file button opens the native file picker |
| R3.5 | Suggestions | Review one suggestion against the current scene | Per-group checkboxes (Look, Action, Sound, Continuity), dialogue check, "Use this suggestion", "Dismiss" | `Tab` in reading order | `region` (`aria-label="Suggestion"`), `checkbox`, `button` |
| D1 | Dialog "Create scenes from script" | Turn the script into empty scenes in one action | "Script source" select, paste box (when "Paste a script"), "Split into scenes by" select, preview summary, "Create N empty scenes", "Cancel" | Modal. Focus to the first control, `Tab` cycles, `Esc` cancels, focus returns to the opener | `dialog` (`aria-modal="true"`, `aria-labelledby`) |
| D2 | Dialog "Update schedule from script" | Linked rebuild with a confirmed count of edited scenes | Summary counts, "Edited scenes" radio group, "Update schedule", "Cancel" | As D1 | `dialog`, `radiogroup` |
| D3 | Dialog "Pick a reference" | Choose one reference with thumbnail, kind, source and state | Dropdown filters (kind, source, show), "Search", list, "Role" select, "Use in this scene", "Cancel" | As D1. The list is one tab stop with `Up/Down`, `Home/End`, `Enter` chooses | `dialog`, `listbox` / `option` (`aria-disabled` for unusable; text only) |
| D4 | Dialog "Move scene" | Place a scene at a number without dragging | "New position" stepper, "Move scene", "Cancel" | As D1 | `dialog`, `spinbutton` |
| D5 | Popover "Folder details" | Show which folders Studio looked at and why each is usable or not | Folder list (read-only path and plain status), "Check again", "Copy details for support", the line "Ask whoever set up this computer to choose the folder." | `Tab` into the popover, `Esc` closes, focus returns to "Folder details" | `dialog` (non-modal) |
| G1 | Hint (inline) | Persistent one-line guidance under a field | Text | none; always in the accessibility tree | plain text referenced by `aria-describedby` |
| G2 | Tooltip | Extra explanation for icon-only controls and abbreviations | Text bubble | Shows on hover and on keyboard focus, `Esc` dismisses, stays open while the pointer is over it | `tooltip` (`aria-describedby` on the trigger) |
| G3 | Toast with undo | Confirm a change and offer undo | Message, "Undo", "Dismiss" | Never takes focus. "Undo" is reachable by `Tab` while visible and from R1.1, R2.1 and R3.1 | `status` for the message, `button` |

The Studio preview, the Studio timeline and the Studio editor undo history are untouched.

## 3. Visual system: DESIGN.md roles, Studio tokens

### 3.1 Role names and how they are implemented

DESIGN.md defines brand tokens by hex. Studio does not use those names; it defines its own roles in `styles/theme.css` (`--color-*`, `--text-step-*`, `--spacing-ctl*`, `--radius-*`), and `styles/hexRatchet.test.ts` forbids new colour literals outside `theme.css`. The contract: **the spec speaks in DESIGN.md roles; Stage B implements each role only through the Studio token in the right-hand column, never a hex literal.** Radius, spacing and type scale follow DESIGN.md directly.

| DESIGN.md token | Role in film panels | Studio token (Stage B uses this) |
|---|---|---|
| `--bg` | Panel background | `--color-bg-0` |
| `--surface` | Cards, rows, dialogs, popovers | `--color-surface` (popups: `--color-raised`) |
| `--surface2` | Inset areas, tab strip | `--color-hover` wash on `--color-surface` |
| `--border` | Separators only | `--color-border` |
| `--border-light` | Hover or active separator | `--color-border-strong` |
| `--text` | Primary text | `--color-text-0` |
| `--text-secondary` | Labels, hints, field boundaries | `--color-text-muted` |
| `--text-tertiary` | **Never for text.** Disabled-control text only | `--color-text-off` |
| `--heading` | Headings | `--color-text-0` |
| `--accent-green` | **Ready**, Verified | `--color-accent-ink` |
| (no DESIGN.md token) | **Blocked**, errors | `--color-danger-ink` |
| (no DESIGN.md token) | **Warnings** `(!)` | `--color-warning-ink` |
| `--accent-blue` | Not used for status | none |
| `--accent-purple` | Not used | none |
| (Studio role) | **Selected row** | `--color-on` wash plus a 3px start bar in `--color-selection`. `--color-selection` is reserved for selection and the playhead (`theme.css`) and is used for nothing else |
| (Studio role) | **Focus ring** | see 3.2 |

Fonts: **film panels inherit Studio's fonts** (`font-sans`, `font-mono` utilities). DESIGN.md names Inter and IBM Plex Mono, but Studio loads neither, and bundling them or importing them from a font CDN adds weight (B11) and a render-time network call. This is a declared deviation from the wording of A11 (OQ-3 answered, 15).

### 3.2 Contrast rules (A11)

Computed from the DESIGN.md hex values and from Studio's oklch values (WCAG relative luminance; Stage B must re-measure computed styles in a real browser, light and dark).

| Pair | Light | Dark | Rule |
|---|---|---|---|
| DESIGN.md `--text` on `--surface` | 17.4 | 14.6 | OK |
| DESIGN.md `--text-secondary` on `--surface2` | 4.55 | 6.66 | OK |
| DESIGN.md `--text-tertiary` on `--surface` | 2.85 | 3.21 | **Fails 4.5.** Not used for text |
| DESIGN.md `--border` on `--surface` | 1.33 | 1.28 | **Fails 3:1.** Separators only |
| Studio `--color-text-muted` on `--color-surface` | 5.7 | 7.6 | Labels, hints, field boundaries, empty-state icon |
| Studio `--color-accent-ink` on `--color-surface` | 6.8 | 9.6 | Ready text and icon, focus ring |
| Studio `--color-danger-ink` on `--color-surface` | 7.8 | 7.6 | Blocked text and icon |
| Studio `--color-warning-ink` on `--color-surface` | 5.9 | 8.9 | Warning text and icon |
| Studio `--color-border-input` on `--color-surface` | about 1.2 to 1.5 | about 1.5 to 2.8 | **Fails 3:1.** See field boundary below |

Rules:

1. **Status colour.** Only Ready (`--color-accent-ink`) and Blocked (`--color-danger-ink`) carry a hue. Empty and Drafted use neutral ink. Warnings use `--color-warning-ink`. Meaning is always carried by icon shape plus text first; hue only reinforces it (A2).
2. **Field boundary (3:1).** Every film field (select trigger, text input, number field, search box, textarea, segmented control) draws a 1px boundary in `--color-text-muted`, not `--color-border-input` and not `--color-border`. Studio's shared `fieldBase` uses `--color-border-input`, so film panels need a film-scoped override (DEP4). Stage B may soften the look only by measuring at least 3:1 against the adjacent surface in both themes. Cards, rows and dividers keep `--color-border` because they are not required to identify a control.
3. **Focus ring (one rule).** 2px solid `--color-ring` (Studio's token, equal to `--color-accent-ink`: 6.8:1 light, 9.6:1 dark on surface), 2px offset, on every focusable element in the film panels and dialogs. It is never suppressed without an equivalent replacement. No other statement about the focus colour exists in this document.
4. **No `--text-tertiary` text, no blue text, no purple.** (`--color-text-off` is for a disabled control's own text only; the reason for the disabled state is always shown in `--color-text-muted`.)

### 3.3 Type, spacing, radius, motion

- Text: body 13px (Studio `text-step-13`, DESIGN.md Caption 0.82rem), hints and labels 12px or 13px in `--color-text-muted`, ids and hashes 12px mono, headings 16px weight 600. No text under 12px (existing `text-[11px]` is retired for film panels).
- Spacing from DESIGN.md `xs 4`, `sm 8`, `md 16`, `lg 24` only. Panel padding `md`. Gap between fields `sm`; between groups `md`.
- Radius: `sm 4` badges, `md 6` buttons and inputs, `lg 8` cards, dialogs and the banner.
- Elevation: borders over shadows. Only popups (menu, select list, tooltip, dialog) use Studio's `shadow-menu` and `shadow-popover`, as Studio already does.
- Targets: film controls are at least 28px high (Studio `h-ctl`). The 24px `h-ctl-sm` size (Studio's `Tab` and `Select` options) is not used in film panels. List rows are exactly 72px (12.8); picker and dropdown options at least 40px.
- Motion: 150 to 200 ms, `ease`/`ease-out`, only on hover, press, focus and popup open/close. `prefers-reduced-motion: reduce` removes all transitions and replaces any spinner with static text "Working..." plus the pending icon (A18).

### 3.4 State vocabulary: text plus icon, never colour alone (A2)

Each state has a distinct icon shape, a text label and a definition that is computed, not judged. Phosphor icon names are proposals.

| State | Icon (shape) | Label | Ink | Definition (computed, 12.7) |
|---|---|---|---|---|
| empty | dashed circle (`CircleDashed`) | "Empty" | `--color-text-muted` | The scene has no preset choice, no action step, no reference link and no applied suggestion. Title, notes and saved needs are ignored for this test |
| drafted | half-filled circle (`CircleHalf`) | "Drafted" | `--color-text-0` | The scene is not empty and at least one required choice is open |
| ready | circle with check (`CheckCircle`) | "Ready" | `--color-accent-ink` | The scene is not empty, no required choice is open and no check is blocking |
| blocked | prohibition sign (`Prohibit`) | "Blocked" | `--color-danger-ink` | The scene is not empty and at least one supplied check is `blocking` |
| working (transient, not a fifth state) | circular arrow (`CircleNotch`), static in reduced motion | "Drafting..." | `--color-text-muted` | A request for this scene is running. Scoped to this row only (A12) |

Precedence: blocked, then drafted, then ready. Required choices for a video scene are coverage style, shot size, lens, light type, mood and scene length. For a still image they are coverage style, shot size, lens, light type and mood (12.3). Place and "Who is in this scene" are advisory (a warning check at most), not required. A missing or unavailable reference never blocks: the scene keeps its state and gets the text "Creative only: 1 reference needed". When no checks exist yet (`checksStatus` is `unavailable`, 12.7) a scene with every required choice made is Ready and its row says "Checks not available yet" so Ready never over-claims.

## 4. Wireframes

ASCII only, checked in so they diff. Width 56 columns for a panel at about 360px. `[ ]` button, `[v]` select (the `v` is the chevron), `( )` radio, `[x]` switch on, `<...>` text that changes. State glyphs in the list: `(-)` empty, `(~)` drafted, `(v)` ready, `(x)` blocked, `(..)` working. Message glyphs: `(i)` information, `(!)` warning. `>` marks the selected or highlighted row.

### 4.1 Where things live in the Studio shell (A4)

Default layout when a film project is connected:

```
+-----------------+--------------------------------+-------------------+
| LEFT group      | CENTER (unchanged)             | RIGHT, top group  |
| [Schedule*]     |  Preview                       | [Production*]     |
|  Compositions   |  --------------------------    |  Design Layers .. |
|  Assets Code .. |  Timeline                      +-------------------+
|                 |  (existing, untouched)         | RIGHT, own group  |
|                 |                                | [Assistant]       |
+-----------------+--------------------------------+-------------------+
 * = active tab.  master list      picture + edit     inspector + helper
```

Rules (these answer review items A4 a, b and c):

1. **Default placement.** `schedule` is the first and active tab of the left group. `production` is the active tab of the top right group. `assistant` sits alone in its own group below it (initial height about 40% of the right column; "Maximize panel" gives either the full window). Master and detail are therefore both visible by default. Production and Assistant are separate tab groups so a producer can read a suggestion while editing the scene.
2. **When it applies.** Only when a film host is connected and the stored layout does not already contain the three panels. A stored layout is never rearranged: a panel missing from it is added in the place above on the first film project load, and a panel the producer closed or moved stays where they put it. With no film host connected, the layout is exactly today's (panels reachable from the Window menu).
3. **`schedule` is `keepMounted`.** Switching the left group to Compositions, Assets, Code or Catalog does not unmount the list, so scroll position, selection and keyboard focus survive.
4. **State does not live in a panel.** Production and Assistant are not `keepMounted`, so everything that must survive their tab being hidden lives in R0 (the film host, mounted by `FilmDockPanels`, which `StudioRightPanels` always renders): selection, filter, inspector tab, note drafts, the live region (R0.1), the toast host and the film history (11.3).
5. Selecting a scene never switches dock tabs and never moves focus. "Open in Production" (the empty-row action, double-click, `Enter`) activates the Production tab if hidden and moves focus to its heading (R2.1).

Registry and layout changes are in DEP1.

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
|     [Check again] [Folder details]                       |
+----------------------------------------------------------+
| Scenes (list, 100)   Up and Down choose a scene. Enter   |
| does the next action. Shift+F10 opens scene actions.     |
|  (v) Scene 01  Galileo: "Good evening, gentlemen..."     |
|      Ready - Next: Prepare for generation                |
|      Look: Medium close-up, Candlelight, Tense  1 needed |
| > (~) Scene 02  Newton: "You have not eaten."            |   <- selected
|      Drafted - Next: Choose lens                         |
|      2 choices left: Lens, Mood                  2 refs  |
|  (-) Scene 03  Galileo: "The wine is from Padua."        |
|      Empty - Next: Choose the look                       |
|      Pick a shot, light and mood, or ask the assistant.  |
|  (x) Scene 04  Newton: "Then explain the moon."          |
|      Blocked - Next: Fix "Two camera moves at once"      |
|      Pick one camera move.                               |
|  (..) Scene 05  Galileo: "It moves, as I said."          |
|      Drafting...                                         |
|      Working on this scene only.                         |
|  ... 95 more (virtualized; the DOM holds visible rows)   |
+----------------------------------------------------------+
```

Row anatomy (R1.3). Every row is exactly 72px and exactly three single-line text lines, truncated with an ellipsis; the full text is in the inspector (12.8):

1. Line 1: state icon (`aria-hidden`), scene number, title (the script line's speaker and first words).
2. Line 2: state label, then "Next:" and the primary action label (section 5).
3. Line 3: the one-line reason on the left; a text-only reference note on the right ("2 refs", "1 needed", "1 unavailable"). A ready scene shows its look summary on the left. A ready scene with unavailable checks says "Checks not available yet". A scene with a reference gap says "Creative only: 1 reference needed" on line 3 when there is room, otherwise the short note.
4. **Nothing inside an option is interactive.** No "More" button, no clickable "Next:" text, no chip button (A8). The option's accessible name is its text, composed in reading order: "Scene 2, Drafted. Newton: 'You have not eaten.' Next: Choose lens. 2 choices left: Lens, Mood. 2 references."
5. Wide layout (panel at least 640px, for example maximized) rearranges the same three lines into columns (Speaker, Length, Coverage, References, line id in mono). The row stays 72px.

Parity for non-keyboard users, with no control inside the option:

- Click selects. Double-click runs the primary action. Right-click opens the scene actions menu (R1.4).
- The "Scene actions" button in the Production header (R2.1) opens the same menu for the selected scene.
- The primary action also exists as a real button in the Production action bar (R2.7).

### 4.4 Production inspector, Scene tab, empty scene (R2.1 to R2.3, R2.7)

```
+----------------------------------------------------------+
| Production                           [Maximize] [Menu]   |
+----------------------------------------------------------+
| Scene 3 of 100            (-) Empty                      |
| [< Previous scene] [Next scene >] [Scene actions v]      |
| [Undo] [Redo]                                            |
+----------------------------------------------------------+
| [Scene] [Look] [References] [Check]                      |
+----------------------------------------------------------+
| Script line (exact words, can't be edited here)          |
| Galileo: "The wine is from Padua."                       |
| Voice  [ Choose a voice                            v]    |
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
| Output   (o) Video   ( ) Still image                     |
| Coverage style                                           |
| [ Choose a coverage style                          v]    |
| How the scene is shot, for example one face, or a hand.  |
|                                                          |
| Scene length                                             |
| [ Choose a length                                  v]    |
|                                                          |
| Action steps (one clear action per step)                 |
|  No steps yet.  [ Add an action step ]                   |
|                                                          |
| Notes (optional)                                         |
| [                                                  ]     |
+----------------------------------------------------------+
| [ Choose the look ]   [ Ask the assistant to help ]      |   <- R2.7, sticky
+----------------------------------------------------------+
```

The sticky action bar never covers the focused control: the scroll container sets `scroll-padding-bottom` to the bar height so focus scrolls clear of it (A9). "Voice" shows only when the host supplies voices or a voice; otherwise the line reads "Voice: not set by the host" and, where the coverage style needs a voice, the Check tab says "Voice needed" (12.5).

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
| (v) Ready                      [Check again] [Undo][Redo]|
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
| [ Ask the assistant ] [ Stop ]                           |
| Or ask somewhere else and bring the answer back:         |
| [ Copy for Claude or Codex ]                             |
| [ Use a pasted suggestion ] [ Choose a suggestion file ] |
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

Return path without JSON (A1). The producer copies the request with "Copy for Claude or Codex", runs it in their own Claude or Codex session, copies that session's final answer, and comes back:

- **"Use a pasted suggestion"** reads the clipboard when the producer presses it (a user gesture, so the browser allows it). **"Choose a suggestion file"** opens the file picker for an answer saved as a file. Neither shows a text box; Studio never displays the pasted content.
- The host parses and validates the content with the film-production parsers. A valid suggestion appears in R3.5 exactly like one from "Ask the assistant". An invalid one produces a plain message and changes nothing: "That wasn't a scene suggestion. Nothing changed." / "That suggestion is for a different scene. Nothing changed." / "That suggestion changed the dialogue, so it can't be used." / "Studio couldn't read the clipboard. Choose a suggestion file instead."
- The target is frozen when the request is copied. A suggestion that arrives after the producer has moved to another scene is shown against its own scene ("Suggestion for Scene 3") and offers "Go to Scene 3", never applies to the current one.
- The copied request asks the other tool to return only its final answer, so there is nothing to trim (a Stage C instruction, OQ-12). The producer may still see JSON in the other tool's window; Studio never asks them to read, edit or type it.

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
| Search [                                           ]     |
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
              [Folder details]

missing:  (!) Asset folder not found at <path>.
              Scenes still work. References can't be picked yet.
              [Check again] [Folder details]

denied:   (!) Asset folder can't be read at <path>.
              Check that this computer is allowed to open it.
              [Check again] [Folder details]

partial:  (!) 1 of 2 asset folders is unavailable: <path>.
              References from the other folder still work.
              [Check again] [Folder details]

no list:  (i) No asset list found in the asset folder.
              Scenes still work. References can't be picked yet.
              [Check again] [Folder details]

bad list: (!) The asset list is missing a column: sha256.
              Scenes still work. References can't be picked yet.
              [Check again] [Folder details]

bad rows: (!) 3 rows in the asset list have problems, first on line 12.
              The other references still work.
              [Folder details]

unknown location:
          (i) 12 assets use a location Studio doesn't know yet.
              They are listed but can't be picked.
              [Folder details]

workspace:(!) The film workspace couldn't be used: the active film
              isn't listed in the workspace file.
              Scenes still work. References can't be picked yet.
              [Check again] [Folder details]

none usable:
          (i) 14 files found. None can be used yet because none
              has a recorded checksum.
              [Folder details]
```

The asset-list and workspace variants map to the strict validation and importer errors in 9.5 and 12.12. At most one banner shows; when several apply, the most blocking one (folder, then workspace file, then asset list, then rows, then locations) leads and "Folder details" lists the rest. The banner never carries a sample asset, a stand-in thumbnail or invented counts. `<path>` is read-only text.

### 4.12 Create scenes from script, D1 and D2

```
+--------------------------------------------------+
| Create scenes from script                        |
+--------------------------------------------------+
| Script source                                    |
| [ Script already imported for this project     v]|
|   (disabled when Studio can't read lines from it:|
|    plain reason shown; Paste is chosen.)         |
| Split into scenes by                             |
| [ One scene per script line                    v]|
| Preview                                          |
|  Found 98 script lines. 98 scenes will be made.  |
|  3 lines have no speaker. First: Galileo, ...    |
| [ Create 98 empty scenes ]  [ Cancel ]           |
+--------------------------------------------------+

Paste source adds, above Split:
| Paste your script                                |
| [                                              ] |
| One script line per row. Write "Name: words" to  |
| say who speaks. A blank row starts a paragraph.  |

+--------------------------------------------------+
| Update schedule from script                      |
+--------------------------------------------------+
| The script changed since the scenes were made.   |
|  92 scenes stay the same                         |
|  4 new scenes will be added                      |
|  8 scenes no longer match a script line          |
|    2 of them you never edited (removed)          |
|    6 of them you edited                          |
| Edited scenes                                    |
|  (o) Keep my edits (recommended)                 |
|  ( ) Replace 6 edited scenes                     |
| [ Update schedule ]  [ Cancel ]                  |
+--------------------------------------------------+
```

How D2 counts, and what "edited" means, is in section 8.

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
| [ Choose the look ]    |
| [ Ask the assistant ]  |
+------------------------+
```

Rules: no fixed widths in the panels; row columns beyond title collapse (the wide-layout columns hide); buttons wrap; dialogs become full-screen sheets under 480px; "Maximize panel" gives a panel the whole viewport.

## 5. Slot states and next actions (A2, A3)

The primary action and one-line reason come from the state. The same label appears on the list row (text), the scene actions menu and the inspector action bar (real button). The empty-scene label is deliberately different from the assistant task "Draft this scene" (section 6.14), because the two do different things: "Choose the look" opens the Look tab so the producer picks presets; "Draft this scene" in the Assistant asks for a suggestion.

| State | Primary action (label) | One-line reason | Opens |
|---|---|---|---|
| empty, no saved need | "Choose the look" | "Pick a shot, light and mood, or ask the assistant." | Production, Look tab, first unset field focused |
| empty, with a saved reference need | "Pick a reference" | "Needs: portrait of Galileo." (the saved need) | Production, References tab, picker D3 open |
| drafted | "Choose <first open choice>" for example "Choose lens" | "2 choices left: Lens, Mood." | Production, tab holding that choice, field focused |
| blocked | "Fix: <first blocking issue>" | The issue in plain words, for example "Pick one camera move." | Production, Check tab, "Go to field" target focused |
| ready | "Prepare for generation" | "All checks pass. Nothing is sent until you release it." or, when no checks exist yet, "Checks not available yet." | Runs prepare for this scene (`onPrepare`) |
| any, request running | no new action | "Drafting..." in this row only | none |

Rules:

- One primary action per slot, never two. Secondary actions live in the scene actions menu (R1.4).
- An empty slot is never a blank box: it always shows the action and the reason.
- State counts feed the "Show" filter: "All scenes (100)", "Empty (87)", "Drafted (9)", "Ready (3)", "Blocked (1)", "Needs a reference (12)". Changing the filter announces "Showing 87 of 100 scenes" through R0.1.

## 6. Preset and dropdown inventory (A5)

Every open-ended list ends with "Custom". Choosing "Custom" reveals one short box under the select, labelled "Note for Custom" (up to 120 characters, never required). It is a note about that one field, stored as prose intent (A1 exception, 0). A Custom with an empty note is still an open choice (12.2). A hint is one line, at most about 70 characters. Ids are stable. The "Stored in" column is the `SceneBriefV1` field Stage C fills; it is informational.

The first option in every select is a non-choice, "Choose ..." (value empty), which keeps "unset" visible and counts as an open required choice. The select never silently picks a default.

### 6.1 Coverage style `P-COVER` (Stored in: `authoring.patternId`; `Custom` stores null)

| id | Label | Hint |
|---|---|---|
| restrained-dialogue | Restrained dialogue | Hold a readable face and let the line land. |
| listening-reaction | Listening reaction | Show who hears the line and how it changes them. |
| prop-hand-insert | Prop and hand insert | A hand and an object finish one action up close. |
| establishing-continuity | Establishing the room | Show the room, light and direction the next scene must match. |
| reference-led-motion | Follow a motion reference | Copy the movement from a reference; add no new camera idea. |
| custom | Custom | None of these. Say it in a note. |

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
| custom | Custom | None of these. Say it in a note. |

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
| custom | Custom | None of these. Say it in a note. |

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
| custom | Custom | None of these. Say it in a note. |

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
| custom | Custom | None of these. Say it in a note. |

### 6.6 Focus `P-FOCUS` (`camera.focusIntent`)

| id | Label | Hint |
|---|---|---|
| all-sharp | Everything sharp | Foreground and background both clear. |
| soft-background | Soft background | Subject sharp, background blurred. |
| on-face | Stay on the face | Focus holds on the person's face. |
| on-object | Stay on the object | Focus holds on the prop. |
| shift-focus | Shift focus | Focus moves from one person or object to another. |
| custom | Custom | None of these. Say it in a note. |

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
| custom | Custom | None of these. Say it in a note. |

| id | Label | Hint |
|---|---|---|
| front | From the front | Flat and even. Shows everything. |
| side-left | From the side, left | Shapes the face. Shadow falls right. |
| side-right | From the side, right | Shapes the face. Shadow falls left. |
| back | From behind | A bright edge around the person. |
| top | From above | Shadows under the brow and chin. |
| under | From below | Eerie, like a flashlight under the chin. |
| all-around | Soft from all around | Very gentle. Almost no shadow. |
| custom | Custom | None of these. Say it in a note. |

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
| custom | Custom | None of these. Say it in a note. |

| id | Label | Hint |
|---|---|---|
| warm-amber | Warm amber | Candle and wood tones. |
| cool-blue | Cool blue | Night, distance, calm. |
| earth | Earth tones | Browns, ochre, olive. Period feel. |
| muted | Muted and faded | Low colour, like an old print. |
| vivid | Vivid | Rich, saturated colour. |
| black-white | Black and white | No colour at all. |
| custom | Custom | None of these. Say it in a note. |

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
| custom | Custom | None of these. Say it in a note. |

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
| | custom | Custom | None of these. Say it in a note. |
| Exit `P-EXIT` (`continuity.exitAnchor`) | ready-next | Ends ready for the next scene | Leaves things set up for what follows. |
| | open | Open ending | No match needed. |
| | custom | Custom | None of these. Say it in a note. |

### 6.11 Scene fields

| Control | Options | Hint |
|---|---|---|
| Who is in this scene `P-CAST` (multi-select, `subjects[]`) | Characters from the project (provided by props); "Custom" adds a name | "Pick everyone who appears, even if they don't speak." |
| Place `P-PLACE` (`setting.place`) | Places from the project (provided by props); "Custom" | "Choose from your project's places, or Custom." |
| Scene length `P-LENGTH` (`output.durationFrames`) | 2 s, 3 s, 4 s, 5 s, 6 s, 8 s, 10 s | "About how long the scene runs. Account limits are checked in Check." |
| Action step `P-ACTION` (`beats[].subjectMotion`; per step also `P-ENDING`, and "Starts at" and "Ends at" steppers, 12.3 and 12.4) | Stays still and speaks; Turns to look; Walks into frame; Sits down or stands up; Picks up an object; Sets an object down; Leans in; Reacts to what was said; Custom | "One clear action per step with a visible end." |
| Where to make it `P-ROUTE` (`output.routePreference`, in Check) | No preference; Kling; Higgsfield; ComfyUI; Local | "No preference decides at release. Choosing one sends nothing." |
| Output kind `P-KIND` (segmented, `output.kind`) | Video; Still image | "Video makes a clip. Still image makes one picture." |

Action steps are bounded by the scene length: the "Ends at" stepper cannot exceed it and steps cannot overlap (the stepper stops at the nearest valid value with a visible message, never silently). Rules for frames, fps and still images are in 12.3.

Ending of an action step `P-ENDING` (`beats[].observableEnd`, required per step):

| id | Label | Hint |
|---|---|---|
| holds-still | Holds still | Ends in a pause the viewer can see. |
| settles | Settles into place | Ends with the person or object at rest. |
| looks-away | Looks away | Ends with a change of gaze. |
| finishes-gesture | Finishes the gesture | Ends when the hand or body movement completes. |
| silence-follows | Silence follows | Ends with a beat of quiet. |
| custom | Custom | None of these. Say it in a note. |

Voice `P-VOICE` (closed list from the host, no Custom; 12.5): "Choose a voice", then the host's voices. Hint: "The voice for this speaker. Studio never picks one for you."


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
| draft | Draft this scene | Asks for a suggestion that fills every empty choice from the script line. |
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
| claude | Claude (copy and paste) | Studio prepares the request. You run it in Claude Code, then bring the answer back with "Use a pasted suggestion". |

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

A smart hint is a single sentence shown under the field it concerns, computed from the current choices. It is advice, never a hidden change: nothing is auto-corrected. Each hint has an id, a severity (`info` or `warning`, icon plus text), an optional single fix button, and is announced once when it appears through R0.1 (polite). A hint appears at most once per field and disappears when its condition is gone. Hints are data supplied by props (`{ id, severity, text, fieldId, action? }`); the rule engine is Stage B/C.

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
| H10 | Asset folder unavailable | "Asset folder not configured. Scenes still work. References can't be picked yet." | "Folder details" |
| H11 | Assistant suggestion differs from the script line | "The suggestion changed the dialogue. It can't be used." (suggestion is rejected, host re-validates) | "Dismiss" |

H2, H4, H6 are the only hints with a one-click fix. A fix button is a normal button, announces the change through R0.1 and is undoable.

### 7.4 Button labels (clear and plain)

| Old (current code) | New | Notes |
|---|---|---|
| `Prepare` | "Prepare for generation" | Hint: "Saves your plan. Nothing is sent or paid for." |
| `Apply proposal` / `Apply` | "Use this suggestion" | Never "Apply". Disabled with reason when there is nothing to use. |
| `Send` | "Ask the assistant" | |
| `Cancel` (assistant) | "Stop" | Stops the running request. Distinct from dialog "Cancel". |
| `Copy handoff` | "Copy for Claude or Codex" | Result: "Copied. Run it in Claude or Codex, then use \"Use a pasted suggestion\"." |
| (none) | "Choose the look", "Pick a reference", "Choose lens" (and other `Choose <choice>`), "Fix: <issue>" | Section 5 |
| (none) | "Create scenes from script", "Create N empty scenes" | N is the real count |
| (none) | "Update from script", "Update schedule" | |
| (none) | "Add a reference", "Use in this scene", "Remove link" | |
| (none) | "Go to <field>" | Moves focus to the field named in a check |
| (none) | "Undo", "Redo", "Dismiss", "Check again", "Folder details", "Copy details for support", "Previous scene", "Next scene", "Scene actions" | |
| (none) | "Use a pasted suggestion", "Choose a suggestion file" | Bring an answer back without seeing JSON (4.8) |

Rules: a label is a verb plus the object, in sentence case, with no abbreviations and no codes. A destructive label names what is lost ("Replace 6 edited scenes"). A button never says only "OK" or "Apply". Dialog primary buttons repeat the action and the count.

## 8. Script to about 100 empty scenes (A2, A14)

Goal: one action, offline, no model. All scenes start empty. Ids derive from the source lines, so re-running is idempotent (Gate C item C7). The model of a script line and a scene is in 12.1.

### 8.1 Flow

1. The producer opens Schedule. With no scenes, R1.5 shows "No scenes yet" and one button, "Create scenes from script" (4.2).
2. The button opens D1. Focus lands on "Script source".
3. "Script source" lists what exists, each with a hint:
   - "Script already imported for this project": "Uses the lines from your film import." The film workspace file exists (9.5), so the importer path applies. The option is offered when the `ScriptSourceAdapter` returns lines (12.12). When it cannot, it is disabled with the plain reason beside it ("The film workspace couldn't be used: ..." for an importer error from 9.5, or "Studio can't read lines from the project script file yet." because the script file's layout is not yet specified, OQ-6) and "Paste a script" is chosen. The producer is never left with a dead dialog.
   - "Script from the asset folder": offered only when the adapter reports lines there; otherwise disabled with the plain reason ("Asset folder not configured." or "No script found in the asset folder.").
   - "Paste a script": shows the paste box (4.12). Dialogue is free text by A1.
4. "Split into scenes by": "One scene per script line" (default), "One scene per speaker turn", "One scene per paragraph". Hints: "Each line becomes its own scene.", "Consecutive lines by the same speaker share a scene.", "A blank row starts a new scene."
5. The preview updates live and is read by R0.1: "Found 98 script lines. 98 scenes will be made. 3 lines have no speaker." Nothing is created yet. A line without a speaker still makes a scene, flagged "No speaker" on its row.
6. "Create 98 empty scenes" is the only way forward. The number on the button is the real count. It is disabled while the preview is loading or the source is empty, with the reason shown.
7. On confirm: the dialog closes, focus moves to the scene list, Scene 1 is selected, all rows read "Empty - Next: Choose the look", and R0.1 announces "Created 98 empty scenes. Scene 1 selected." A toast offers "Undo", which removes all 98 in one step (A13). The "Show" filter reads "Empty (98)".
8. The producer then works scene by scene, or asks the assistant with "Apply to: All empty scenes (98)".
9. Running D1 again on an unchanged script changes nothing and says "Nothing to create. 98 scenes already match."

### 8.2 Paste grammar (shown only as the plain hint in 4.12)

Tolerant, never an error for ordinary writing:

- Each non-blank row is one script line. A blank row ends a paragraph.
- A row of the form `Name: words`, where `Name` is 1 to 40 characters with no colon, gives that row a speaker. Any other row has no speaker.
- The text after the colon is kept exactly as typed (only the line break is removed). Dialogue is never trimmed, reworded or retyped by Studio (C1).
- Stage directions are not a separate kind: a row is a script line or it is not in the script. (OQ-6: whether the project script has stage directions is blocked on the producer.)

### 8.3 Line ids (hash-based, not positional)

- An imported line keeps the id it has in the source. If a source id is not a producer-safe id (`^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$`), the adapter reports "script lines have invalid ids" and offers Paste.
- A pasted line gets `line-` plus the first 8 hex characters of the SHA-256 of its normalised speaker and text. Normalisation is for hashing only (trim, collapse runs of white space to one space, Unicode NFC); the stored text is the exact text. An exact duplicate of an earlier line gets `-2`, `-3` and so on in order of appearance.
- The id does not change when other lines are inserted, removed or reordered. It does change when the line's own words change, and Studio says so: a reworded line is one removed line and one new line (8.4). A separate display number (the position, 1 to N) is shown to the producer and is never used as a key (B3).

### 8.4 Updating from the script (D2, A14)

- **Match** by `lineId`. A scene is matched when its first line's id is in the new script.
- **Unchanged**: the scene's lines and their order are the same.
- **New**: a new script line not in any scene. A new scene is added after the scene of its script predecessor.
- **No longer match**: a scene whose first line is gone (removed, or reworded, which changes the id).
- **Edited** (the number D2 reports): a scene that is not Empty, or whose title, notes, needs, presets, links, steps or suggestions the producer changed since it was created or last replaced. A scene that is Empty and untouched is not edited.
- Scenes that no longer match and were never edited are removed (undoable, counted in the dialog). Scenes that no longer match and were edited stay, tagged "Script line removed", under the default "Keep my edits (recommended)". The alternative "Replace 6 edited scenes" removes those 6 and needs a second confirm line: "This removes your edits in 6 scenes. You can undo." Nothing is overwritten silently, and the default never discards an edit.
- If nothing changed, D2 says "Nothing to update. 98 scenes already match." and offers only "Close".
- Scenes the producer has moved keep their positions; new scenes follow their script predecessor.

Undo coverage (A13) is one scope across the three film panels (11.3): create, update, clear, remove, duplicate, move, every preset change, reference link and unlink, need add and remove, step changes, and "Use this suggestion". Each is one undo step labelled in its tooltip ("Undo: move scene 12").

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

Kind: image, video or audio (a `doc` is listed but not selectable). Source: the provenance kind (Asset registry, Import, Review file; B27) and, for registry rows, the CSV `source` text beside it (9.5). Id: the registered id in mono. Short hash: first 8 hex characters of the sha256 in mono, `--------` when none. Thumbnail 48px; for audio a waveform icon; when the file is not available the box shows the text "No preview". No sample or placeholder asset ever appears (A16).

Files on disk with no registered id appear only under "Files not in the registry", collapsed by default, listing path and short hash, not selectable, with "No registered id, so it can't be used." (B28). The producer is never offered a generated id.

### 9.2 Unavailable references (A17)

When a bound reference's asset is not usable (any state other than verified, or the folder is down), the link stays: the row keeps the reference id, shows an icon and "Unavailable" plus the reason from 9.1 or from the folder state, and the scene gets the badge "Creative only: 1 reference needed". Slots and character entries keep working. The link is only removed by "Remove link". Reconnecting the folder re-checks and the row returns to its real state without any rebind.

### 9.3 Asset-folder banner (A16)

Copy and variants are in 4.11. Rules: it appears only when no usable folder or asset list exists (or one of several is down); it is persistent while true (no dismiss); it is one banner, not many; it blocks nothing outside reference picking; and it announces once, politely, when it first appears. "Folder details" opens D5, a non-modal popover listing each folder Studio looked at with its path (read-only) and a plain status ("Not configured", "Not found", "Can't be read", "No asset list", "OK"), plus one line: "Ask whoever set up this computer to choose the folder." It also has "Check again" and "Copy details for support" (copies a plain-text summary; Studio does not display codes). **No setting, key, variable, flag or command name is ever shown.** The producer never needs D5 to keep working.

There is no folder browser in Stage B (OQ-5 answered, 15). The producer-facing consequence is stated honestly: an unset folder shows the banner and references stay unavailable until whoever runs the computer sets it up.

### 9.4 Operator route for the host path (documentation only, never in the UI)

This is for `docs/` and the Stage B PR, not for any producer screen.

| Property | Proposal |
|---|---|
| Key name | `filmAssetRoots` (typed config), environment variable `HYPERFRAMES_FILM_ASSET_ROOTS` |
| Form | An ordered list of absolute host folders. In the environment variable, entries are separated by the OS path delimiter (`:` on Linux, the only host the design qualifies). Optional repeatable CLI flag `--film-asset-root <path>` on `hyperframes preview`; the flag wins over the variable. |
| Default | **Unset** (empty list). No built-in path, no `/mnt/data`, no sample folder. |
| Why an env var plus flag | `bun run studio` starts Vite and takes no CLI flags, while `hyperframes preview` is the built-CLI route. An environment variable is the only form that reaches both. The existing `film:*` scripts keep their own flags and are untouched. The producer's real launch command is unknown (OQ-10), so the UI does not depend on how Studio was started. |
| Validation at startup | Each entry must be absolute, exist (else reason `missing`), and be a readable directory (else reason `denied`). Unset gives `unset`. The result is a typed `root-unavailable` with that reason (B33), never a fallback to samples. Paths are canonicalised with `realpath`; escaping symlinks are refused (B30). |
| Where the producer meets it | Only the banner and D5 (4.11, 9.3), in plain words. |
| Read-only | The indexer never writes, creates or deletes inside a root (B26). |

It fits the two producer roots in `local-asset-roots.md`: the Movies_Projects folder (the one holding `workspace.json`) and the film workspace (`.film-workspace/`: imports and the review file), as two list entries. Studio resolves the active film's project folder from `workspace.json` and reads `asset-registry.csv` there (9.5); an entry that is itself a project folder (it holds `asset-registry.csv`) is also accepted. This is a proposal for Stage B to ratify.

### 9.5 The asset registry and the film workspace (closed facts)

Verified live by the producer on pop-os; the cloud VM cannot see these files and never claims any asset from them. Stage B tests use synthetic fixtures only, including a miniature CSV with exactly this header.

**Film workspace file.** `Movies_Projects/workspace.json` exists (schema version 1.0, name `Movies_Projects`, active film `andre-time-travel`, project root `projects/andre-time-travel`). The importer path in `legacy/import-movies.mjs` therefore applies, and there is no "workspace file may be missing" fallback branch. The only remaining states are the honest errors the importer already raises, shown in plain words (4.11, 10): the file cannot be read or is not valid, it names no active film, the active film is not exactly one listed project, a project document sits outside the project folder, or the production documents are missing. Studio never claims the real file satisfies the importer's rules; it runs the importer's own validation and reports its result.

**Asset registry header, exactly:** `asset_id,kind,path_or_provider_id,path_base,source,sha256,approved,notes`, in the project folder as `asset-registry.csv`.

Strict validation (B34):

- The header must contain all eight names, matched case-sensitively after removing a byte order mark; order does not matter and extra columns are ignored. A missing column is a list-level error: "The asset list is missing a column: sha256." No row is read.
- The file is parsed as quoted CSV (commas and line breaks inside quotes are valid, as `notes` may need them). Bad quoting, a wrong field count, an empty `asset_id`, an `asset_id` that is not a producer-safe id, a duplicate `asset_id` (both rows are flagged) and a non-empty `sha256` that is not 64 hex characters are row problems. **Rows with problems are never dropped:** each is reported with its line number in the banner ("3 rows in the asset list have problems, first on line 12") and listed in the picker under "Rows with problems", not selectable, with the line number and the reason.

Column to index record (B27):

| CSV column | Index record field | Handling |
|---|---|---|
| `asset_id` | `assetId` | Verbatim. The only id source for registry rows. No id is ever generated |
| `kind` | `kind` | Mapped through a typed table to `image`, `video`, `audio` or `doc`. A value not in the table gives "Kind unknown": listed, not selectable. `doc` is listed but not selectable ("Documents can't be used as references.") |
| `path_or_provider_id` + `path_base` | `locator` | See "Path base and provider ids" below |
| `source` | `provenance.origin` | Kept verbatim and shown read-only as the row's source text. The record's provenance kind is `registry-csv`, with the CSV file reference and its hash. Import and review records keep `import-json` and `review-json` |
| `sha256` | `sha256` | Empty: the state is `observed-unverified`. Present: compared with the observed hash (async, bounded, cached by path, size and mtime; B31) to give `verified` or `hash-mismatch` |
| `approved` | `approved` | Read-only display, see "Approved" below |
| `notes` | `notes` | Read-only text, shown as a secondary line. Because the registry has no title column, the row title is the import or review record's name when there is one, otherwise the first line of `notes`, otherwise `asset_id` |

**Path base and provider ids.** The header is known; the values in `path_base` are not (no sample row was provided), and none is invented. Stage B ships `PATH_BASES`, a typed table from a `path_base` value to one of two kinds: `file` with a root-relative base folder, or `provider` (the `path_or_provider_id` is an identifier at a generation provider, not a file). The table is filled from the producer's real vocabulary (OQ-15) and never from a guess.

- `file`: the id column is a path relative to the base. It is resolved with the importer's `ownedPath` confinement (real path stays inside the root, escaping symlinks refused), stored root-relative with forward slashes and no `..`. A path that escapes is state `invalid`; a missing file is `missing`.
- `provider`: the item is not a file on this computer. It is listed under "Provider items (not files on this computer)", has no thumbnail, is never hashed, is not selectable, and says "Can't be used as a reference until it is a file on this computer." It keeps its `asset_id` and provider id as read-only text. It is never given a file state it has not earned.
- A `path_base` not in the table is `unresolved`: listed, not selectable, "Studio doesn't know this location yet." The banner counts them: "12 assets use a location Studio doesn't know yet." "Copy details for support" includes each distinct `path_base`, `kind` and `approved` value with its count (never paths or hashes), so the real vocabulary can be reviewed and added to the tables without opening the file.

**Approved.** The `approved` column is shown, never changed. Studio has no approve control, never writes the column, and never infers an approval from a hash, a link or a suggestion (approval stays external, `PRODUCTION-DESIGN.md`). Display: an empty value is "Approval: not recorded"; a value the typed `APPROVED` table recognises as affirmative or negative is "Approved" or "Not approved"; any other value is shown verbatim as "Approval: <value>". The value never gates selection (verification by checksum does, A15). A scene that links an asset not recorded as approved gets a host-supplied warning check, never a blocker (OQ-16).

**Other facts.** Only `verified` assets can be bound (a binding needs `referenceId` and `sha256`, `parse/scene.ts`). The CSV has no archived column, so `archived` comes only from import and review records. Registry rows and import records for the same `assetId` are shown once, with the registry row as the id source.

**Launch command.** The producer's verified live preview command is in 1.4. Nothing in the UI depends on how Studio was started.

## 10. Empty, loading and error states (A3, A12, A16, A17)

Pending and error states are scoped to the smallest region that owns them. Every state change that is not a direct result of the keystroke goes through R0.1 (polite). Errors are polite too and are also shown as persistent visible text next to what failed (11.5).

| Region | Empty | Loading | Error |
|---|---|---|---|
| R1 Schedule | "No scenes yet" with "Create scenes from script" (4.2). Filter yields none: "No scenes match this filter." plus "Show all scenes". | Scenes come from the script offline and appear immediately; only badges (reference counts, folder status) load. Skeleton rows are not used for scenes. | Script source unreadable: "Couldn't read the script. Nothing was changed." plus "Try again" in D1. Save failure on a row: toast "Couldn't save changes to Scene 12. Retry" with "Retry". |
| R1 row | The empty-slot layout in 4.3 | "Drafting..." with the working icon, this row only | Blocked state with the issue and "Fix: ..." |
| R1.2 Banner | not shown when folders and the asset list are fine | "Checking asset folder..." (static label under reduced motion) | The seven variants in 4.11, including "No asset list found" and "The asset list could not be read (problem on line N)" |
| R2 Production | No scene selected: "Pick a scene in Schedule." plus "Go to Schedule". No project connected: "No film project is connected. You can still read presets; saving is off." | Per-tab loading text only where data is truly loading: "Reading your references..." | Save failure and conflict (below) |
| R2.5 References | "No references yet. Add one, or save what the scene needs." with "Add a reference" | "Reading your references..." | Unavailable rows (4.6); folder down: banner copy repeated inline once |
| D3 Picker | "No references found. Check the filters." / "No registered references." / folder down: "Asset folder not configured. Nothing to pick." / none usable: "14 files found. None can be used yet because none has a recorded checksum." | "Reading your references..." | "Couldn't read the references. Nothing was changed." plus "Try again" |
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
- Focus is visible on every control by the single rule in 3.2. Tab order follows reading order. Dialogs trap focus, return it to the opener on close and label themselves. The tooltip layer never takes focus.
- Selecting a scene by arrows does not move focus anywhere. After actions: create scenes returns focus to the list; "Use this suggestion" returns focus to the assistant heading; "Remove link" moves focus to the next reference row or "Add a reference".

### 11.2 Scene list (A7, A8, B2)

`role="listbox"`, `aria-label="Scenes"`, not multi-selectable, `aria-describedby` the one-line key hint shown above the list. Each `option` has `aria-selected`, `aria-posinset`, `aria-setsize` (the real total, because rows are virtualized; B2). **Options have text-only children** (icons are `aria-hidden`). There is no button, link, chip button or menu trigger inside an option, so axe `nested-interactive` cannot fire and screen readers read the whole row (A8). Roving `tabindex`: the selected option has `tabindex="0"`, the others `-1`. Selection follows focus. `Home`, `End`, `PageUp` and `PageDown` scroll to the target index first, then focus the row, so unmounted rows are reachable. Digits type-ahead to a scene number (200ms buffer). `Enter` runs the primary action and announces what it did. The reference picker list (D3) uses the same pattern; unusable options are `aria-disabled` text rows, still focusable, with the reason in the row text.

### 11.3 One film undo scope and Studio key conflicts (A13, DEP2)

**One film history.** R0 holds a single linear history for every film mutation made from the Schedule, Production or Assistant. Undo and Redo buttons are in R1.1, R2.1 and R3.1 (each with the action name in its tooltip and label, for example "Undo: change lens"). The Assistant adds only applied changes to the history: asking, stopping and dismissing are not undoable steps; "Use this suggestion" is one step.

**Keys.** `Cmd/Ctrl+Z` and `Shift+Cmd/Ctrl+Z` (and `Ctrl+Y`) act on the film history while focus is inside an element with `data-film-scope`, which R1, R2 and R3 all carry. Studio's `shouldIgnoreHistoryShortcut` (`utils/studioHelpers.ts`) must also return true for targets inside `[data-film-scope]` so `handleUndoRedoKey` does not run, and the film handler runs instead. (Studio's `timelineOwnsKey` is not the right precedent here: undo does not use it. The pattern is the `[data-studio-timeline]` guard in `appHotkeysDispatch.ts`, extended to the history shortcut.) Outside film scope, `Cmd/Ctrl+Z` keeps its Studio meaning. Modal film dialogs already own plain keys through the `[role=dialog][aria-modal=true]` entry in `typingTarget.ts`.

Studio's global hotkeys also claim `Space`, `f`, `s`, `r`, `k`, `g`, `z`, `j`, `l`, `m`, `Delete` and arrows over the player. The film panels use only: arrows, `Home/End`, `PageUp/PageDown`, `Enter`, `Esc`, digits, `Delete`, `Alt+Up/Down`, `Shift+F10`, and the undo keys above. No single-letter shortcut is added. Stage B must mark the scene list as owning plain keys, the way `[role='slider']` already is.

**What survives** (R0 state, 4.1): selection, filter, inspector tab and note drafts survive switching dock tabs. Scene content survives a reload because the host persists scene records (12.10). The undo history is session memory and is cleared on reload or project switch; the Undo buttons say so by being disabled with the reason "Nothing to undo in this session."

### 11.4 Non-dragging alternatives (A10)

Every drag has a menu or keyboard equivalent: reorder with `Alt+Up/Down`, "Move up", "Move down" or "Move to position..." (D4, a stepper); linking a reference uses the picker button, never a drag from the asset browser; bulk apply uses the "Apply to" select. No control in this design needs a drag.

### 11.5 Live regions (A12)

R0.1 is the single polite region for the Schedule and Production (`aria-live="polite"`, `aria-atomic="true"`), mounted in the film host so it survives tab switches. The Assistant adds its own polite region for provider status and request progress. Everything is polite, including errors: a failure is also shown as persistent visible text next to what failed (the row, the field, the dialog), never only as a transient toast. Messages are short and scoped: "Drafting Scene 12...", "Scene 12 drafted.", "Showing 87 of 100 scenes.", "Created 98 empty scenes. Scene 1 selected.", "Asset folder not found." Pending state is shown on the row or field that owns it, never as a page-level spinner.

### 11.6 Targets, contrast, reflow, motion

Targets, contrast and tokens are in section 3. Reflow is in 4.13. Under `prefers-reduced-motion: reduce` there are no transitions or spinners, and "Drafting..." is static text with the working icon. The Studio shell has a 360px preview floor and 200px side minimums (`dockLayout.ts`), so at 320 CSS px the shell itself overflows and "Maximize panel" is the real escape hatch; the panels reflow inside it.

## 12. Data and props contract (A20)

This section is what Stage B would otherwise have to invent. Types are TypeScript sketches: field names and meanings are the contract, final spellings belong to Stage B, no `any`, no `as`. Panels are presentational: they receive data and callbacks, and import no host, routing or compile code (as the existing `ProductionPanel` and `AssistantPanel` already do).

### 12.1 Script lines and scene identity

```ts
interface ScriptLine {
  lineId: string; // producer-safe id; 8.3
  speaker: string | null;
  text: string; // exact bytes, never normalised
  paragraph: number; // 0-based paragraph in the source
}
interface ScriptSource {
  kind: "imported" | "asset-folder" | "pasted";
  lines: readonly ScriptLine[];
}
```

- `sceneId = "scene-" + lineIds[0]`. `lineIds` lists every member line in order (one for "per script line", several for "per speaker turn" or "per paragraph"). The id is stable while the first line exists. `scene-` plus a source id longer than 113 characters is rejected by the adapter.
- `shotKey = sceneId` (the film-production shot-key pattern allows it). The React key and every callback use `sceneId`, never the array index (B3). The display number (1 to N) is separate.
- "Edited": the `edited` flag on the scene record, set by the host on any producer change after creation (8.4).

### 12.2 Preset storage rule

- **Ids are persisted, labels are not, prose is not written by the UI.** A scene stores `PresetChoice = { id: string; note: string }`. `note` is empty unless `id` is `custom`.
- `Custom` with an empty note counts as an open choice. Entering a note sets it.
- A stored id the catalogue no longer knows displays "Choose ..." with a warning "This choice is no longer offered." and counts as open. It is never dropped silently.
- The scene record is `ScheduleScene` (12.9), a new additive film-store record owned by Stage B in `@hyperframes/film-production`. `SceneBriefV1` is not edited by the UI. **Stage C builds the brief from the record:** it maps each preset id to its phrase and fills `authoring.patternId` (coverage, null for `custom`), `camera.*`, `setting.*`, `sound.*` and `continuity.*`. Stage B writes no prose into a brief.
- The catalogue is typed data (`film-panels/presets.ts`, written from section 6): `{ key, label, required, allowCustom, options: { id, label, hint }[] }`. A test asserts every option has a hint of at most about 70 characters and that `custom` is last where allowed.

```ts
type PresetKey = "coverage" | "shotSize" | "angle" | "movement" | "lens" | "focus"
  | "lightType" | "lightDirection" | "mood" | "colour" | "soundPlan" | "ambience"
  | "entry" | "exit" | "route";
type LockKey = "era" | "wardrobe" | "tableProps" | "seating" | "light";
interface PresetChoice { id: string; note: string }
```

### 12.3 Seconds, frames, fps and still images

- **fps comes from the project**, as a `fps: number | null` prop (integer 1 to 120, as the manifest requires). It is never defaulted. With `null`, "Scene length" and the step steppers are disabled with "Frame rate not known yet", the scene cannot be Ready, and the row reason reads that.
- Storage is integer frames. "Scene length" options are 2, 3, 4, 5, 6, 8 and 10 s; choosing one stores `Math.round(seconds * fps)`. Display is "4 s (96 frames)". A stored length not in the list shows as its own option, "4.04 s (97 frames) from the account", so a host value is never hidden.
- Action steps use 0.5 s steppers stored as integer frames. Rules: `0 <= start < end <= lengthFrames`, steps do not overlap. A stepper that would break a rule stops at the nearest valid value and says so in text ("Steps can't overlap. Set to 2.5 s.") through R0.1; nothing is clamped silently.
- Account limits on length (the snapshot's `durationFrames` values) are a Check-tab warning supplied by the host, not a filter on the list.
- **Still image** (`kind: "image"`): fps and duration are 0 in the contract (`parse/scene.ts` rejects video timing on an image). Length, Action steps, Movement, Sound plan, Background sound, Entry, Exit and Voice are hidden behind "Not used for a still image." and are not required. Their stored values are kept (not deleted) and return if the producer switches back to Video; the switch is undoable. Required choices for an image: coverage, shot size, lens, light type, mood.

### 12.4 Action steps and beats

```ts
interface ActionStep {
  stepId: string;
  actionId: string; // P-ACTION id
  actionNote: string; // only when actionId is "custom"
  endingId: string; // P-ENDING id
  endingNote: string;
  startFrame: number;
  endFrame: number;
}
```

- Mapping to `ActionBeatV1`: the action select is `subjectMotion`; the ending select (`P-ENDING`, 6.11) is `observableEnd`, required so every step has "a beginning, a progression and an observable end". **`cameraMotion` is not editable in a step**: Stage C sets it from the scene's Movement (one camera idea per scene, no per-beat camera motion). `environmentMotion` is not editable in Stage A; Stage C may derive it from Background sound.
- A step with no ending is an open choice and shows "Choose how it ends."

### 12.5 Dialogue and voice

```ts
interface DialogueView { lineId: string; speaker: string | null; text: string;
  language: string | null; voiceId: string | null }
interface VoiceOption { voiceId: string; label: string }
```

- The exact line is read-only everywhere and rendered as text (`white-space: pre-wrap`). No control changes dialogue.
- Voice is host-supplied. With `voices` provided, each distinct speaker in the scene gets a closed select `P-VOICE` ("Choose a voice", no Custom), stored as `voiceBySpeaker`. With `voices: null` the line reads "Voice: not set by the host" and nothing is chosen.
- When the coverage style requires a voice (`restrained-dialogue` does) and the speaker's voice is unset, the host's checks include "Voice needed". Studio never picks a default voice.

### 12.6 References, needs, unregistered files and thumbnails

```ts
type AssetState = "verified" | "observed-unverified" | "hash-mismatch"
  | "missing" | "invalid" | "archived"; // importer names, kept as data values
type Locator =
  | { type: "file"; path: string } // root-relative, forward slashes, no ".."
  | { type: "provider"; providerId: string } // not a file on this computer
  | { type: "unresolved"; pathBase: string }; // path_base not in PATH_BASES
interface ReferenceAsset {
  assetId: string; // asset_id verbatim, never generated
  title: string | null; // import or review name, else first line of notes, else null (the id is shown)
  kind: "image" | "video" | "audio" | "doc" | null; // null: "Kind unknown", not selectable
  sha256: string | null; // null: state is observed-unverified
  state: AssetState;
  provenance: { kind: "registry-csv" | "import-json" | "review-json"; origin: string | null; line: number | null };
  locator: Locator;
  approved: "yes" | "no" | "not-recorded" | "unrecognised"; // read-only
  approvedRaw: string | null;
  notes: string | null; // read-only
  thumbnailUrl: string | null;
  reason: string | null; // plain words for any state except verified
}
interface ReferenceLink { assetId: string; sha256: string; role: ReferenceRole; subjectId: string }
interface ReferenceNeed { needId: string; role: ReferenceRole; subjectId: string }
interface UnregisteredFile { path: string; shortHash: string }
interface RowProblem { line: number; reason: string } // asset-list rows that failed validation
```

- **Needs live on the scene record** as `needs: ReferenceNeed[]` (a new field; `SceneBriefV1` has no place for them and `SceneReferenceBindingV1` requires `referenceId` and `sha256`). A need carries no asset (C12). Stage C may read `needs` when compiling.
- **Links** mirror `SceneReferenceBindingV1` (`referenceId` is `assetId`). A link is resolved against the asset map at render time. Resolution rules: no record with that `assetId` shows the id as the title, "Unavailable" and the reason "Not in the asset list."; a record whose state is not `verified`, whose locator is `provider` or `unresolved`, or whose `sha256` differs from the link's, shows "Unavailable" with its own reason. The link is never removed by a lookup failure (A17).
- **Thumbnails** are a read-only `thumbnailUrl` the host serves from the same origin, or `null`. Image: a host-made thumbnail. Video: a host-made poster frame. Audio and `doc`: always `null` (icon plus text). The components never build URLs and never fall back to a stock or sample image: `null` or a load error shows the text "No preview" in an empty box. Thumbnails are decorative (`alt=""`) because the title is beside them.
- Unregistered files appear only in the collapsed "Files not in the registry" group, as `UnregisteredFile`, not selectable (B28).

### 12.7 Checks, hints and who computes what

```ts
type FieldId = PresetKey | "length" | "cast" | "place" | "steps" | "links"
  | "voice" | "notes" | "title";
interface Check { id: string; severity: "blocking" | "warning" | "info"; text: string;
  fieldId: FieldId | null; fixLabel: string | null }
interface SmartHint { id: string; severity: "warning" | "info"; text: string; fieldId: FieldId;
  action: { label: string; actionId: string } | null }
type ChecksStatus = "unavailable" | "ok";
```

- **Stage B computes exactly two things, as pure tested functions:** `openChoices(scene, catalogue)` (the required choices still open, 3.4 and 12.3) and `sceneState(scene, checks, checksStatus)` (empty, drafted, ready, blocked; section 3.4). Nothing else is derived.
- **The host supplies `checks` and `hints`.** Check sources are the compiler's diagnostics (`error` becomes `blocking`, `warning` stays `warning`) and the hint rules H1 to H11 (7.3). These rules are Stage C's; the compiler was removed in `4c4691d67`, so none exists today. Stage B renders them as given and implements no rule.
- Until Stage C exists the host returns `checksStatus: "unavailable"`, `checks: []`, `hints: []`, `writtenPrompt: null`. The Check tab then says "Checks aren't available in this Studio yet." and the written-prompt disclosure says "No written prompt yet." A scene with all required choices made is Ready and its row says "Checks not available yet" (3.4).
- "Blocked" can therefore only appear when the host supplies a blocking check. Stage B never invents one.

### 12.8 Row geometry for virtualization

- Row height is exactly 72px (three 20px lines plus 12px padding), identical in the narrow and wide layouts. The virtualizer uses `estimateSize: () => 72`, no `measureElement`, overscan 6, and `aria-setsize` equals the real total. A fixed height makes `scrollToIndex` exact for Home, End and digit jumps (B1, B2). With 100 scenes about 10 to 14 rows are in the DOM.
- Text is single-line with an ellipsis, so a longer title or a larger text size cannot change the height. The full text is always in the inspector. The picker list uses fixed 64px rows under the same rule.

### 12.9 Props per region

All collections are `readonly`. Every callback takes `sceneId` and, for mutations, the `expectedRevision` (12.10). Components hold no domain state; R0 owns it.

```ts
interface ScheduleScene {
  sceneId: string; lineIds: readonly string[]; revision: number;
  title: string; notes: string; edited: boolean;
  castIds: readonly string[]; place: PresetChoice | null;
  kind: "video" | "image"; lengthFrames: number | null;
  presets: Partial<Record<PresetKey, PresetChoice>>;
  locks: Partial<Record<LockKey, boolean>>;
  steps: readonly ActionStep[]; links: readonly ReferenceLink[];
  needs: readonly ReferenceNeed[];
  voiceBySpeaker: Readonly<Record<string, string>>;
}
```

| Component | Data props | Callback props |
|---|---|---|
| `ScheduleToolbar` (R1.1) | `filter`, `counts: Record<SceneFilter, number>`, `shownCount`, `history: { undoLabel: string \| null; redoLabel: string \| null }` | `onFilterChange`, `onOpenUpdate`, `onUndo`, `onRedo` |
| `FolderBanner` (R1.2) | `folder: FolderStatus` (12.12), `checking: boolean` | `onCheckAgain`, `onOpenFolderDetails` |
| `SceneList` (R1.3) | `rows: readonly SceneRow[]`, `selectedId: string \| null`, `totalCount` | `onSelect(sceneId)`, `onRunNext(sceneId)`, `onOpenMenu(sceneId, source)`, `onMove(sceneId, toIndex)`, `onClear(sceneId)` |
| `SceneActionsMenu` (R1.4) | `sceneId`, `canMoveUp`, `canMoveDown` | `onAction(sceneId, ScheduleAction)` |
| `ScheduleEmpty` (R1.5) | none | `onOpenCreate` |
| `SceneHeader` (R2.1) | `number`, `total`, `state`, `history` | `onPrevious`, `onNext`, `onOpenMenu`, `onUndo`, `onRedo` |
| `ProductionPanel` (R2, R2.2 to R2.7) | `scene`, `tab: InspectorTab`, `catalogue`, `dialogue: readonly DialogueView[]`, `voices: readonly VoiceOption[] \| null`, `cast`, `places` (host option lists), `fps`, `assets: ReadonlyMap<string, ReferenceAsset>`, `checks`, `hints`, `checksStatus`, `account: AccountSettingsView \| null`, `writtenPrompt: string \| null`, `pending: ReadonlySet<FieldId>`, `conflict: ScheduleScene \| null`, `primary: { label: string; reason: string }` | `onTabChange`, `onPreset(key, choice)`, `onLock(key, on)`, `onCast`, `onPlace`, `onKind`, `onLength`, `onStep…`, `onTitle`, `onNotes`, `onOpenPicker`, `onUnlink`, `onRole`, `onNeedAdd`, `onNeedRemove`, `onGoToField(fieldId)`, `onHintAction(actionId)`, `onPrimary`, `onAskAssistant`, `onKeepMine`, `onUseTheirs`, `onAccountChange` |
| `ReferencePicker` (D3) | `assets`, `unregistered`, `filters`, `search`, `role`, `sceneLabel`, `status: "loading" \| "ready" \| "error"` | `onFilter`, `onSearch`, `onRole`, `onChoose(assetId)`, `onClose` |
| `AssistantPanel` (R3) | `status: AssistantStatusView`, `providers`, `provider`, `task`, `scope`, `scopeCounts`, `note`, `target: { sceneLabel: string; revision: number } \| null`, `pending: boolean`, `suggestion: SuggestionView \| null`, `history` | `onProvider`, `onTask`, `onScope`, `onNote`, `onSend`, `onStop`, `onCopyRequest`, `onPasteSuggestion`, `onSuggestionFile(file)`, `onUse(groups)`, `onDismiss`, `onCheckAgain`, `onUndo`, `onRedo` |
| `CreateScenesDialog` (D1), `UpdateScheduleDialog` (D2), `MoveSceneDialog` (D4), `FolderDetails` (D5) | the preview or counts the host computed, the source options with their disabled reasons, `pending` | `onChooseSource`, `onChooseSplit`, `onPaste(text)`, `onConfirm`, `onCancel`, `onChooseEdited` |
| `PresetSelect`, `Hint`, `InfoTip`, `StateBadge` | `catalogue entry`, `value`, `hint`, `disabledReason` | `onChange` |

Supporting types: `SceneFilter = "all" | "empty" | "drafted" | "ready" | "blocked" | "needs-reference"`; `InspectorTab = "scene" | "look" | "references" | "check"`; `ScheduleAction = "draft" | "move-up" | "move-down" | "move-to" | "duplicate" | "clear" | "remove"`; `AssistantStatusView = { state: "ready" | "missing-cli" | "unauthenticated" | "unsupported-protocol" | "unavailable-mode" | "limited-usage" | "not-connected"; help: string | null }` (the text shown comes from the table in 10.1, never the host's raw words); `SuggestionView = { sceneId: string; sceneLabel: string; revision: number; dialogueUnchanged: boolean; groups: Record<"look" | "action" | "sound" | "continuity", readonly { fieldId: FieldId; from: string; to: string }[]> }`; `FolderStatus` and `AssetIndexResult` are in 12.12.

`SceneRow` is the derived row view, produced by one pure selector `toRow(scene, checks, checksStatus, assets)`: `{ sceneId, number, title, state, pending, nextLabel, reason, summary, refNote, creativeOnly }`.

### 12.10 Persistence, revisions and conflicts

- The host persists scene records; R0 holds only session state. Persisted: everything in `ScheduleScene`, schedule order, the script source reference. Session-only: selection, filter, inspector tab, history, open dialogs.
- Every scene has a host-owned integer `revision`. Each mutation callback sends `expectedRevision`. The host answers one of four outcomes, matching `PRODUCTION-DESIGN.md`: `applied`, `rejected` (with a plain reason), `conflict` (with `theirs: ScheduleScene`), or `uncertain` (the reply was lost). The UI shows: row "Saving..." while pending; "Couldn't save changes to Scene 12. Retry." for rejected; the conflict card "Scene 12 was changed elsewhere. [Keep mine] [Use theirs]" for conflict, keeping both versions until chosen; "Not sure this saved. Check again." for uncertain.
- At compile time Stage C maps `revision` to `SceneBriefV1.reviewRevision` where the host uses it; Stage A does not decide that mapping.

### 12.11 Account settings view

`AccountSettingsView` mirrors the existing `NativeChoice` list in `film/nativeChoices.ts`: `{ key, label, options: { value, label }[], selected }[]`, or `null` for "Not read yet". Labels are humanised by 6.12. Options are copied from the account snapshot; nothing is invented.

### 12.12 Closed facts, remaining unknown values, and typed adapters

Three facts were open and are now **closed** (verified live by the producer, 9.5, 1.4): the exact `asset-registry.csv` header, that `workspace.json` exists, and the live preview launch command. Studio never claims any real asset from the cloud VM; all tests use synthetic fixtures generated in a temp directory, including a miniature `asset-registry.csv` with exactly the header `asset_id,kind,path_or_provider_id,path_base,source,sha256,approved,notes`, a mini `workspace.json` and an absent-root case (B35).

What is still unknown are *values*, not structure: the vocabulary of `path_base`, `kind` and `approved`, and the layout of the project script file (`01_script/dialogue-lines.csv` is only hashed by the importer). They are typed tables (`PATH_BASES`, `KINDS`, `APPROVED`) and a script adapter, filled from the producer's real vocabulary and never from a guess. Meanwhile each degrades honestly.

```ts
type RootProblem = { reason: "unset" | "missing" | "denied"; path: string | null };
type FolderStatus =
  | { kind: "ok"; folders: readonly { path: string }[] }
  | ({ kind: "unavailable" } & RootProblem)
  | { kind: "partial"; unavailable: readonly { path: string; reason: "missing" | "denied" }[] };
type WorkspaceProblem = "unreadable" | "no-active-film" | "active-film-not-unique"
  | "document-outside-project" | "documents-missing"; // the importer's own errors
type AssetIndexResult =
  | ({ kind: "root-unavailable" } & RootProblem)
  | { kind: "workspace-error"; problem: WorkspaceProblem }
  | { kind: "list-missing" }
  | { kind: "list-invalid"; missingColumns: readonly string[] }
  | { kind: "ok"; assets: readonly ReferenceAsset[]; unregistered: readonly UnregisteredFile[];
      problems: readonly RowProblem[]; unknownLocations: number };
type ScriptSourceResult =
  | { kind: "unavailable"; reason: "workspace-error" | "script-layout-unknown" | "invalid-ids" | "root-unavailable" }
  | { kind: "ok"; source: ScriptSource };
```

| Open value | Modelled as | Degraded state the UI shows |
|---|---|---|
| `path_base` vocabulary | `PATH_BASES` (value to `file` base folder or `provider`) | A value not in the table: `unresolved`, listed, not selectable, counted in the banner (4.11) |
| `kind` vocabulary | `KINDS` (value to image, video, audio, doc) | Unknown value: "Kind unknown", not selectable |
| `approved` vocabulary | `APPROVED` (value to yes or no) | Unknown value: shown verbatim as "Approval: <value>", never read as approved |
| Script file layout (OQ-6) | `ScriptSourceResult.unavailable("script-layout-unknown")` | D1 disables "Script already imported": "Studio can't read lines from the project script file yet." Paste is chosen and always works |
| Importer errors | `AssetIndexResult.workspace-error` | The workspace banner in 4.11 with the importer's reason in plain words |

The picker also lists registry rows with problems (`problems`, with line numbers), provider items and unresolved locations in their own non-selectable groups (9.5). `list-invalid` covers the strict header check; `problems` covers row-level failures, so nothing is dropped.

### 12.13 What Stage B decides nothing about, and what it may decide

Stage B must not change, and Gate B traces against:

- every preset id, label and hint (section 6), the required-choice set, the four states and their definitions, the primary-action labels and reasons (5), the button labels (7.4), the smart-hint copy (7.3), the plain readiness copy (10.1), the id and paste rules (8), the row height (12.8), the focus, colour and field-boundary rules (3), the default layout (4.1) and the IA ids (2).

Stage B decides: file and hook names, store shape inside R0, the virtualizer wiring, test structure, how the film field-boundary override is expressed in CSS, and the exact spelling of the types above (not their meaning).

Stage B depends on Stage C for: preset id to phrase maps, the compiler diagnostics that become checks, the hint rules, parsing of pasted suggestions, and the instruction that asks the other tool for only a final answer. Until Stage C exists the defaults are the ones in 12.7. Stage B also depends on the producer's real `path_base`, `kind` and `approved` values and the project script file layout (12.12, OQ-15, OQ-6), and uses the degraded states above until they are known.

## 13. Signature interaction slots (TBD by the Creative Director stage)

Stage A does not propose signature interactions. Up to three are reserved, each attached to a region that already exists, so the conventional layout stays complete underneath (CD8: novelty never removes a familiar affordance). Each must arrive as a CD card that carries its own keyboard path, ARIA mapping, reduced-motion alternative and 100-scene performance note (CD5), and must pass A and B items on paper (CD10).

| Slot | Attaches to | Status |
|---|---|---|
| SIG-1 | Schedule structure (how the scenes are grouped or shown above R1.3) | TBD by the Creative Director stage |
| SIG-2 | Scene row or inspector header (R1.3, R2.1) | TBD by the Creative Director stage |
| SIG-3 | Assistant or continuity review (R3, R2.4) | TBD by the Creative Director stage |

**Stage B ships no placeholder UI for these slots**: no empty containers, no disabled controls, no feature flags, no "coming soon". The only preparation is structural: `SceneRow` (R1.3) and `SceneHeader` (R2.1) are separate props-only components, so a later idea can wrap or replace one without touching the others.

## 14. Self-score against Gate A (A1 to A20)

Written to be adversarial: for each item, what passes, what could still be attacked, and what is unverified. Scoring is on paper (design level). "Verify in B" means Gate B must prove it in the running build. The checklist in `BEST-PRACTICES.md` has not been amended since the review proposed changes, so items are scored against its current wording and the deviations are named.

| ID | W | Result | Evidence and remaining attack surface |
|---|---|---|---|
| A1 | must | **Pass, with one exception for the gate owner** | Free text is listed in 0: dialogue (paste), titles, notes, "Note for Custom" (a note), and "Search". "Search" is the only item not literally dialogue, notes or titles; it creates no data and is never required (OQ-1 decided yes, but the checklist text needs the amendment). No env var, flag, config key or diagnostic code is shown anywhere: D5 shows read-only paths and plain statuses (9.3); the key lives only in 9.4 for `docs/`. The assistant return path has no JSON UI (4.8). Paste grammar is a plain hint (8.2). Residual: the producer copies the other tool's answer out of a window where it may be JSON (4.8); Studio never shows or asks for it. "Copy details for support" copies text that may include codes, which Studio does not display. |
| A2 | must | **Pass** | One action creates N empty scenes (8.1, 4.2, 4.12). Four states as text plus distinct icon shape (3.4, 4.3). Empty is computed, not judged (3.4). Residual: the project script file's layout is not specified (OQ-6), so the imported-script source reports "Studio can't read lines from the project script file yet" and Paste always works (8.1, 12.12). |
| A3 | must | **Pass** | Every state has one action and one reason (5). The empty-row label "Choose the look" no longer collides with the assistant's "Draft this scene" (5). |
| A4 | must | **Pass at design; unverified** | Default layout with Schedule left (active, `keepMounted`) and Production and Assistant in separate right groups (4.1). State, live region and history live in R0 so tab switches lose nothing. Selecting never moves focus or scroll (11.2). Residual: needs the dock changes in DEP1; a stored layout is never rearranged, so a producer with an old layout gets panels added, not repositioned. Verify in B in a real browser. |
| A5 | must | **Pass** | Every preset in 6 is a select with a one-line hint and Custom last where the list is open-ended; closed lists (length, role, task, scope, voice) correctly have none. Custom with an empty note stays open (12.2). Residual: Studio's `Select` has no hint line (DEP4). |
| A6 | must | **Pass at design; dependency** | 7.2 follows APG and WCAG 1.4.13. Hints are persistent text, so nothing essential is tooltip-only (7.1). Residual: Studio's `Tooltip` is `pointer-events-none` and sets `aria-describedby` only while open (DEP3). |
| A7 | must | **Pass at design; dependency** | Keyboard path for every row of the IA table. One tab stop in the list (11.2). Single focus rule (3.2). Residual: DEP2 (the list must own plain keys) is required or Space, `f`, `s` and others are stolen. |
| A8 | must | **Pass** | `listbox/option` with no interactive descendants (2 R1.3, 4.3, 11.2). Row actions are keyboard (Enter, Shift+F10), pointer (double-click, right-click) and a real button in the Production header and action bar. Tabs are `tablist/tab/tabpanel` with arrow switching (R2.2). The picker list follows the same rule. |
| A9 | must | **Pass at design; unverified** | Film controls at least 28px, the 24px size excluded (3.3); sticky action bar with `scroll-padding-bottom` (4.4). Residual: needs a focus-not-obscured test at 400% zoom. |
| A10 | must | **Pass** | 11.4 plus D4. Nothing requires a drag. |
| A11 | must | **Conditional** | Colours go only through Studio tokens mirroring DESIGN.md roles, with no hex (3.1). Drafted no longer reuses the selection token; only Ready and Blocked carry a hue; warnings use `--color-warning-ink`; one focus-ring rule; a 3:1 field boundary in `--color-text-muted` (3.2). **As literally worded, A11 fails on two points:** it says colours come "only from DESIGN.md tokens" (the mapping uses Studio tokens, because the hex ratchet forbids literals and DESIGN.md has no danger or warning role), and it names Inter and IBM Plex Mono (film panels inherit Studio fonts, 3.1). It passes if the gate owner accepts the amendment the review proposed. Contrast figures for Studio tokens come from oklch conversion, not a browser measurement; Verify in B in light and dark. |
| A12 | should | **Pass** | One polite region in the film host, plus the assistant's (11.5). Errors are polite and also persistent visible text. Pending is row or field scoped. |
| A13 | should | **Pass** | One film history across R1, R2 and R3 with Undo in all three, key scoping with `[data-film-scope]`, extension of `shouldIgnoreHistoryShortcut` (11.3). Residual: history is session memory, cleared on reload (stated). Studio's editor history stays separate by design (OQ-11). |
| A14 | should | **Pass** | D2 counts unchanged, new, no longer matching and edited; edited scenes are kept by default; replacing needs a second confirm (8.4). "Edited" is defined (8.4, 12.1). Residual: a reworded line is one removed plus one new scene because ids are content hashes; this is stated to the producer. |
| A15 | must | **Pass** | Thumbnail, kind, source and the six importer states verbatim as data values with plain labels (9.1, 12.6). The registry header is now exact and mapped column by column to the index record, with strict validation (9.5). Only `verified` is selectable; provider items, unresolved locations, unknown kinds and problem rows are listed but not selectable, none given a state it has not earned. Residual: the labels are glosses, not the raw importer words (one to one); the `path_base`, `kind` and `approved` value tables are not yet filled (OQ-15), so real registry rows may all show "Studio doesn't know this location yet" until they are. |
| A16 | must | **Pass** | Banner copy for unset, missing, denied, partial, no list, missing column, bad rows, unknown locations, none usable and a film-workspace error (4.11). Scenes stay usable. "No preview" is text only (12.6). The cloud VM claims no real asset; tests use synthetic fixtures (12.12). |
| A17 | must | **Pass** | A link keeps its id; "Unavailable" with a reason (also for provider and unresolved locations); an unknown id shows the id and "Not in the asset list." (12.6). Removal only by "Remove link". |
| A18 | should | **Pass at design; unverified** | 4.13, 3.3, 11.6. The Studio shell overflows at 320px, so "Maximize panel" is the real escape hatch (stated). Verify in B at 400% zoom. |
| A19 | must | **Pass** | Section 2 has region, purpose, controls, keyboard path and ARIA role for every region, dialog and global element, with stable ids. |
| A20 | must | **Pass, with notes** | Section 12: prop and data types (12.1, 12.5 to 12.7, 12.9, 12.11), preset storage rule (12.2), row height (12.8), seconds-to-frames and still-image rules (12.3), action-beat and voice fields (12.4, 12.5), where needs live (12.6), who computes blocked (12.7), thumbnails (12.6), the registry mapping (9.5) and typed adapters with degraded states for the value tables still unknown (12.12), conflicts (12.10), and a "Stage B decides nothing about" list (12.13). Residual: `approved` is read-only and never gates selection, an unconfirmed policy (OQ-16). `ScheduleScene` is a new additive record in `@hyperframes/film-production`, a contract change someone must own (DEP9); the voice-per-speaker mapping and the revision mapping to the brief are Stage C and host decisions named but not designed here. |

Totals as written: 15 of 16 musts pass at design level (A11 is conditional on the amendment), 4 of 4 shoulds pass at design level. Five musts (A4, A6, A7, A9, A11) and one should (A18) carry "unverified" or dependency notes that only Gate B can close. The producer's three authorised answers are folded in (9.5, 1.4, 15.1b); the remaining unknowns are values (OQ-15, OQ-16) and the script file layout (OQ-6), each with an honest degraded state.

## 15. Decisions taken and what is still open

### 15.1 Decided in this revision (the review's recommended answers)

| ID | Question | Decision |
|---|---|---|
| OQ-1 | Are "Custom" note boxes, the picker search and operator text acceptable under A1? | "Note for Custom" and "Search" are named exceptions (0). Operator text is removed from the UI entirely (9.3, 9.4). The checklist needs the A1 amendment for "Search" |
| OQ-2 | Colour for Blocked and warnings | Blocked is `--color-danger-ink`, warnings are `--color-warning-ink` (3.1) |
| OQ-3 | Inter and IBM Plex Mono | Inherit Studio fonts; do not bundle (3.1). Needs the A11 amendment |
| OQ-4 | Where Schedule lives | Left dock, first and active tab, `keepMounted`, with the default layout in 4.1 |
| OQ-5 | Folder browser | None in Stage B. The UI says "Ask whoever set up this computer to choose the folder." The operator route is in 9.4 |
| OQ-7 | Required choices | The six in 3.4. Place and "Who is in this scene" are advisory |
| OQ-8 | Unverified or changed references | Only `verified` is selectable; the "none usable" case is explicit (4.11, 12.12) |
| OQ-11 | Film undo | One film history across Schedule, Production and Assistant, separate from Studio's editor history (11.3) |

### 15.1b Closed by the producer's authorised answers (verified live on pop-os)

| ID | Was | Now |
|---|---|---|
| OQ-9 (part 1) | The `asset-registry.csv` columns | Exact header `asset_id,kind,path_or_provider_id,path_base,source,sha256,approved,notes`, mapped to the index record with strict validation (9.5). The values inside some columns are the narrower open item OQ-15 |
| OQ-9 (part 2) | Does `workspace.json` exist at the Movies_Projects root | It exists (schema 1.0, name `Movies_Projects`, active film `andre-time-travel`, project root `projects/andre-time-travel`). The importer path applies; the "may be missing" branch is removed and only the importer's own errors remain as honest states (9.5, 4.11) |
| OQ-10 | The launch command for the 9361 preview | Documented as the verified live preview launch in 1.4. Repo defaults (3002, 9362) are unchanged and 1962 remains unverified and unused |

### 15.2 Still open

| ID | Question | Blocked on | Stage A behaviour meanwhile |
|---|---|---|---|
| OQ-6 | The layout of the project script file (`01_script/dialogue-lines.csv`), the source line ids and any stage directions | Producer | `ScriptSourceResult` reports "script-layout-unknown"; Paste with hash ids always works (8.3, 12.12) |
| OQ-15 | The real values of `path_base`, `kind` and `approved` in `asset-registry.csv` (the header is known, no sample row was released) | Producer | Typed tables `PATH_BASES`, `KINDS`, `APPROVED` ship without invented values; unknown values degrade honestly and "Copy details for support" lists the distinct values with counts so they can be added (9.5) |
| OQ-16 | Should an asset not recorded as approved be bindable (this doc: yes, with a host warning) or blocked? | Producer | Read-only display, never gates selection (9.5) |
| OQ-12 | Does the copied request ask the other tool for only its final answer? | Stage C | Stated as a requirement (4.8); Stage C writes the instruction |
| OQ-13 | Will the gate owner amend A1 (Search), A11 (Studio tokens, inherited fonts), A12 (role of errors, if `alert` is ever wanted) as proposed in the review? | Gate owner | A1 and A11 are scored with the deviation named (14); A12 is satisfied as written |
| OQ-14 | Who owns the additive `ScheduleScene` record in `@hyperframes/film-production`? | Coordinator | Stage B owns the type; `SceneBriefV1` is not edited (12.2) |

## 16. Stage B dependencies and risks

| ID | Dependency or risk | Where |
|---|---|---|
| DEP1 | Register `schedule` in `PANEL_IDS` and `PANEL_DEFINITIONS` (zone `left`, `keepMounted: true`). Add `schedule` as the first tab of the default left group and `production` as the active tab of the right group, with `assistant` in its own group below, when a film host is connected and a stored layout lacks them (4.1). Mount the film host (R0) from `FilmDockPanels`. Today `DEFAULT_LEFT` and `DEFAULT_RIGHT` in `dockLayout.ts` contain neither film panel, and only `preview` and `timeline` are `keepMounted` | `components/dock/panelRegistry.ts`, `dockLayout.ts`, `Dock.tsx`, `film/FilmDockPanels.tsx` |
| DEP2 | The scene list owns plain keys (add its role to the owning list). `shouldIgnoreHistoryShortcut` returns true inside `[data-film-scope]` and the film history handles the undo keys there | `utils/typingTarget.ts`, `utils/studioHelpers.ts`, `hooks/appHotkeysDispatch.ts` |
| DEP3 | Tooltip stays open under the pointer (remove `pointer-events-none` or add a hoverable variant) and keeps `aria-describedby` mounted | `components/ui/Tooltip.tsx` |
| DEP4 | Film-scoped `Select` with a one-line hint per option, 40px rows, wrapping text and a visible reason for disabled options. A film-scoped field-boundary override of `fieldBase` (`--color-text-muted`) for Select, Input, NumberField, SearchInput, textarea and segmented controls | `components/ui/Select.tsx`, `Input.tsx` |
| DEP5 | No new colour literals outside `theme.css` (hex ratchet). Film panels use only the tokens in 3.1. `text-[11px]` and `neutral-*` are retired in film panels | `styles/hexRatchet.test.ts` |
| DEP6 | The virtualized list keeps `aria-posinset` and `aria-setsize` and reaches unmounted rows with Home and End at a fixed 72px row (12.8). Reuse the `useTimelineVirtualRows` pattern | `player/components/useTimelineVirtualRows.ts` |
| DEP7 | Operator documentation for the host path (9.4) and `root-unavailable` results, in `docs/` in the same PR. The registry reader implements the strict header and row validation in 9.5 and runs the importer's validation of `workspace.json` rather than reimplementing it | Stage B index work, `legacy/import-movies.mjs` |
| DEP8 | Each film file under 600 lines; extract per region (one component per IA row) | `packages/studio/AGENTS.md` |
| DEP9 | `ScheduleScene` and the related additive types (12.1 to 12.9) live in `@hyperframes/film-production` | OQ-14 |
| DEP10 | Stage C interfaces consumed as props: preset phrase maps, `checks`, `hints`, `writtenPrompt`, suggestion parsing (12.7, 12.13) | Stage C |
| RISK1 | Undo meaning differs by focus (film scope against Studio's editor history). Mitigated by the Undo and Redo buttons in all three panels, labelled with the action | 11.3 |
| RISK2 | Hint and label wrapping at 320px, and the 72px fixed row with larger text sizes (single-line truncation protects the height). Verify in a real browser; happy-dom has no layout | 4.13, 12.8 |
| RISK3 | The producer's asset folder is unreachable from the cloud VM and no real asset is claimed. Every state is tested with synthetic fixtures (a miniature CSV with the exact header, a mini `workspace.json`, an absent root; B35). The value tables (OQ-15) must be filled from the producer's real vocabulary before real rows resolve | 9.5, 12.12 |
| RISK4 | The copy-and-paste return path depends on clipboard read permission. A file picker is the fallback and the message says so (4.8) | 4.8 |
