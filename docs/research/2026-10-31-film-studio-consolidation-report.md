# Film studio consolidation: source audit and recommendation

Date: 2026-10-31. Scope: Hyperframes (H), OpenReel Video (O), Movies_Projects (M), Argon Studio (A), and the independent Codex Argon Studio (C). Repository aliases refer to sibling checkouts; paths below are relative to their source repository. Revision and file hashes are in [the evidence manifest](2026-10-31-film-studio-evidence.json).

## Decision supported by this audit

Use **a Hyperframes-based production application with a small, isolated production layer** as the preferred direction for a new fork. Preserve Hyperframes' composition/rendering system, adapt the strongest production-domain services from Argon, reuse OpenReel's script/take/dialogue logic where practical, and import the existing Movies_Projects film records through an explicit mapping.

This is a recommendation from source inspection, not proof that the combined product works. A bounded editing/export pilot must decide whether Hyperframes can serve as the principal timeline before substantial UI or migration work. Do not merge four complete applications, run two authoritative timelines, or copy entire repositories into one workspace.

No fork or application code was created. The audit produced this report, a research plan and an evidence manifest. No builds, test suites, browser scenarios, model inference, vendor calls or renders were executed. Existing tests and dated execution reports are identified separately below.

## What changed in our understanding

1. The useful work is distributed across **five** codebases, including two distinct Argon implementations. Comparing only Hyperframes and the standalone OpenReel editor misses substantial production services.
2. The located successful live-scene record is in **A**, not H. A's tracked `goals/argon-auto-edit/execution-ledger-dialogue-motion.md`, section “Live scene (Task 10), 2026-10-28”, records Kling motion and dialogue generation, Higgsfield still generation, frame extraction, an automatic cut and a 1080p export. It labels Drive synchronization mock. This confirms where a historical execution record lives; this audit did not inspect the exported video's bytes or prove it is the exact test Andre recalled.
3. A's built-in co-director is API-backed. Its `apps/studio-server/src/codirector/client.ts` imports the Anthropic SDK; `codirector/transcript.ts` explicitly requires a key and reports per-token billing. It cannot be adopted unchanged as a Claude subscription feature.
4. The manual ComfyUI reference handoff is implemented and documented in A. It is **not an automated ComfyUI job runner** and does not synchronize the editor's production manifest with the server's shot list.
5. C has important ownership/revision/reference services and explicit acceptance contracts, but its delivery report leaves live runtime and vendor prerequisites open. Those services are reuse candidates; their documented external gates must travel with them.
6. Export compatibility is a material integration problem. A's OpenReel bridge explicitly reports unsupported timeline features. A visually rich editor does not establish that its server export reproduces every edit.

## Repository snapshot

Local remote-tracking refs are observations, not a freshly fetched upstream comparison. No branch was switched.

| Alias | Branch / HEAD at audit | Working tree before research docs | Meaning |
| --- | --- | --- | --- |
| H | `main` / `164d6c7a36eb` | Clean | Upstream Hyperframes source; no native Kling/Higgsfield/ComfyUI adapter found in the scoped package/skill search |
| O | `feat/ai-film-pipeline` / `4585f6d7d1bb` | Clean | Owner's customized OpenReel fork; local branch reports two commits ahead of its tracking ref |
| M | `main` / `8eff06adfef4` | Modified, deleted and untracked work; dirty submodule | Current working files matter; HEAD alone is not the film state. Preserve existing deletions |
| A | `main` / `7003b8c9a419` | Clean | Owner's Argon application with vendored OpenReel, ComfyUI handoff and dialogue/motion work |
| C | `codex/argon-studio` / `155c819ee3b5` | One untracked master-prompt document | Independent repository, not another branch of A |

H's HEAD differs from the prior chat's snapshot. This report binds to the revision above; it does not attribute that intervening change to this audit.

## Capability comparison

**S** means source inspected; **D** means documentation or contract inspected; **R** means dated execution record inspected. None means fresh runtime acceptance.

