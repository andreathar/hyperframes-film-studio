# Film production foundation and feasibility implementation

Goal: create the owner fork, then prove a one-way production-manifest → editable Hyperframes composition → local MP4 path before larger consolidation.

Authorization: Andre's “create our fork now and proceed” accepts the research recommendation. Existing film records remain authoritative; no generation, artistic approval or provider activation is included.

## Decisions

- Independent checkout and GitHub fork `hyperframes-film-studio`; upstream history and licenses preserved. Work on `feat/film-production`.
- Node built-ins for a small local preparation tool under `scripts/film-production/`; use Bun for workspace operations. No new runtime/dependency or embedded API agent.
- A versioned, frame-based manifest holds stable shot/clip IDs, direction notes, selected candidate takes and separate audio placement. It is a preparation input, not a second approval ledger.
- Output is a newly created directory with copied, hash-verified assets, portable manifest, receipt and ordinary editable Hyperframes HTML. Existing destinations are refused; a later preparation cannot replace user edits.
- A single picture track and independent audio tracks are supported initially. Unknown fields/unsupported operations fail explicitly. No automatic timeline synchronization or provider calls.
- Private film media, manifests, logs and renders stay under ignored `.film-workspace/`. Public example/test fixtures contain only synthetic metadata.

## Tasks and verification

1. Fork/checkout/setup: verify GitHub parent, preserve original checkout, install locked Bun dependencies and build the fresh checkout.
2. Preparation contract: tests first for invalid IDs/timing, missing references, unsupported fields, drift/hash mismatch, path escape, overwritten edits and atomic failure. Test the actual CLI and real filesystem; generated composition is read through a DOM parser.
3. Implement compiler/preparer with no network or provider execution; register tests in the root script runner and document the command.
4. Existing-media feasibility: privately copy current candidate media without changing originals; record original hashes and candidate-only status. Build three picture clips with source trims and separately timed dialogue/room sound. Preserve the canonical film decisions and avoid treating this as a new approved cut.
5. Run Hyperframes lint and browser check; inspect boundary frames, render locally, decode the full master and measure picture/audio. Exercise timeline edit → undo and verify exact restoration. Record unresolved cinematic acceptance honestly.
6. Review the complete diff, lint/format changed source, run relevant script tests and required reachability checks. Commit/push only reviewed source/docs/tests; verify remote branch and retain private output locally.

## Acceptance and next stages

This foundation is complete when the new fork is verified, preparation behavior is tested, the actual media/render evidence is recorded and the implementation is on the fork branch. It does not complete the multi-stage consolidation. Next: design/import the film records and scoped reference/take/job services, then integrate production UI and separately authorized live adapters. Stop expanding the UI if the feasibility render cannot preserve the required edit semantics.
