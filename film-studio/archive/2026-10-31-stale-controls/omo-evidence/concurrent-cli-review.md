# Concurrent CLI review — independent source inspection

Reviewed revision: f55fb732b0a4d501edb1c040692288791d0523f7; delta from963d9b424. Reviewer: /root/architecture_review. No tests, processes, provider operations or network requests performed by reviewer. This assessment does not certify runtime behavior. Parent separately inspected the schema and public start implementation from Git objects.

Disposition: not ready for integration as a functional streaming/recoverable assistant host.

1. P1 — codex.ts:47–69 defines required SceneBrief fields and additionalProperties:false without properties. Every required field is forbidden. The mocked test at assistant.test.ts:220–222 checks title text, not schema acceptance. Validate an actual valid brief against the emitted schema.
2. P1 — host.ts:73–76,143 waits for generation before returning its generated turn ID; events.ts:135–145 stops at current event-array tail. Normal callers cannot start, obtain an active ID, subscribe to future events and cancel. Existing cancellation tests inject a known ID and cancel inside the fake runner. Require a deferred runner exercised solely through public ports.
3. P1 — host.ts:143–147 qualifies isolation after running the injected process; qualification.ts:24–31 trusts optional booleans whose absence passes. This detects prohibited behavior after execution. No concrete process spawner exists yet, limiting present exposure; real transport must remain unavailable until pre-execution qualification is enforced.
4. P2 — host.ts:55–58,359–361 keeps turns in memory and restarts turn numbering. externalClaude.ts:54–58 exclusively creates turn-ID handoffs, colliding after restart; events/proposals cannot reopen. Require unique/recoverable identities and existing-directory restart tests.
5. P2 — context.ts:77–81 redacts stdout before parsing. events.ts:112–116 can silently replace valid creative dialogue matching secret-like text. Parse the original payload; restrict redaction to diagnostic/display copies, or reject explicitly rather than changing accepted dialogue.
6. P2 — resolver failure at host.ts:113 and temp/schema setup failures at143,156–158 occur outside runCaught handling, leaving an inserted streaming turn without terminal events. Require sealed setup-error regressions.

Integration limits: only tests construct createFilmAssistantHost; no concrete process runner is included. Default executable resolution remains unauthenticated. inspectCodex readiness can disagree with runner/environment availability. These limits are separate from the concrete defects above.