| Film requirement | Best evidence/reuse source | Evidence and limit | Consolidation decision |
| --- | --- | --- | --- |
| Screenplay → scene/shot placeholders | O | S: `script/timeline-builder.ts`; D: `docs/film-production.md` | Adapt pure parsing/planning and preserve stable IDs; automatic duration-based splitting is not finished cinematographic coverage |
| Character, location, prop and voice references | O + A + C | S: O `ProductionEntity`; C `studio/references.ts`; D: A reference handoff | Use one asset identity with explicit reference roles and verified platform bindings |
| Canonical dialogue and film direction | M | S/D: production-plan source, manifest, board, approvals, `docs/PRODUCTION_PLAN.md` | Import exact existing line/shot IDs and source hashes; do not regenerate the screenplay from a generic prompt |
| Camera, eyeline, table, lighting and acting timing | M + A | S: M production-plan camera/segments; A `shared-types/src/shot.ts` and router | Retain structured film direction plus human notes; provider prompts express intent rather than guaranteed physical camera control |
| Dialogue and motion route selection | A | S: compiler router/preflight; R: live-scene ledger | Adapt with capability provenance; current motion-control route rejects simultaneous dialogue |
| Kling / Higgsfield execution lifecycle | A + C + M | S: A adapters/router, C durable queue, M release runner; R: A ledger | Reuse lifecycle patterns, but explicitly resolve the conflicting execution policies before a live adapter is enabled |
| ComfyUI input | A | S: take attachment route; D: `COMFYUI_REFERENCE_FRAMES.md` | Adopt byte-preserving manual candidate import and explicit start-frame approval first |
| Local model assistance | C + O | S: C local task service, O local-AI/production paths; D: user guides | Explicit bounded suggestion tasks and selective apply; no automatic model loading or take acceptance |
| Take comparison and provenance | O + A + C | S: O take fields, A candidate/approval route, C reference/queue services | Selected take and artistic acceptance must remain separate states |
| Dialogue checks and J/L audio assembly | O | S: `script/assemble.ts`; D: Shot Board guide and speech-check flow | Preserve independently of the chosen visual editor; transcription is an aid to review |
| Compositions, editable graphics and deterministic rendering | H | S: timeline description/mutation modules; D: core skill and agent guides | Retain H's model for composition and rendering; verify film-edit cases in a pilot |
| Automatic rough cut | A | D: references/README; R: live-scene ledger | Optional derived draft; generation/take approval must not overwrite a human-edited sequence |
| Preview/master fidelity | H + C, with A bridge warnings | S: A bridge; D: C acceptance/timeline contracts | Make decoded-media parity an adoption gate; no unsupported feature may disappear silently |
| Recovery and uncertain provider outcomes | C + M | S: C queue converts ambiguous submit to `unknown`; M prevents duplicate submission evidence | Preserve job IDs and unknown state; explicit reconciliation instead of blind retry |
| Claude/Codex subscription work | H + external agent workflow | D: H agent guides; S: A API client establishes a different route | Start with signed-in coding agents and constrained local operations; do not require a new embedded co-director for the pilot |

## The minimum useful product for this film

The first product should expose a short, coherent journey:

1. **Story and shots:** existing screenplay, dialogue line IDs, intended coverage and shot durations.
2. **References and direction:** character/wardrobe/table/location assets; approved start frame; framing, camera, eyeline, light, acting and reaction timing.
3. **Generate and review:** exact provider route/request, applicable approval, persisted job ID, candidates, notes and selected take.
4. **Edit and finish:** picture, dialogue, ambience/foley/music and subtitles; explicit source trims and J/L cuts; preview and local export.

These are workflow areas, not four applications to merge. Extra template galleries, avatar presenters, social-ad workflows, cloud rendering and Drive synchronization are optional. Automated ComfyUI submission and an embedded agent runtime are later modules, not prerequisites for the first scene.

## Reuse inventory

| Candidate / source paths | Reuse form | Work still required |
| --- | --- | --- |
| H `packages/cli/src/timeline/`, `commands/render/`, `packages/core`, `packages/producer`, `skills/hyperframes` | Keep upstream modules behind a narrow production integration | Validate long footage, trim/rate/audio semantics, deterministic output and editor operations without HeyGen media services |
| O `packages/core/src/script/{fountain,shots,production,timeline-builder,assemble,edl}.ts` | Extract/adapt pure production logic; retain relevant tests | Separate OpenReel `Project`/`Clip` coupling, map names/IDs, adapt output to H, preserve manifest compatibility |
| O `apps/web/src/services/{production-folder,take-dialogue,scene-assembly}.ts` and `ShotBoardDialog.tsx` | Reuse workflow behavior and boundary tests selectively | Avoid importing the full browser application or a second source of project truth |
| A `packages/prompt-compiler/src/{router,preflight,capabilities}.ts`, `shared-types/src/shot.ts` | Adapt compiler/performance behavior and diagnostics | Refresh selected account/model contracts at live acceptance; retain motion/dialogue and voice-unknown diagnostics |
| A `apps/studio-server/src/routes/takes.ts`, `docs/COMFYUI_REFERENCE_FRAMES.md` | Adopt candidate import/approval behavior | Bind it to the chosen authoritative project/shot model; preserve originals and hash validation |
| A `packages/cut-assembly`, `apps/studio-server/src/cuts/` | Optional draft-cut service | Ensure approval creates a proposed cut and never replaces an existing human edit |
| C `studio/{references,preparation,approvals,queue,timeline}.ts` | Reuse domain services/patterns, not its entire app shell | Map persistence and revision contracts coherently; avoid layering C's SQLite entity model over A's database without an explicit migration |
| C `local-models/service.ts`, `resources/`, `system/integrated-recovery.test.ts` | Explicit assistance/resource/recovery patterns | Confirm public interfaces and run isolated acceptance; no inference or backend-release claims from status alone |
| M `production-plan.json`, screenplay/dialogue CSV, board/approvals, `scripts/{production_plan,kling_release,kling_batch}.py` | Film import contract and producer approval semantics | Versioned import with conflict/missing-media report; preserve original state and historical evidence |

