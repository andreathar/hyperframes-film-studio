# Film Studio production workflow design

Status: concrete design for producer review. Implementation delegation is the requested execution method. Existing inspector runtime repair is already delegated under the previously approved inspector contract; the new product work follows this reviewed design.

## Intent

Make **The Table Between Centuries** through the public Hyperframes Studio: keep story, references, camera/action/dialogue direction, generation candidates and the editable timeline connected. The assistant helps author good scene briefs and explains validation; deterministic services control data integrity, native parameters and provider execution. Use the producer's existing agent sessions, with no required HeyGen generation credits or embedded paid co-director API.

Success is a recoverable production cycle: open project → choose shot/references → author scene → inspect compiled prompt/parameters → prepare/release an exact request → reconcile returned media → select candidate → edit picture/audio → render → reopen without losing decisions. An offline cycle with owned media must work before live generation is claimed.

## Verified starting point

Base `5ff23acdd`: existing source import, explicit review, durable jobs, blocked Kling handoff and new-composition placement. The current film snapshot contains six Galileo plan shots, 41 legacy shots, 14 references and 11 take records; mappings require explicit producer reconciliation. Current source/media hashes were checked during the preceding audit. Existing rendering feasibility is useful but does not certify a complete new-candidate cycle.

The public Studio's Ask Agent action copies contextual instructions to the clipboard (`packages/studio/src/hooks/useAskAgentModal.ts`). Its exported editor tools are usable seams. This checkout does **not** contain the desktop chat/login implementation described by `docs/studio-app/`. A connected assistant is new host functionality, not an already implemented endpoint.

## Approaches and recommendation

1. Expand the standalone companion inspector into the main application: quickest local demo, but creates two frontend/editing contexts and another later migration.
2. **Recommended:** native production/assistant panels in the public Studio, one shared production package, narrow host capabilities and the existing renderer/release boundary. Costs a controlled package extraction and assistant-host implementation; preserves one editor and one source of domain rules.
3. Depend on the separately shipped desktop chat: source/extension contract is unavailable here, so it cannot be the implementation baseline.

Approach 2 is the engineering recommendation for this document, not a claim that unavailable desktop source has been ported. Existing producer decisions to use Hyperframes and preserve source authority remain in force.

## Product surfaces

Add `Production` and `Assistant` dock panels; keep preview, timeline, asset browser, undo and iframe chrome unchanged. Production contains shot/direction context, reference-role selection, editable scene brief, compiled prompt/native settings and diagnostics, job/attempt history, returned candidates and explicit placement. Assistant is one contextual conversation/draft surface with provider status, cancellation and recoverable proposals. Existing Ask Agent routes to it when available; clipboard/file handoff remains usable otherwise.

Use existing design tokens/dock components. Extract focused modules under `packages/studio/src/film/`; do not grow App.tsx beyond the repository's limits or embed the companion screen as another iframe application. Keyboard access, draft persistence, project switching and late-response isolation are acceptance requirements.

## Shared domain boundary

Create `@hyperframes/film-production` using existing workspace build/export conventions. Move audited service logic into the package without changing its behavior; existing `scripts/film-production/*-cli.mjs` remain compatibility entrypoints. Do not keep duplicate reducers or make studio-server import repository-relative scripts from a published package. Public types and parsers are shared by the API, compiler, assistant and UI. Preserve the audited ESM algorithms during extraction; add typed boundaries and small adapters instead of simultaneously rewriting every service. The initial verified host is Linux, matching existing descriptor checks; other hosts report unsupported capabilities until separately qualified.

Project-owned state is stored in a configured private data directory, not localStorage or generic editor file routes. A descriptor binds canonical film ID/root, source snapshots, current catalog/review revision, jobs, scene drafts, attempts and selected edit. Imported documents and historical request snapshots remain immutable evidence. Source updates produce explicit revisions/reconciliation; additive candidates do not erase old review/job history. Authority/creative approval stays external and explicit.

