# Release notes

Reviewed GitHub Release bodies live here.

Create the next draft with:

```bash
bun run release:prepare <version>
```

The first run drafts missing changelog artifacts and exits non-zero for review. After rewriting the generated TODO summary, rerun the same command to create the release commit and tag.

The publish workflow uses `releases/v<version>.md` as the GitHub Release body when the file exists. Keep these notes user-facing; implementation details can stay in pull requests.

## Fork versioning

This repository is a fork of [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes). Fork releases are tagged as a prerelease suffix on the upstream version they build on:

```
v<upstream version>-film.<n>      e.g. v0.8.223-film.1, v0.8.223-film.2
```

- **Scheme.** `<upstream version>` is the latest upstream tag reachable from `main`. `<n>` starts at `1` and increments by one for every fork release cut against that same upstream version.
- **Reset on upstream sync.** After merging a new upstream release, the suffix resets: the first fork release on top of upstream `v0.9.0` is `v0.9.0-film.1`.
- **No plain upstream tags.** Never create a plain `vX.Y.Z` tag in the fork. Those names belong to upstream, and a fork tag with the same name would collide on the next sync.
- **Changelog gate.** `-film.<n>` is the fork's stable line, so `release:prepare` applies the full changelog review to it (unlike `-alpha`/`-beta` prereleases).

Cut a fork release with the same command, for example `bun run release:prepare 0.8.223-film.1`. The `-film` suffix makes the publish workflow treat the tag as a prerelease channel, which is what keeps it from being mistaken for an upstream release.