This is a candidate inventory, not permission to copy every listed file verbatim. Adaptation cost is highest for UI/editor code, persistence, platform authentication and timeline round trips; lowest for pure parsing, naming and diagnostic logic with bounded inputs.

## Architecture alternatives

| Option | Benefit | Cost / risk | Position |
| --- | --- | --- | --- |
| Hyperframes fork with isolated film-production package/service | Matches the preferred workspace and subscription-driven authoring; retains one principal composition engine | New production inspector/workflow and a verified timeline adapter are needed; ongoing upstream maintenance | Preferred candidate, conditional on pilot |
| Argon-first app using Hyperframes for compositions/exports | Retains the most production services and existing shot UI | Keeps more Argon maintenance; browser preview/master semantics may diverge across two render paths | Fallback if H cannot support required editing cleanly |
| Separate film composition project using unmodified H plus existing tools | Least framework maintenance; fastest way to test a scene | Workflow remains spread across tools and records | Best feasibility spike before committing to the full fork |

Do the feasibility spike as a composition project first, then fork only the surfaces that require product changes. The eventual fork can still be H-based; proving the edit path does not require copying all of H or Argon immediately.

### Proposed ownership and adapter boundaries

- One production service owns project/scene/shot/asset/reference/take/job records, revisions and approvals. The exact persistence implementation is an implementation-design decision after the pilot, not settled by choosing attractive modules from both Argons.
- One edit representation owns the sequence. For the preferred H route, H's composition files are the editable sequence; the production service stores shot-to-clip associations and a known composition revision/hash. It must detect edits rather than regenerate over them.
- A one-way adapter initially places selected owned media and audio into a composition. Every unsupported operation produces a diagnostic. Automatic bidirectional synchronization is excluded from the first version.
- Producer approval and job creation remain server-controlled. External coding agents can plan and propose changes through reviewed operations; agent text itself grants no approval.
- Existing M records remain authoritative until an explicit import/migration is accepted. The new app must not quietly become a second mutable approval ledger.

## Conflicts that must be resolved

1. **Provider execution policy:** M currently requires the installed Kling CLI and producer release runner; A uses MCP adapters. Their permissions and execution assumptions cannot be combined implicitly. The fork design must name the one permitted route for this film and retain the applicable release checks.
2. **Shot-store duplication:** A explicitly documents that server shots and the editor's local manifest are different stores. A new import must map them once, not assume a shared shot list.
3. **Identity and naming:** O's production codes, A's asset handles and C's project/connection-scoped binding identities are different concepts. Display names, canonical bytes and external registrations need separate fields.
4. **Timing and rendering:** O uses seconds; A's bridge converts to integer milliseconds; H has time-based HTML clips plus frame-sensitive operations. Conversion needs a selected frame rate and explicit rounding without cumulative gaps. Source trims, rate and audio offsets require parity checks.
5. **Lossy export:** A `packages/openreel-bridge/src/to-edl.ts` limits track slots and reports transforms, effects, speed changes, fades, masks, grading and other unsupported features. It reports text/subtitles as not rendered by that server path. Do not copy that bridge as a general lossless editor adapter.
6. **Dialogue and motion:** A's compiler rejects motion-control plus dialogue in one request. Voice identity can be unknown, and duration may be clamped. The UI must preserve those facts instead of promising a single generation can deliver every acting instruction.
7. **Subscription versus API:** A's embedded co-director has separate API billing. C's optional runtime has external isolation/inventory acceptance requirements. Neither should block the initial signed-in Claude Code/Codex workflow.
8. **Film rules:** M's character likeness, fixed table/wardrobe, historical face restrictions and guide-versus-final voice distinction must survive import. Technical completion does not approve creative content.
9. **Mutable source state:** M has extensive existing deletions and other changes. An import must report absent files and preserve state; it must not recover deleted generated material from Git as a convenience.

## Licensing and provenance inventory

H's root `LICENSE` contains Apache-2.0; O's root `LICENSE` contains MIT. C's vendored OpenReel notices and editor-adoption document identify additional dependency terms, including MediaBunny's MPL-2.0. A and C did not expose a root LICENSE in the tracked filename inventory; this is an unresolved adoption/provenance item, not a conclusion that copying them is permitted or forbidden.

