# Concurrent Studio additions review

Target: `f55fb732b0a4d501edb1c040692288791d0523f7`, compared with `963d9b424c1d0612a584e55db46adc2cae3fbbf9`. Scope: Studio changes only. Git object reads ensure the concurrently dirty checkout is not mistaken for this head. No checkout/source changes, staging, installation, service start or provider call performed.

codeQualityStatus: WATCH
recommendation: REQUEST_CHANGES
Verdict: REVISE components; NOT ENOUGH EVIDENCE for a functional Studio production workflow.
Blockers for connected-workflow acceptance: replace disconnected session adapter; bind proposals to structured target/revision; fix native control persistence/display; preserve raw continuity input while editing. This is not a claim that currently disconnected controls have mutated production state.

## CRITICAL

None demonstrated.

## HIGH

No currently reachable destructive regression demonstrated. The missing connected workflow is an acceptance blocker for Task 6, not concealed runtime execution: the UI explicitly says unavailable.

## MEDIUM

1. **Late proposals for an old context become applicable.** `packages/studio/src/film/visibleProposal.ts:18-24` hides only the old JavaScript object. After a context switch, any different object is returned as visible, without checking `projectId`, `shotKey`, `sourceRevisionId`, `reviewRevision` or turn identity. `AssistantPanel.tsx:139-146` enables Apply solely on non-null visibility. Pure exact-source probe: show A/S1, switch to B/S2 with old proposal, receive a newly allocated A/S1 proposal: output is `late old proposal visible { projectId: "A", shotKey: "S1", reviewRevision: 1 }`. The current props offer only a display string, not structured target identity. Existing test explicitly accepts a fresh object after a context change, missing its identity mismatch. Fix the context contract and test late old-context events, same-shot revision changes and same-project labels. Current disconnected session always supplies null, so no real cross-project write is claimed.

2. **Native controls can display unapplied or stale values.** `nativeChoices.ts:41-44` silently picks the first account option when the current brief value is absent. With brief duration96/1920x1080 and options72,120/1280x720, the displayed values become72/1280x720 without modifying the brief. `nativeChoices.ts:56,78,80` creates editable enum/ratio/count controls without apply callbacks; `NativeParameters.tsx:14-17` updates local picked state and returns without notifying the parent. `NativeParameters.tsx:31-33` also keeps an old local selection when a new brief has another valid value; keys at lines98 and124 bind model/field, not project or brief. The result can misrepresent the parameters Prepare will receive. Use controlled values, explicitly display unsupported/unset values, and either persist supported native fields or render unsupported edits read-only. Probe confirms ratio/count/mode report `applies: false`.

3. **Continuity editing loses spaces and newlines on each keystroke.** `briefEdit.ts:67-79` trims every line and removes empty lines; `FieldControl.tsx:39-40,62` commits that normalized result on every change. `sectionFields.ts:92-99` renders the array joined with newline. Thus typing a trailing space or Enter in Locks/Exclusions rerenders the old text before the next character: `"Hold " -> "Hold"`, `"Hold\n" -> "Hold"`, verified by the exact-source helper probe. A connected controlled editor cannot normally append words or a second item (pasting pre-composed text can work). Preserve a raw input draft and normalize on explicit commit/blur, or represent editable rows directly. This is unnecessary normalization during editing with a demonstrated behavioral consequence.

## LOW

- `PatternChoice.tsx:21-29,43-53` declares a radio group using ordinary buttons but provides neither radio arrow-key behavior nor roving tab index. Tab/Enter remain available, so no keyboard trap is claimed; semantics promise a radio interaction the implementation does not provide. Prefer native radio controls or complete keyboard semantics.
- Additional state pinning in `patternPin.ts:8-17` keys only by shotKey. Projects sharing the same shotKey can retain the prior pattern, and local picked state outranks incoming brief values in `ProductionPanel.tsx:24`. Address alongside controlled-state ownership when connecting projects.

## Reachable workflow and scope control

`StudioRightPanels.tsx:313` mounts FilmDockPanels; `FilmDockPanels.tsx:12` calls useFilmSession with only showToast. `useFilmSession.ts:29-57` has no project input, network subscription or FilmPort/AssistantPort. It permanently supplies a disconnected shot, null brief/compilation/snapshot/proposal, no-op change/apply handlers, and toast-only Prepare/Send. Instruction entry, clearing and clipboard handoff are real local actions; production preparation, durable drafts, assistant turns, selected-shot context and proposal application are not connected.

Task 6 in the target execution plan expressly calls for actual functional dock panels, selected-shot resolution, stale-response handling, durable drafts/reload, existing Ask Agent routing, real API verification and a browser walkthrough. Its checkboxes remain open. Accept these changes only as partial UI scaffolding if that is the declared scope; do not mark Task 6 or an offline production cycle complete. Existing Ask Agent wiring is unchanged by this Studio diff.

## Tests and skill perspectives

Reviewed filmPanels.test.tsx and FilmSession.test.tsx plus dock/layout/URL diffs. Meaningful tests preserve exact dialogue, keep Send separate from Apply/Prepare, show diagnostics, and verify disabled Apply when no proposal exists. Session test proves toast behavior in the explicitly disconnected adapter, not integration. No test covers typing continuity fields, committing enum/count/ratio, replacing a brief while model IDs stay stable, a newly allocated late old-shot proposal, durable reload, or real API interaction. Prompt-helper sentence assertions in filmPanels.test.tsx add brittle copy coupling; avoid treating them as functional evidence. No deletion-only tests found.

remove-ai-slops and programming SKILL.md files/tools were unavailable in this session (searched in prior review); their supplied criteria were applied again. Violations include brittle prose assertions and per-keystroke normalization that harms ordinary editing. No unsafe `any` escape hatch was found in the reviewed new UI.

Loaded packages/studio/AGENTS.md at target head and Impeccable SKILL.md plus reference/audit.md. Impeccable context launcher/detector not run: no install/download or checkout mutation allowed, and current checkout differs from audited head. Read target DESIGN.md directly; no PRODUCT.md at target. This is a source-only audit. Native labels, textarea/select semantics, visible focus classes and existing Button components are positive evidence. No measured contrast, layout, theme-switching, responsive or browser accessibility claim is made; numerical visual audit scores are intentionally unassigned. No browser was started.

## Evidence

Isolated exact-head source probe: `/tmp/f55-studio-review-6rkj8c2a/probe.ts`. Source modules and film-production package copied from Git objects; React resolved from existing Studio dependency installation. Two initial probe runs failed resolving workspace dependencies; the successful third run used explicit temporary-only symlinks and exact-head contract sources. Successful output:

```
late old proposal visible { projectId: "A", shotKey: "S1", reviewRevision: 1 }
space roundtrip "Hold"
newline roundtrip "Hold"
native controls: duration selected72 applies=true; ratio selected16:9 applies=false;
resolution selected1280×720 applies=true; count selected1 applies=false; enum-mode selecteda applies=false
```

These are pure function probes, not a React render or provider test. Parent-owned green tests on963 plus corrections do not validate f55. No full build/test result for this new head is asserted here.

Report path uses fallback because omo-agent-toolkit ulw-loop status previously failed from missing installed runtime. No notepad path or new-head executor evidence supplied.