Core records: `ProjectDescriptorV1`, `SourceRevisionV1`, `CandidateV1`, `ReviewSnapshotV1`, `SceneBriefV1`, `CompilationV1`, `CapabilitySnapshotV1`, `JobIntentV2`, `AttemptV1`, `ProviderReceiptV1`, `AssistantTurnV1`. IDs, frame timing, revision/fingerprint rules and diagnostics live in one contracts module. A producer-safe ID is separate from a human label.

## Structured scene and prompt quality

`SceneBriefV1` binds project, shot key, source/review revision and authoring provenance. It contains:

- subjects and supplied identity/wardrobe/prop facts;
- reference IDs/hashes, media kind, subject association, intended role/control and exclusions;
- framing, angle, lens/focus intent, opening/ending composition, camera path, screen direction/axis;
- setting, light sources/direction, material/palette/atmosphere intent;
- timed frame-based action beats with beginning, progression and observable end; separate subject/camera/environment motion;
- exact dialogue text, speaker, language, delivery/voice intent and timing evidence where required;
- sound strategy, ambience/SFX/music/silence expectations;
- continuity locks, allowed changes, exclusions and entry/exit anchors;
- output kind/size/fps/durationFrames and optional route preference.

Assistant output is an untrusted proposal. It cannot manufacture approved references, voice verification, measured duration, provider availability, prices or releases. Exact dialogue bytes must survive compilation; no silent translation, punctuation changes or extra speakers.

Pure `compileScene(brief, context)` returns `{prompt, nativeCandidate, diagnostics, sceneSha256, compilationSha256, capabilitySnapshotSha256, executable:false}`. Creative draft compilation is available offline. Native readiness requires a valid account-derived snapshot; absence yields unresolved parameters, never guessed model defaults.

Prompt ordering: reference grounding → opening composition → timed action/acting progression → camera rhythm → environment/light → exact dialogue/sound → continuity/exclusions. Initial editable patterns: restrained dialogue coverage, listening/reaction, prop/hand insert, establishing continuity, reference-led motion. Patterns are defaults/constraints with provenance, not promises of physical camera obedience. Show which fields are prose intent and which are actual native controls.

Validate overload, contradictory camera moves, impossible timing, missing speakers, required unknown voice, unsupported sound, missing reference roles and policy conflicts. Do not silently clamp duration, drop assets or switch models. The canonical film profile's current Omni/multishot restrictions are profile diagnostics, not universal Kling facts.

## Native capabilities and provider modules

`ProviderAdapter` exposes `inspectReadiness`, `prepare`, and only supported `submit/reconcile/importResult` operations. Each response declares capability and evidence; a manual route is distinct from executable transport. No universal raw-command endpoint.

- **Kling:** preserve the canonical Movies release runner as sole submitter. Adapt Argon pure compiler/reference-validation concepts, not its direct MCP adapter or hardcoded router. Capture sanitized current tool/model/argument/input/combination schemas with runtime identity and digest. Bind exact compiled scene/prompt/args/reference bytes/shot contract to the canonical payload hash, current schema, release/quote/upload scope and attempt. Unknown outcomes reconcile the same native task; explicit new attempts require a new exact release. Preserve native task/trace IDs and original output identity.
- **Higgsfield:** ship an owned-media handoff/import module with provenance and metadata. Automatic execution is enabled only when a supported authenticated interface is qualified; no invented public API or claim that a Codex plugin is already a product backend.
- **ComfyUI:** explicit selected server/workflow/model readiness, typed workflow input binding, queue/history/result reconciliation and candidate import. Never start the server, download weights or load models as a side effect of browsing. Workflows are versioned and their hashes bound to jobs.
- **Local models:** opt-in configured local assistant profiles produce the same scene proposals. Local media workflows reuse the ComfyUI pipeline where applicable rather than creating another generation engine. Model/resource readiness and a shared GPU execution limit prevent competing workloads. No automatic model selection/loading.

Plugin Global CLI and canonical installed Kling CLI currently have different invocation/telemetry contracts. Qualification must establish actual compatibility; do not replace the canonical transport with the plugin command or treat REST documentation as CLI/account authority.

## Assistant host and subscription constraints

