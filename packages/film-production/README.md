# @hyperframes/film-production

Shared records for the film Studio. The browser may import `@hyperframes/film-production/browser` or `@hyperframes/film-production/contracts`. Those entries parse scene briefs, assistant context, capability snapshots and project commands. They do not read files, spawn providers, or authorize a Kling release.

The audited import, review, job, Kling handoff and placement services live in `src/legacy`. Root `scripts/film-production` commands re-export those modules by relative path so existing CLIs keep their paths. This package does not publish a compiler.

The production inspector is checkout-only. Its UI assets stay in the repository at `film-studio/inspector/`. An installed copy of this package cannot run the inspector.

The contracts accept project-relative paths with forward slashes and preserve them byte-for-byte. This is lexical validation only; filesystem services must separately confine opened descriptors to the project root, including symlink handling.
