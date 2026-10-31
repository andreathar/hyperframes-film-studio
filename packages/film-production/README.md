# @hyperframes/film-production

Shared records for the film Studio. The browser may import `@hyperframes/film-production/browser` or `@hyperframes/film-production/contracts`. Those entries parse scene briefs, assistant context, capability snapshots and project commands. They do not read files, spawn providers, or authorize a Kling release.

`@hyperframes/film-production/legacy` is server-only. It is the single copy of the audited import, review, job, Kling handoff and placement services. The root `scripts/film-production` commands re-export it so existing CLIs keep their paths.

The legacy inspector requires the repository checkout layout: it reads its UI assets from checkout-root `film-studio/inspector/`. Those assets are not included in this package, so the published package alone cannot run the inspector.

The contracts accept project-relative paths with forward slashes and preserve them byte-for-byte. This is lexical validation only; filesystem services must separately confine opened descriptors to the project root, including symlink handling.

`@hyperframes/film-production/compile` is server-only. `compileScene` builds the ordered prompt and always returns `executable: false`. `validateNativeCandidate` is the only function that can mark a candidate executable, and only for the snapshot it was given. The Table Between Centuries profile records Omni/multishot as a limit at two references, and native sound as its own limit. Those are film-profile diagnostics. The contract has no separate Omni field.

Compilation of a scene brief never sets `executable` to true. A Kling request stays blocked until the canonical producer runner releases it.
