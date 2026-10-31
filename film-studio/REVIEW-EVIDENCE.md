# Historical research and review evidence

These reports preserve the source research and independent reviews performed during implementation. They describe the revision and findings at review time. Earlier blocking findings remain in the reports as history; use the corresponding delivery record, regression tests and later commits to assess their resolution. They do not grant provider or creative approval.

Research: [source consolidation report](../docs/research/2026-10-31-film-studio-consolidation-report.md) and [captured source evidence](../docs/research/2026-10-31-film-studio-evidence.json). These are the pre-fork audit, not a current implementation status report.

| Review                                                                     | Resolution and delivery context                                                                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Local media preparation](../.omo/evidence/film-production-code-review.md) | [Preparation delivery](DELIVERY.md); selected-stream coverage checks and regressions ship in `7f5eddaec`.                                              |
| [Film source import](../.omo/evidence/film-import-code-review.md)          | Report includes its resolved H1 re-review; [import delivery](IMPORT-DELIVERY.md), commit `37d7e7d5e`.                                                  |
| [Shot review state](../.omo/evidence/film-review-state-code-review.md)     | [Review delivery](REVIEW-DELIVERY.md), commit `4b12f3089`.                                                                                             |
| [Production inspector](../.omo/evidence/film-inspector-code-review.md)     | [Inspector delivery](INSPECTOR-DELIVERY.md), commit `21e1ddefd`.                                                                                       |
| [Durable job ledger](../.omo/evidence/film-provider-jobs-code-review.md)   | [Job delivery](JOBS-DELIVERY.md), commit `edb6a469c`; descriptor confinement, nonregular-file and publication regressions cover the reported findings. |

The [Kling handoff review](../.omo/evidence/kling-handoff-code-review.md) records the initial relocation finding. Its resolution, current stationary-ancestor boundary and canonical parity evidence are in [handoff delivery](KLING-HANDOFF-DELIVERY.md), implementation commit `84ec48ba0`.

The [candidate placement review](../.omo/evidence/film-placement-code-review.md) records its nonblocking masked-validation test finding. The corrected regression and parent verification are in [placement delivery](PLACEMENT-DELIVERY.md), implementation commit `163e613dd`.
