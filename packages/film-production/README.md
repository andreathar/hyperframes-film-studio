# @hyperframes/film-production

Shared records for the film Studio. The browser may import `@hyperframes/film-production/browser` or `@hyperframes/film-production/contracts`. Those entries parse scene briefs, assistant context, capability snapshots and project commands. They do not read files, spawn providers, or authorize a Kling release.

`@hyperframes/film-production/legacy` is server-only. It is the single copy of the audited import, review, job, Kling handoff and placement services. The root `scripts/film-production` commands re-export it so existing CLIs keep their paths.

Compilation of a scene brief never sets `executable` to true. A Kling request stays blocked until the canonical producer runner releases it.