Keep upstream notices and file provenance. Review the exact candidate files and transitive dependency graph before copying/distributing. Do not describe the combined application as uniformly Apache or MIT based solely on an editor's root license. This audit inventories files and existing adoption records; it is not a completed distribution-license review.

## Recommended implementation sequence

| Stage | Concrete deliverable | Acceptance before continuing |
| --- | --- | --- |
| 1. Existing-media feasibility | One short exchange in an isolated H composition, with speaking shot, motivated reaction, dialogue and room tone | Trim/rate/placement and audio survive local export; normal-speed playback is reviewed; original records untouched |
| 2. Unified production contract | Proposed project/shot/reference/take/job schema and one-way import mapping | Exact line IDs, provenance, pending approval and missing-media states survive an isolated import; no vendor request |
| 3. Minimal H production workspace | Shot list, reference/direction inspector, selected-take placement | Human timeline edits survive updates; unsupported operations are visible; one authoritative edit |
| 4. Provider preparation/reconciliation | Adopted compiler, preflight, explicit generation authorization, job/result tracking | Correct reference/model route, fresh reviewed request, duplicate/unknown outcome handling; live generation separately authorized |
| 5. ComfyUI/local assistance | Manual original-image import first; bounded local suggestions later | Metadata/bytes retained, no implicit approval, selective apply, isolated inference/resource acceptance |
| 6. Film pilot and expansion | A complete accepted exchange/chapter, then remaining encounters | Picture, identity, face safety, dialogue, language, sound and exported media accepted in their own scopes |

Do not estimate delivery in days from a file inventory. Stage 1 determines whether the preferred architecture is practical. If its required edits cannot survive export, stop the H-first integration and compare the Argon-first fallback before building a large production UI.

### Future pilot checklist

- Use an owned-media subset with known hashes; no new provider spend is required to test editing.
- Include at least three clips: speech, reaction and return/continuation; the reaction follows its motivating line.
- Include source in/out trims, room tone and an audio overlap/J- or L-cut; include a subtitle/title if the selected sequence needs one.
- Change a shot choice, preserve an intentional timeline adjustment, save/reopen and undo; identify drift instead of replacing edits.
- Export locally; decode the whole master, verify duration/clip boundaries, sample picture at boundaries and measure/listen to audio.
- Review normal-speed playback for dialogue, reaction timing and film-specific face/continuity rules. Render success alone does not pass the scene.
- Keep any optional live generation as a separate exact-payload approval, with recorded job/output and no automatic retry.

## Evidence index

The evidence manifest hashes these sources and the relevant guidance. Important entry points:

- H: `skills/hyperframes/SKILL.md`, `skills/media-use/references/setup-providers.md`, `docs/guides/with-codex.mdx`, `docs/studio-app/connect-your-agent.mdx`, `packages/cli/src/timeline/describeProject.ts`, `a2Mutations.ts`.
- O: `CLAUDE.md`, `docs/film-production.md`, `packages/core/src/script/production.ts`, `timeline-builder.ts`, `assemble.ts`; corresponding `*.test.ts` files are present.
- M: `AGENTS.md`, `workspace.json`, active film `memory/STATE.md`, `manifest.json`, `tasks/board.json`, `00_brief/approvals.json`, `05_storyboard/source/production-plan.json`, `docs/PRODUCTION_PLAN.md`, `scripts/kling_batch.py`.
- A: `README.md`, `docs/COMFYUI_REFERENCE_FRAMES.md`, `docs/references/README.md`, compiler router/preflight, shared shot types, take routes, OpenReel bridge, API co-director, live-scene ledger. Router/preflight/take/bridge test sources are present.
- C: `PRODUCT.md`, `DESIGN.md`, `docs/use-cases.md`, authority/platform/acceptance contracts, `studio/references.ts`, `queue.ts`, `local-models/service.ts`, `docs/reports/CODEX_DELIVERY_REPORT.md`. Reference, queue, recovery and browser acceptance sources are indexed by its use-case router.

## Research completion and remaining uncertainty

The source comparison, reuse inventory, architecture options, risk assessment and staged recommendation are complete for this audit scope. Source-path/hash checks accompany delivery. No current runtime, credentials, balance, account entitlement, model readiness, browser usability, performance or cinematic acceptance was verified. Historical live output is recorded in A, but the media was not decoded or artistically reviewed here. Automated ComfyUI execution and transparent timeline round trips remain unproven.

The next concrete implementation candidate is the isolated existing-media feasibility composition. A new fork's name, destination, final persistence model and migration/activation scope remain decisions for the subsequent design; this research does not manufacture them.
