# Initial production foundation — verification

The fork now has a local manifest-to-composition preparation tool. See [the guide](README.md) and [implementation scope](PLAN.md).

## Implemented

- Strict versioned project/shot/edit input with integer-frame timing, direction and dialogue notes, shot/take IDs and independent audio tracks.
- Source trim/rate validation against actual per-stream coverage and supplied media hashes.
- Local-only, byte-preserving asset copying with path containment, staged failure cleanup and refusal to replace an existing output directory.
- Portable editable Hyperframes HTML, production metadata and preparation receipts.
- Root commands `film:prepare` and `film:test`, script-test registration and fork-specific documentation.

This initial component contains no vendor submission, approval management, automated ComfyUI execution or embedded agent API client. It grants no creative approval and does not mutate the source projects.

## Checks performed

| Check                                                           | Result                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Fresh locked dependency installation and full package build     | Passed                                                                                                              |
| Focused film tests                                              | 20 passed; no failures/skips                                                                                        |
| Root script suite                                               | 879 Node tests and 109 Vitest tests passed; no failures/skips                                                       |
| Test reachability                                               | Zero orphan tests                                                                                                   |
| Changed JavaScript lint and formatting                          | Passed                                                                                                              |
| Private existing-media feasibility preparation                  | Passed; source bytes preserved; re-preparation reproduced the original output hashes                                |
| Hyperframes static lint                                         | Zero errors/warnings                                                                                                |
| Hyperframes real-browser check                                  | Passed, browser not skipped; motion stage disabled and no text contrast targets, so neither is a separate clearance |
| Local render                                                    | 17 seconds, 1920×1080, 24 fps, 408 video frames, stereo AAC at 48 kHz                                               |
| Entire exported master decoded                                  | Passed                                                                                                              |
| Six decoded boundary/midpoint samples against browser snapshots | SSIM 0.963–0.979; visually inspected; not pixel-identical certification                                             |
| Independent expected audio mix against decoded export           | Correlation above 0.9999 in sampled dialogue and room-tone regions                                                  |
| Timeline volume edit and undo                                   | Restored the actual pre-edit file byte-for-byte                                                                     |
| Independent code review                                         | Approved after unequal-stream-duration regression fix                                                               |

The source-duration regression used a synthetic container with longer picture than sound. A container's duration cannot certify its audio stream's coverage. Unknown per-stream duration is now refused; some otherwise usable media may need a separately verified local conversion first.

Hyperframes' timeline tools stamp stable element IDs. The undo check compares with the actual pre-edit backup, not the earlier preparation hash. Those stamps do not establish a new creative revision or approval.

## Limits and next work

Private media and evidence remain under ignored `.film-workspace/`; they are not published with the fork. The fixture uses existing unaccepted material and guide sound solely to test editing. It is not a final or accepted scene. Whole-film continuity, likeness, normal-speed picture/audio acceptance and final dubbing remain open.

The interactive browser-control host was unavailable. The managed local preview returned HTTP 200, and real headless browser checks/snapshots were completed; no manual UI walkthrough is claimed.

The preparation schema is an edit-input contract. It does not synchronize later HTML edits back into the manifest. Automatic bidirectional synchronization is excluded. Concurrency stress and non-unit-rate media parity are follow-up coverage; neither was represented as verified by this fixture.

Next implementation stage: a versioned import of the existing film records and a coherent reference/take/job authority model. Preserve the proven one-way adapter and existing timeline edits. Provider activation and any new generation remain separately scoped to an exact reviewed request.
