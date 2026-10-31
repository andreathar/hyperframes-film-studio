# Concurrent compiler review — source inspection

Reviewer /root/audit_domain. Immutable target5769a890a887d939519dead1a5f4bfbdcce57f36, diff fromf55fb732b. Disposition BLOCK / REQUEST_CHANGES. No tests on this head, provider execution, writes or services. Counterexamples below are source-level reasoning, not executed acceptance evidence. Existing correction tests do not validate this revision.

- HIGH: native/validate.ts:204–207,382–395 checks only first named argument and exempts POLICY_ARGS from missing enum checks; serialization retains duplicates. Appending durationFrames999 after96 or soundStrategy:native afterseparate-edit bypasses the corresponding first-value checks. Reject duplicate identities before evaluation, with output/policy negative fixtures.
- HIGH: scene/compile.ts:143–153 retains durationFrames but drops fps; native/validate.ts:140–177 cannot distinguish96frames@24fps from96frames@48fps. Native args/validation hashes coincide although full compilation hash differs. Preserve and validate native timing arithmetic; unsupported timing stays unresolved.
- MEDIUM: scene/diagnostics.ts:191–210 checks required roles across all verified context references, including references not bound to the scene. Use actual verified scene bindings and a fixture with unrelated context prop plus no scene prop.
- MEDIUM: native/releaseProfile.ts:10–15 uses minReferences2 as a proxy for Omni/multishot identity. README acknowledges absent Omni field. The described restriction is not mode enforcement; represent mode/tool facts or leave release unresolved.
- MEDIUM: scene/patterns.ts:27–30 substring matching treats clockwise as containing lock and cannot interpret Locked; no pan. Do not turn this prose heuristic into a definitive contradiction error.

Integration limits: runtimeIdentity/source/review binding is not consumed by native acceptance; JS canonical JSON exponent formatting differs from producer Python formatting, so self-derived hash fixtures do not prove producer hash equivalence; all references including control:prose become native slots and require an explicit boundary decision. Server-only compile export is appropriate, candidate executable remainsfalse, and this diff adds no paid submission path. Determinism and exact-dialogue tests are useful but do not close these acceptance holes.

Remediation order: duplicate arguments, timing, runtime/source binding, actual roles/mode enforcement, heuristic classification, then targeted exact-revision validation before integration.