The browser calls typed project-scoped assistant routes. Hosts own executable resolution, argument arrays, process lifecycle, event parsing and cancellation; no shell evaluation and no credentials in frontend/logs. Readiness distinguishes missing CLI, unauthenticated, unsupported protocol, unavailable mode, limited usage and ready. Executable discovery/process spawn/clipboard success are not authentication proof.

First in-app adapter: Codex noninteractive structured output through its installed signed-in CLI. Pin/test the supported protocol per installed version; stream normalized events, persist turn/context and validate returned SceneBrief. Local host qualification must prove proposal-only tool isolation. A rich app-server adapter can follow behind the same interface after compatibility tests; do not rely on experimental WebSocket transport for the first release.

Claude remains usable through the existing external Claude Code session/file+clipboard handoff using the identical scene schema and authoring skill. An in-app Claude subscription adapter is a separately qualified capability: current official Agent SDK guidance does not generally permit third-party products to offer Claude.ai login without approval, and bare CLI mode does not use subscription login. Do not expose a new Claude.ai login proxy, extract OAuth tokens or silently choose API billing. An unavailable mode remains honest in the UI while external authoring works.

Proposal mode cannot run provider CLIs, arbitrary shell/filesystem mutations or paid actions. Disable inherited unapproved tools/MCP/hooks through verified runtime controls; if isolation cannot be established, fail to external handoff. Canonical file context, references and approved facts are supplied by the domain context builder. Sending chat text is not release authorization. Product actions apply validated proposals only against the expected project/shot/revision.

## API and editing integration

Optional `StudioApiAdapter.film` and `.assistant` typed capabilities extend shared Hono routes under `/projects/:id/film/*` and `/projects/:id/assistant/*`. Missing host capability returns an explicit unavailable response, retaining old behavior. CLI host wires real capabilities; Vite uses disabled/fake adapters by default. A same-origin project session bootstrap returns the ephemeral mutation token and protocol/capability version. Mutations require matching Host/Origin, token, bounded JSON and expected project revision; event cursors are project-scoped. Authenticate local mutations with those checks and project-resolved paths. Generic editor routes cannot read private credentials/state.

Selected clip → film shot is an explicit metadata lookup, never an equality assumption between DOM ID and shot key. Each assistant turn freezes its target context; late events cannot mutate a different shot/project. Candidate placement creates a new assembly or applies an explicit version-checked editor operation through existing mutation/undo machinery. Never overwrite a human edit on re-preparation.

## Quality gates and delivery

Milestone A: coherent runtime, shared contracts and durable/revision-safe lifecycle. Milestone B: native Studio panels, proposal-only assistant, deterministic scenes and owned-media closed loop. Milestone C: one qualified Kling route through release/result binding. Milestone D: Higgsfield, ComfyUI and local profiles on the same contracts. All modules are in scope; gates determine when execution claims are valid.

At most three independent implementation workers plus parent integrator. Stable contract commit precedes parallel consumers. Separate peer worktrees/branches and explicit file ownership; parent alone owns shared exports, workspace manifests, route registration and final wiring. Task-scoped tests and independent milestone review; no repeated whole-monorepo runs for documentation-only work. Each milestone has an actual browser/decoded-media acceptance case, not a larger test-count target.

No paid request, upload, real model inference or creative selection is authorized by plan acceptance alone. Live action uses the producer's existing exact-request release. No real process restart occurs before preserving/reconciling its current review.

## Current sources

- Local: public Studio AskAgent/selection/dock/tool seams; shared Hono adapter; audited film services; Argon pure compiler/preflight; the canonical Movies contract, release and batch-runner modules in its external checkout.
- [Codex structured CLI output](https://learn.chatgpt.com/docs/non-interactive-mode#create-structured-outputs-with-a-schema), [app-server](https://learn.chatgpt.com/docs/app-server).
- [Claude programmatic CLI](https://code.claude.com/docs/en/headless), [Agent SDK integration restriction](https://code.claude.com/docs/en/agent-sdk/overview#get-started).
- Context7 official Kling API documentation was consulted for API concepts only; selected CLI/account schemas and the canonical runner govern this product's native request.
