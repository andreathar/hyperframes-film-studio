# Static-analysis candidate inventory

Companion to [the audit](../../audits/2026-10-31-code-quality.md). Generated from installed Knip on 2026-10-31 at HEAD `658f01cd0`. **Not a deletion authorization or proof of dead code.** Public exports, vendored assets, standalone scripts and packaging tools require manual verification. No fixes applied.

The absolute original-checkout paths below identify local generated/copied files reported by Knip; they are not tracked files in the audited Git object or promises of files in the managed checkout. Unresolved import strings remain tool findings, not repository citations.

## Counts

- owners: 0
- binaries: 1
- catalog: 0
- dependencies: 9
- devDependencies: 30
- duplicates: 6
- enumMembers: 0
- exports: 157
- files: 268
- namespaceMembers: 0
- optionalPeerDependencies: 0
- types: 236
- unlisted: 80
- unresolved: 3

## File candidates

These are files Knip could not reach with the current configuration. The two film browser probes should be automated, not deleted. Registry/skill files can be distributed payloads rather than imported modules.

- `docs/download-attribution.js`
- `docs/template-gallery.js`
- `scripts/build-docs-gallery-nav.mjs`
- `scripts/scaffold-example-manifests.ts`
- `scripts/sync-docs-catalog.mjs`
- `docs/snippets/advanced-path-grid.jsx`
- `docs/snippets/catalog-detail.jsx`
- `docs/snippets/catalog-gallery.jsx`
- `docs/snippets/day-list.jsx`
- `docs/snippets/docs-video.jsx`
- `docs/snippets/example-player.jsx`
- `docs/snippets/film-rows.jsx`
- `docs/snippets/hover-video.jsx`
- `docs/snippets/install-command.jsx`
- `docs/snippets/quickstart-continuation-grid.jsx`
- `docs/snippets/remix-shelf.jsx`
- `docs/snippets/replica-compare.jsx`
- `docs/snippets/workflow-chooser.jsx`
- `scripts/catalog/build-catalog-artifact.ts`
- `scripts/catalog/build-local-vectors.ts`
- `scripts/film-production/inspector-browser.mjs`
- `scripts/film-production/inspector-jobs-browser.mjs`
- `scripts/page-side-compositing-smoke/run.mjs`
- `skills/figma/scripts/verify-motion.mjs`
- `registry/blocks/code-slice-hero/shadows.js`
- `registry/blocks/code-slice-hero/surface.js`
- `registry/blocks/glass-shard-title/build-bundle.mjs`
- `skills/hyperframes/scripts/bake-basemap.mjs`
- `skills/hyperframes/scripts/locate.mjs`
- `skills/media-use/scripts/audio-duck.mjs`
- `skills/media-use/scripts/eval.mjs`
- `skills/media-use/scripts/prefs.mjs`
- `skills/media-use/scripts/recipe.mjs`
- `skills/media-use/scripts/resolve.mjs`
- `.agents/skills/changelog-video/scripts/align-captions.mjs`
- `.agents/skills/motion-doctrine/scripts/seam-gate.mjs`
- `.agents/skills/motion-doctrine/scripts/seam-stamp.mjs`
- `.claude/skills/changelog-video/scripts/align-captions.mjs`
- `.claude/skills/motion-doctrine/scripts/seam-gate.mjs`
- `.claude/skills/motion-doctrine/scripts/seam-stamp.mjs`
- `registry/blocks/aurora/lib/shaders.iife.js`
- `registry/blocks/blob/lib/shaders.iife.js`
- `registry/blocks/chrome-orb/lib/shaders.iife.js`
- `registry/blocks/code-slice-hero/assets/gsap-3.14.2.min.js`
- `registry/blocks/color-wheel/lib/shaders.iife.js`
- `registry/blocks/cuboid-carousel/assets/cuboid-motion.js`
- `registry/blocks/cuboid-carousel/assets/gsap-3.14.2.min.js`
- `registry/blocks/cuboid-carousel/assets/three.core.min.js`
- `registry/blocks/cuboid-carousel/assets/three.module.min.js`
- `registry/blocks/falling-lines/lib/shaders.iife.js`
- `registry/blocks/flowing-gradient/lib/shaders.iife.js`
- `registry/blocks/fractal-noise/lib/shaders.iife.js`
- `registry/blocks/frost/lib/shaders.iife.js`
- `registry/blocks/frost-sequence-camera-orbit/assets/frost.js`
- `registry/blocks/frost-sequence-camera-orbit/assets/gsap-3.14.2.min.js`
- `registry/blocks/frost-sequence-camera-orbit/source/build.mjs`
- `registry/blocks/gabor-noise/lib/shaders.iife.js`
- `registry/blocks/glass-shard-title/assets/glass-main.js`
- `registry/blocks/glass-shard-title/assets/glass-main.mjs`
- `registry/blocks/godrays/lib/shaders.iife.js`
- `registry/blocks/godrays/source/build.mjs`
- `registry/blocks/godrays/source/driver.js`
- `registry/blocks/goo/lib/shaders.iife.js`
- `registry/blocks/heatmap/lib/shaders.iife.js`
- `registry/blocks/hologram/lib/shaders.iife.js`
- `registry/blocks/holographic/lib/shaders.iife.js`
- `registry/blocks/ios26-liquid-glass/lib/liquid-glass.iife.js`
- `registry/blocks/lens-flare/lib/shaders.iife.js`
- `registry/blocks/light-edge/lib/shaders.iife.js`
- `registry/blocks/liquid-glass-notification/lib/liquid-glass.iife.js`
- `registry/blocks/liquid-glass-widgets/lib/liquid-glass.iife.js`
- `registry/blocks/liquid-metal/lib/shaders.iife.js`
- `registry/blocks/marble/lib/shaders.iife.js`
- `registry/blocks/mesh-gradient/lib/shaders.iife.js`
- `registry/blocks/nebula/lib/shaders.iife.js`
- `registry/blocks/obsidian/lib/shaders.iife.js`
- `registry/blocks/orbit-card/assets/gsap-3.14.2.min.js`
- `registry/blocks/orbit-card/assets/orbit-motion.js`
- `registry/blocks/orbit-card/assets/orbit-scene.js`
- `registry/blocks/orbit-card/assets/three.core.min.js`
- `registry/blocks/orbit-card/assets/three.module.min.js`
- `registry/blocks/plasma/lib/shaders.iife.js`
- `registry/blocks/plastic/lib/shaders.iife.js`
- `registry/blocks/prism/lib/shaders.iife.js`
- `registry/blocks/ripples/lib/shaders.iife.js`
- `registry/blocks/sine-wave/lib/shaders.iife.js`
- `registry/blocks/spiral/lib/shaders.iife.js`
- `registry/blocks/strands/lib/shaders.iife.js`
- `registry/blocks/stripes/lib/shaders.iife.js`
- `registry/blocks/sun-burst/lib/shaders.iife.js`
- `registry/blocks/swirl/lib/shaders.iife.js`
- `registry/blocks/thin-film/lib/shaders.iife.js`
- `registry/blocks/voronoi/lib/shaders.iife.js`
- `registry/blocks/water/lib/shaders.iife.js`
- `registry/blocks/waveform/lib/shaders.iife.js`
- `registry/blocks/worley-noise/lib/shaders.iife.js`
- `skills/media-use/scripts/lib/duck.mjs`
- `skills/media-use/scripts/lib/prefs-store.mjs`
- `skills/media-use/scripts/lib/recipe-store.mjs`
- `registry/blocks/frost-sequence-camera-orbit/source/src/World.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/assets.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/cache.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/frost.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/rewrite.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/tools/compile-preflight.mjs`
- `registry/blocks/frost-sequence-camera-orbit/source/tools/run-shard-compile.mjs`
- `registry/blocks/frost-sequence-camera-orbit/source/tools/shard-compile-probe.ts`
- `registry/blocks/hw-write-title/assets/baked/caveat-pen.js`
- `skills/remotion-to-hyperframes/scripts/tests/fixtures/blocker.tsx`
- `skills/remotion-to-hyperframes/scripts/tests/fixtures/clean.tsx`
- `registry/blocks/cuboid-carousel/assets/addons/environments/RoomEnvironment.js`
- `registry/blocks/cuboid-carousel/assets/addons/utils/BufferGeometryUtils.js`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/AdaptiveResolution.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/clock.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/ease.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/interaction.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/motion.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/schedule.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/seed.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/core/state.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/dials/defaults.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/dials/store.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/erosion/AssemblyField.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/erosion/ErosionField.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/CrackPlanes.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/EnvironmentSampling.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/FastOptics.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/GlassMatcap.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/IceMaterial.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/MeshEntry.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/OpticalTransport.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/SharedSurface.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/SurfaceDetail.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/features.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/optics.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/ice/variant.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/motion/editor.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/motion/meshes.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/motion/objectFrame.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/motion/track.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/post/Post.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/powder/Powder.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/powder/returnGroups.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/powder/shardAtlas.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/rig/LogoRig.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/scene/Backdrop.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/scene/DebugViews.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/scene/Environment.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/scene/Lights.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/scene/Rig.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/deform.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/geometry.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/gpuSdf.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/logo.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/logoRefine.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/sdf.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/text.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/textRefine.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/shape/unionOutlines.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/tsl/noise.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/tsl/t.ts`
- `registry/blocks/frost-sequence-camera-orbit/source/src/vendor/clipper.cjs`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-1-title-card/remotion-src/remotion.config.ts`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-2-multi-scene/remotion-src/remotion.config.ts`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/remotion.config.ts`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/01-use-state.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/02-use-effect-deps.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/03-async-metadata.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/04-third-party-react.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/05-lambda-config.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/06-warnings-only.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/07-custom-hook.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-4-escape-hatch/cases/08-mixed.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-1-title-card/remotion-src/src/Root.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-1-title-card/remotion-src/src/TitleCard.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-1-title-card/remotion-src/src/index.ts`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-2-multi-scene/remotion-src/src/MultiScene.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-2-multi-scene/remotion-src/src/Root.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-2-multi-scene/remotion-src/src/index.ts`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/Root.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/Stargazed.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/index.ts`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/components/AnimatedNumber.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/components/StatCard.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/components/UnderlinedText.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/scenes/OutroScene.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/scenes/StatsScene.tsx`
- `skills/remotion-to-hyperframes/assets/test-corpus/tier-3-data-driven/remotion-src/src/scenes/TitleScene.tsx`
- `packages/cli/src/warmCheckClient.fixture.ts`
- `packages/cli/src/browser/chromeOrphans.fixture.ts`
- `packages/cli/src/browser/downloadStall.fixture.ts`
- `packages/cli/src/browser/launch.fixture.ts`
- `packages/cli/src/capture/publicNetwork.fixture.ts`
- `packages/cli/src/commands/motion-sample.browser.js`
- `packages/cli/src/media-use/resolve.mjs`
- `packages/cli/src/utils/checkDeadline.fixture.ts`
- `packages/cli/src/utils/childReaper.fixture.ts`
- `packages/cli/src/utils/commandResult.fixture.ts`
- `packages/cli/src/utils/renderCancellation.fixture.ts`
- `packages/cli/src/media-use/lib/local-media-search.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/audio.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/carve.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/heygen-tts.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/heygen-voice.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/wait-bgm.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/audio-meta.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/bgm-volume.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/bgm.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/concurrency.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/gemini-auth.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/gemini-tts.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/heygen.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/main-module.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/media-record.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/openverse.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/python.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/sfx.mjs`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/tts.mjs`
- `packages/studio/src/captions/index.ts`
- `packages/studio/tests/e2e/design-panel.mjs`
- `packages/studio/src/player/components/TimelineDropInsertionLine.tsx`
- `packages/inspector/src/liveRuntime.ts`
- `packages/inspector/tests/browser.ts`
- `packages/inspector/tests/film.ts`
- `packages/inspector/tests/lifecycle.ts`
- `packages/inspector/tests/mapSourceLifecycle.ts`
- `packages/inspector/tests/timelineValues.ts`
- `packages/inspector/tests/transport.ts`
- `packages/engine/src/utils/parityContract.ts`
- `packages/player/tests/playbench/instrument.js`
- `packages/player/tests/playbench/webkit-stops.ts`
- `packages/player/tests/perf/browsers/bench-page.d.ts`
- `packages/player/tests/perf/browsers/bench-page.js`
- `packages/player/tests/perf/browsers/run.ts`
- `packages/aws-lambda/image/smoke-video.mjs`
- `packages/aws-lambda/scripts/probe-webgpu-adapter.ts`
- `packages/producer/we-render.mjs`
- `packages/producer/scripts/validate-fast-video.ts`
- `packages/producer/stubs/hf-early-stub.ts`
- `packages/producer/src/plan-parity-lambda-local-driver.ts`
- `packages/producer/src/regression-harness-lambda-local.ts`
- `packages/producer/src/services/audioMixer.ts`
- `packages/producer/src/services/browserManager.ts`
- `packages/producer/src/services/chunkEncoder.ts`
- `packages/producer/src/services/compilationRunner.ts`
- `packages/producer/src/services/healthWorkerThread.ts`
- `packages/producer/src/services/parallelCoordinator.ts`
- `packages/producer/tests/long-form/gen.mjs`
- `packages/producer/src/services/__fixtures__/crashOnMessageWorker.mjs`
- `packages/producer/src/services/render/renderCancel.fixture.ts`
- `packages/producer/tests/chat/src/style.css`
- `packages/producer/tests/dogs-captions/src/script.js`
- `packages/producer/tests/dogs-captions/src/style.css`
- `packages/producer/tests/many-cuts/src/script.js`
- `packages/producer/tests/many-cuts/src/style.css`
- `packages/producer/tests/render-symlinked-assets/shared/brand.css`
- `packages/producer/tests/page-side-shader-compositor-render-compat/src/vendor/hyper-shader.global.js`
- `packages/producer/tests/subcomp-bare-fragment/src/compositions/scene.css`
- `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/producer/tests/render-symlinked-assets/src/shared/brand.css`
- `packages/core/scripts/generate-font-data.ts`
- `packages/core/stubs/audio-fx-runtime-entry.ts`
- `packages/core/stubs/position-edits-render-entry.ts`
- `packages/core/stubs/svg-selector-aliases-entry.ts`
- `packages/core/src/adapters/index.ts`
- `packages/parsers/src/__goldens__/complex.serialized.js`
- `packages/parsers/src/__goldens__/fromto.serialized.js`
- `packages/parsers/src/__goldens__/minimal.serialized.js`
- `packages/parsers/src/__goldens__/moderate.serialized.js`

## Dependency candidates

Some are known false positives: Lambda FFmpeg packages are staged through string-based resolution. A manifest entry without a static import may still be a required build/runtime dependency.

- `packages/cli/package.json:64` — `debug` (dependencies)
- `packages/cli/package.json:67` — `giget` (dependencies)
- `packages/cli/package.json:73` — `undici` (dependencies)
- `packages/cli/package.json:87` — `@hyperframes/studio` (devDependencies)
- `packages/gcp-cloud-run/package.json:76` — `puppeteer-core` (dependencies)
- `packages/gcp-cloud-run/package.json:81` — `@types/tar` (devDependencies)
- `packages/gcp-cloud-run/package.json:83` — `tsx` (devDependencies)
- `packages/inspector/package.json:69` — `@hyperframes/core` (dependencies)
- `packages/inspector/package.json:70` — `@hyperframes/parsers` (dependencies)
- `packages/aws-lambda/package.json:83` — `ffmpeg-static` (dependencies)
- `packages/aws-lambda/package.json:84` — `ffprobe-static` (dependencies)
- `packages/aws-lambda/package.json:89` — `@types/aws-lambda` (devDependencies)
- `packages/aws-lambda/package.json:91` — `@types/tar` (devDependencies)
- `packages/producer/package.json:86` — `postcss` (dependencies)
- `packages/producer/package.json:91` — `@hyperframes/aws-lambda` (devDependencies)
- `package.json:83` — `@hyperframes/player` (devDependencies)
- `packages/studio/package.json:120` — `@hyperframes/producer` (devDependencies)
- `packages/studio-server/package.json:197` — `tsx` (devDependencies)
- `packages/player/package.json:45` — `gsap` (devDependencies)
- `packages/core/package.json:1069` — `@fontsource/archivo-black` (devDependencies)
- `packages/core/package.json:1070` — `@fontsource/eb-garamond` (devDependencies)
- `packages/core/package.json:1071` — `@fontsource/ibm-plex-mono` (devDependencies)
- `packages/core/package.json:1072` — `@fontsource/inter` (devDependencies)
- `packages/core/package.json:1073` — `@fontsource/jetbrains-mono` (devDependencies)
- `packages/core/package.json:1074` — `@fontsource/lato` (devDependencies)
- `packages/core/package.json:1075` — `@fontsource/league-gothic` (devDependencies)
- `packages/core/package.json:1076` — `@fontsource/montserrat` (devDependencies)
- `packages/core/package.json:1077` — `@fontsource/noto-sans-jp` (devDependencies)
- `packages/core/package.json:1078` — `@fontsource/nunito` (devDependencies)
- `packages/core/package.json:1079` — `@fontsource/open-sans` (devDependencies)
- `packages/core/package.json:1080` — `@fontsource/oswald` (devDependencies)
- `packages/core/package.json:1081` — `@fontsource/outfit` (devDependencies)
- `packages/core/package.json:1082` — `@fontsource/playfair-display` (devDependencies)
- `packages/core/package.json:1083` — `@fontsource/poppins` (devDependencies)
- `packages/core/package.json:1084` — `@fontsource/roboto` (devDependencies)
- `packages/core/package.json:1085` — `@fontsource/source-code-pro` (devDependencies)
- `packages/core/package.json:1086` — `@fontsource/space-mono` (devDependencies)
- `packages/parsers/package.json:308` — `tsx` (devDependencies)
- `packages/lint/package.json:67` — `tsx` (devDependencies)

## Export/type and other candidates

Names below preserve analyzer findings, not conclusions. Published subpaths and external consumers must be checked before removal.

### `packages/parsers/vitest.config.ts` — unlisted

- `jsdom`

### `packages/lint/vitest.config.ts` — unlisted

- `jsdom`

### `skills/media-use/audio/scripts/carve.mjs` — unlisted

- `@hyperframes/core` (line 118)

### `packages/sdk-playground/src/main.error.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/sdk-playground/src/main.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/domStyleCommit.fonts.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/domStyleCommit.propertyNames.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/gsapRuntimeBridge.sharedTween.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/gsapRuntimeReaders.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/gsapShared.writeTarget.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/newTweenTarget.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/newTweenTargetHooks.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/patchDocumentRootDuration.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/timelineAudioGroupVolume.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/timelineEditingHelpers.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/timelineQuickSaves.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/timelineTrackVisibility.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useAudioGroupCarveAssignment.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useCaptionDetection.sender.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useClipboard.source.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useClipboard.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useCompositionDimensions.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useDomEditPositionPatchCommit.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useDomEditTextCommits.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useElementPicker.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useGestureCommit.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useGestureRecording.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/hooks/useGroupCommits.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/utils/clipboardLook.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/utils/rootDuration.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/utils/studioPendingEdits.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/utils/timelineAssetDrop.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/StudioAgentTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/handles.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/polyfill.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/registrar.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/useStudioAgentTools.polyfill.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/useStudioAgentTools.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/writeCoordinator.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/captions/components/CaptionOverlay.sender.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/MotionPathOverlay.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/anchoredResizeReleaseShift.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/canvasContextMenuZOrder.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/compositionReliabilityFixture.integration.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/domEditLayerWalkCache.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/domEditOverlayGeometry.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/domEditingLayers.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/elementPositionOffset.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/fontAssets.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/manualEditsDomGsap.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/motionPathCommit.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/motionPathSelection.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/persistSeam.integration.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/reapplyBoxSizeAfterSeek.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/reapplyPositionEditsAfterSeek.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/topologyLensGeometry.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/components/editor/useLayerRevealOverride.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/lib/layerOrdering.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/lib/runtimeAudioId.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/lib/timelineDOM.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/lib/timelineGroupInfo.realm.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/lib/timelineIframeHelpers.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/store/previewIframeStore.notify.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/store/previewIframeStore.test.tsx` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/player/components/clipPeakMap.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/animationTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/contentTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/frameTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/inspectTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/lookTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/selectionTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/targetedWriteTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/studio/src/webmcp/tools/transformTools.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/shader-transitions/src/capture.clone.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/shader-transitions/src/hyper-shader.preview.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/shader-transitions/src/index.test.ts` — unlisted

- `jsdom` (line 1)

### `packages/parsers/src/htmlParser.linkedom.test.ts` — unlisted

- `jsdom` (line 8)

### `packages/parsers/src/htmlParser.roundtrip.test.ts` — unlisted

- `jsdom` (line 2)

### `packages/parsers/src/htmlParser.test.ts` — unlisted

- `jsdom` (line 2)

### `packages/parsers/src/stableIds.test.ts` — unlisted

- `jsdom` (line 2)

### `.github/workflows/studio-drag-frames.yml` — binaries

- `tests/e2e/edit-accuracy/run.mjs`

### `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/bgm.test.mjs` — unresolved

- Unresolved relative import string "../../../scripts/lib/manifest.mjs" at line 6 (reported by Knip, not a resolvable repository citation).

### `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/media-record.test.mjs` — unresolved

- Unresolved relative import string "../../../scripts/lib/manifest.mjs" at line 6 (reported by Knip, not a resolvable repository citation).

### `/mnt/data/Projects_SSD/hyperframes-film-studio/packages/cli/src/audio/scripts/lib/sfx.test.mjs` — unresolved

- Unresolved relative import string "../../../scripts/lib/manifest.mjs" at line 6 (reported by Knip, not a resolvable repository citation).

### `scripts/cli-options.ts` — exports

- `parseVersionPositionalArg` (line 124)
- `readNextArg` (line 139)

### `scripts/docs-catalog-shared.mjs` — exports

- `slug` (line 40)

### `packages/producer/src/services/htmlCompiler.ts` — exports

- `localizeRemoteBackgroundImages` (line 1588)

### `packages/producer/src/services/htmlCompiler.ts` — types

- `RenderModeHintCode` (line 297)
- `RenderModeHint` (line 303)

### `scripts/catalog-script-inlining.ts` — exports

- `sharedModulesBundle` (line 106)

### `scripts/generate-skill-module-copies.mjs` — exports

- `skillModuleCopies` (line 6)

### `scripts/catalog/catalog-artifact.ts` — exports

- `RETRIEVAL_FIELDS` (line 18)
- `itemRetrievalText` (line 69)
- `manifestBytes` (line 271)

### `skills/media-use/scripts/lib/telemetry.mjs` — exports

- `heygenUserId` (line 126)
- `__anonymousIdForTest` (line 241)
- `__resetTelemetryForTest` (line 245)

### `skills/media-use/scripts/lib/manifest.mjs` — exports

- `mediaDir` (line 33)
- `manifestPath` (line 37)
- `typeSubdir` (line 45)
- `typeDirPath` (line 51)
- `normalizePrompt` (line 126)
- `findByEntity` (line 144)
- `nextId` (line 150)
- `withMediaLock` (line 206)
- `allocateId` (line 217)
- `withReservedFileSync` (line 260)
- `withReservedFile` (line 272)

### `skills/media-use/audio/scripts/lib/python.mjs` — exports

- `pythonCommand` (line 60)
- `_resetPythonCommandCacheForTests` (line 75)

### `skills/media-use/audio/scripts/lib/gemini-tts.mjs` — exports

- `GEMINI_TTS_MODELS` (line 7)

### `skills/media-use/audio/scripts/lib/heygen.mjs` — exports

- `HEYGEN_BASE` (line 16)
- `HEYGEN_CLI_SOURCE_HEADERS` (line 50)

### `packages/cli/src/background-removal/manager.ts` — exports

- `MODELS_DIR` (line 6)

### `packages/cli/src/media-use/lib/manifest.mjs` — exports

- `AGENT_SOURCES` (line 84)
- `latestRecordFor` (line 87)
- `withMediaLock` (line 206)

### `packages/cli/src/media-use/lib/providers.mjs` — exports

- `listTypes` (line 5)

### `packages/cli/src/templates/remote.ts` — exports

- `listRemoteTemplates` (line 30)

### `packages/cli/src/templates/remote.ts` — types

- `RemoteTemplateInfo` (line 18)

### `packages/cli/src/tts/manager.ts` — exports

- `MODELS_DIR` (line 148)
- `DEFAULT_MODEL` (line 148)

### `packages/cli/src/media-use/lib/adopt.mjs` — exports

- `scanExistingAssets` (line 47)

### `packages/cli/src/media-use/lib/media-search.mjs` — exports

- `rankMediaRowsWithVectors` (line 99)

### `packages/cli/src/media-use/lib/error-diffusion.mjs` — exports

- `errorDiffusionBufferLength` (line 114)

### `packages/cli/src/media-use/lib/lut-preset-provider.mjs` — exports

- `isLibraryLutOfflineMiss` (line 169)

### `packages/cli/src/media-use/lib/openverse.mjs` — exports

- `OPENVERSE_SFX_LICENSES` (line 10)

### `packages/cli/src/media-use/lib/recipe-store.mjs` — exports

- `projectRecipesDir` (line 59)
- `userRecipesDir` (line 63)

### `packages/cli/src/media-use/lib/telemetry.mjs` — exports

- `heygenUserId` (line 126)

### `packages/studio/src/utils/studioHelpers.ts` — exports

- `COMPOSITION_ROOT_OPEN_TAG_RE` (line 336)

### `packages/studio/src/player/components/timelineEditing.ts` — exports

- `selectTimelineElementsInMarquee` (line 332)

### `packages/studio/src/player/components/timelineEditing.ts` — types

- `TimelineGroupResizeEdge` (line 25)
- `TimelineGroupTimingMember` (line 26)
- `TimelineStackingElement` (line 30)
- `TimelineMarqueeSelectionRect` (line 260)
- `TimelineMarqueeSelectionInput` (line 267)

### `packages/studio/src/components/editor/domEditingLayers.ts` — exports

- `refreshDomEditSelection` (line 394)

### `packages/studio/src/components/ui/HyperframesLoader.tsx` — exports

- `StatusFrame` (line 60)

### `packages/studio/vite.studioMotion.ts` — exports

- `readStudioDevManualEditManifestContent` (line 24)
- `readStudioDevMotionManifestContent` (line 28)

### `packages/studio/src/components/ui/index.ts` — exports

- `TabPanel` (line 7)
- `StatusFrame` (line 8)
- `ContextMenu` (line 12)
- `MenuRadioGroup` (line 16)
- `MenuRadioItem` (line 17)
- `MenuShortcut` (line 19)
- `popupSurface` (line 20)
- `Input` (line 24)
- `fieldBase` (line 24)
- `fieldText` (line 24)
- `NumberField` (line 26)
- `Select` (line 28)
- `Slider` (line 30)
- `Toggle` (line 32)

### `packages/studio/src/components/ui/index.ts` — types

- `ButtonSize` (line 5)
- `ButtonVariant` (line 5)
- `PreviewState` (line 5)
- `HyperframesLoaderProps` (line 9)
- `MenuItemTone` (line 22)
- `PopupPreviewState` (line 22)
- `InputProps` (line 25)
- `NumberFieldProps` (line 27)
- `SelectOption` (line 29)
- `SelectProps` (line 29)
- `SliderProps` (line 31)
- `ToggleProps` (line 33)

### `packages/studio/src/components/editor/domEditing.ts` — exports

- `refreshDomEditSelection` (line 42)
- `buildAgentContextPreview` (line 51)
- `buildPickerAgentPrompt` (line 52)
- `buildPickerAgentContextPreview` (line 53)

### `packages/studio/src/components/editor/domEditing.ts` — types

- `DomEditCapabilities` (line 8)
- `DomEditContextOptions` (line 9)
- `TimelineElementDomTarget` (line 14)
- `TimelineElementDomTargetOptions` (line 15)
- `AgentPromptElementInfo` (line 55)

### `packages/studio/src/components/editor/studioMotion.ts` — exports

- `STUDIO_GSAP_EASE_OPTIONS` (line 6)
- `readStudioMotionFromElement` (line 33)
- `writeStudioMotionToElement` (line 34)
- `clearStudioMotionFromElement` (line 35)
- `installStudioMotionSeekReapply` (line 307)

### `packages/studio/src/components/editor/studioMotion.ts` — types

- `StudioMotionTarget` (line 7)
- `StudioGsapMotionValues` (line 8)
- `StudioGsapCustomEase` (line 9)
- `StudioCustomEaseControlPoints` (line 10)
- `StudioGsapMotion` (line 11)
- `StudioGsapMotionPreset` (line 12)
- `StudioGsapMotionDirection` (line 13)
- `StudioGsapPresetMotionOptions` (line 14)
- `StudioGsapTimeline` (line 16)
- `StudioMotionWindow` (line 17)

### `packages/studio/src/player/lib/timelineDOM.ts` — exports

- `resolveMediaElement` (line 41)
- `applyMediaMetadataFromElement` (line 43)
- `getTimelineElementSourceFile` (line 46)
- `getTimelineElementSelectorIndex` (line 48)
- `buildTimelineElementIdentity` (line 50)
- `getTimelineElementIdentity` (line 52)
- `normalizePreviewViewport` (line 58)
- `autoHealMissingCompositionIds` (line 59)
- `setPreviewMediaMuted` (line 60)
- `setPreviewPlaybackRate` (line 61)

### `packages/studio/src/utils/timelineElementSplit.ts` — exports

- `readFileContent` (line 4)

### `packages/studio/src/contexts/StudioContext.tsx` — exports

- `useStudioContext` (line 96)
- `StudioProvider` (line 202)

### `packages/studio/src/components/editor/studioMotionTypes.ts` — exports

- `STUDIO_GSAP_EASE_OPTIONS` (line 54)

### `packages/studio/src/components/editor/studioMotionTypes.ts` — types

- `StudioGsapMotionDirection` (line 52)
- `StudioGsapTimeline` (line 138)

### `packages/studio/src/components/editor/overlayFrameLoop.ts` — exports

- `MAX_IDLE_POLL_MS` (line 34)

### `packages/studio/src/player/components/automationLaneGeometry.ts` — exports

- `DRAW_SAMPLES` (line 56)

### `packages/inspector/src/elementMap.js` — exports

- `createElementMap` (line 220)

### `packages/inspector/src/live.ts` — exports

- `prepareLiveInspection` (line 40)
- `previewGeneration` (line 126)

### `packages/inspector/src/live.ts` — types

- `LiveInspection` (line 30)
- `ComponentReport` (line 134)
- `ElementMapReport` (line 135)
- `InspectRequest` (line 136)
- `PageRunner` (line 137)
- `TimelineReport` (line 138)
- `TimelineRequest` (line 139)

### `packages/engine/src/services/threeDProjection.ts` — exports

- `initThreeDProjectionInPage` (line 54)

### `packages/player/tests/perf/runner.ts` — exports

- `repoPlayerDir` (line 154)

### `packages/player/tests/perf/perf-gate.ts` — exports

- `loadBaseline` (line 62)
- `evaluateMetric` (line 68)

### `packages/player/tests/perf/perf-gate.ts` — types

- `Direction` (line 18)
- `PerfBaseline` (line 31)

### `packages/player/tests/playbench/analyze.ts` — exports

- `pct` (line 72)

### `packages/sdk/examples/headless-agent.ts` — exports

- `localize` (line 18)
- `applyBrandColors` (line 38)
- `createABVariants` (line 68)
- `swapAssets` (line 88)
- `normalizeToPortrait` (line 138)
- `applyVariableKit` (line 147)
- `inspectComposition` (line 165)
- `normalizeTiming` (line 189)

### `packages/sdk/examples/react-embed.ts` — exports

- `createEditorSession` (line 19)
- `subscribeToSelection` (line 43)
- `applyStyle` (line 52)
- `applyFontSize` (line 57)
- `applyTextContent` (line 61)
- `applyColorToSelection` (line 67)
- `applyBrandKit` (line 74)
- `onClipDrag` (line 84)
- `undo` (line 111)
- `redo` (line 115)
- `setupHostUndo` (line 126)
- `exportHtml` (line 144)
- `findTextElements` (line 150)

### `packages/sdk/examples/react-embed.ts` — types

- `HostHistoryEntry` (line 122)

### `packages/sdk/examples/vanilla-editor.ts` — exports

- `initEditor` (line 18)
- `setColor` (line 37)
- `setFontFamily` (line 41)
- `swapImage` (line 45)
- `setAltText` (line 50)
- `removeElement` (line 54)
- `editHeadline` (line 62)
- `onFontSizeSlider` (line 71)
- `applyTextPreset` (line 81)
- `applyOpFromJson` (line 98)
- `insertKeyframe` (line 137)
- `addLabel` (line 147)
- `resizeComposition` (line 153)
- `exportComposition` (line 164)
- `listAllElementIds` (line 170)
- `findByText` (line 174)
- `cleanup` (line 180)

### `packages/aws-lambda/scripts/stage-arm64-image.ts` — exports

- `assertArm64Elf` (line 48)

### `packages/producer/src/utils/ffprobe.ts` — exports

- `extractVideoMetadata` (line 7)

### `packages/producer/src/utils/ffprobe.ts` — types

- `VideoMetadata` (line 9)
- `AudioMetadata` (line 10)

### `packages/producer/src/services/render/captureCost.ts` — exports

- `CAPTURE_CALIBRATION_TARGET_MS` (line 50)
- `MAX_MEASURED_CAPTURE_COST_MULTIPLIER` (line 56)
- `CAPTURE_CALIBRATION_PROTOCOL_TIMEOUT_MS` (line 64)
- `logCaptureCalibrationResult` (line 303)
- `createFailedCaptureCalibrationEstimate` (line 325)

### `packages/producer/src/services/render/captureCost.ts` — types

- `CaptureCalibrationFailureReason` (line 321)

### `skills/media-use/scripts/lib/index-gen.mjs` — exports

- `generateIndexContent` (line 20)

### `skills/media-use/audio/scripts/lib/openverse.mjs` — exports

- `OPENVERSE_SFX_LICENSES` (line 10)
- `pickOpenverseSfx` (line 63)

### `skills/media-use/scripts/lib/media-home.mjs` — exports

- `mediaHome` (line 7)

### `skills/media-use/scripts/lib/media-fetch.mjs` — exports

- `isPublicMediaUrl` (line 38)
- `readCappedBody` (line 74)

### `packages/cli/src/media-use/lib/ff-binaries.mjs` — exports

- `FfBinarySettingError` (line 8)
- `ffmpegBinary` (line 36)

### `packages/studio/src/components/editor/GestureRecordControl.tsx` — exports

- `GestureRecordBadge` (line 65)

### `packages/studio/src/icons/SystemIcons.tsx` — exports

- `Link` (line 78)

### `packages/studio/src/player/components/TimelineLayerGroupHeader.tsx` — exports

- `TIMELINE_LAYER_GROUP_HEADER_H` (line 5)
- `getTimelineLayerGroupHeaderTotalHeight` (line 14)
- `TimelineLayerGroupHeader` (line 38)

### `packages/core/src/compiler/svgSelectorAliases.ts` — exports

- `ensureSvgSelectorAliases` (line 254)

### `skills/media-use/scripts/lib/words.mjs` — exports

- `wordListsFromMediaMeta` (line 14)

### `packages/cli/src/utils/skillsManifest.ts` — types

- `SkillStatus` (line 61)

### `scripts/contrast.ts` — types

- `ContrastPair` (line 3)

### `packages/cli/src/utils/commandResult.ts` — types

- `CommandResultKind` (line 1)

### `packages/cli/src/whisper/manager.ts` — types

- `WhisperSource` (line 14)

### `packages/cli/src/auth/client.ts` — types

- `BillingType` (line 40)
- `WalletInfo` (line 42)
- `CreditBalance` (line 54)
- `SubscriptionInfo` (line 59)
- `UsageBasedInfo` (line 67)

### `packages/cli/src/auth/loopback.ts` — types

- `LoopbackResult` (line 31)

### `packages/cli/src/auth/oauth.ts` — types

- `DeviceAuthorizationChallenge` (line 100)

### `packages/cli/src/auth/store.ts` — types

- `StoreSource` (line 81)

### `packages/cli/src/browser/preflight.ts` — types

- `EnvironmentCheckLevel` (line 22)

### `packages/cli/src/capture/types.ts` — types

- `FontToken` (line 131)
- `TypographyRole` (line 224)
- `ComponentStyle` (line 235)
- `StatCellStyle` (line 252)

### `packages/cli/src/capture/animationCataloger.ts` — types

- `WebAnimationEntry` (line 41)
- `CssAnimationEntry` (line 57)
- `ScrollTarget` (line 63)

### `packages/cli/src/capture/assetDownloader.ts` — types

- `AssetDropReason` (line 43)
- `IconRecord` (line 115)

### `packages/cli/src/capture/captureWatchdog.ts` — types

- `CaptureWatchdogBrowser` (line 1)

### `packages/cli/src/capture/fontMetadataExtractor.ts` — types

- `FontFileMetadata` (line 30)
- `FontFamilySummary` (line 79)

### `packages/cli/src/capture/navigateForCapture.ts` — types

- `CaptureGotoWaitUntil` (line 38)
- `CaptureGotoOptions` (line 40)

### `packages/cli/src/capture/screenshotCapture.ts` — types

- `ScreenshotFailure` (line 45)

### `packages/cli/src/cloud/detectAspectRatio.ts` — types

- `SupportedAspectRatio` (line 27)

### `packages/cli/src/cloud/offload.ts` — types

- `PresetName` (line 134)

### `packages/cli/src/cloud/_gen/types.ts` — types

- `AssetBase64` (line 15)
- `AssetId` (line 33)
- `AssetUrl` (line 47)
- `HyperframesAspectRatio` (line 246)
- `HyperframesResolution` (line 344)
- `StandardAPIError` (line 346)
- `StandardAPIErrorDetail` (line 375)

### `packages/cli/src/cloud/upload.ts` — types

- `UploadProgressEvent` (line 41)

### `packages/cli/src/heygen/v3.ts` — types

- `JobLog` (line 190)

### `packages/cli/src/utils/checkFindingFrames.ts` — types

- `FramedFinding` (line 17)

### `packages/cli/src/utils/layoutAudit.ts` — types

- `LayoutIssueSeverity` (line 49)

### `packages/cli/src/utils/checkTypes.ts` — types

- `CheckTimings` (line 315)

### `packages/cli/src/commands/motionShotLayout.ts` — types

- `OnionSample` (line 14)
- `ShotLayout` (line 34)

### `packages/cli/src/commands/previewLifecycleOutput.ts` — types

- `PreviewLifecycleState` (line 3)

### `packages/cli/src/commands/snapshotReview.ts` — types

- `ReviewSeam` (line 34)

### `packages/cli/src/measure/curve.ts` — types

- `Prop` (line 8)
- `FittedMove` (line 48)
- `PulseMove` (line 66)

### `packages/cli/src/measure/diff.ts` — types

- `Thresholds` (line 100)
- `Scores` (line 128)
- `Moment` (line 137)
- `SegmentVerdict` (line 145)
- `CutReport` (line 170)
- `MissingContent` (line 179)
- `WholeFrameReuse` (line 189)
- `PersonSummary` (line 229)

### `packages/cli/src/measure/segments.ts` — types

- `PixelSource` (line 8)

### `packages/cli/src/measure/person.ts` — types

- `CarriedText` (line 69)

### `packages/cli/src/measure/opencv.ts` — types

- `Mat` (line 43)
- `Rect` (line 55)
- `RectVector` (line 61)

### `packages/cli/src/registry/installer.ts` — types

- `FileOutcome` (line 178)

### `packages/cli/src/server/fileWatcher.ts` — types

- `FileChangeListener` (line 10)

### `packages/cli/src/timeline/describeProject.ts` — types

- `DurationSource` (line 44)
- `RowPointer` (line 81)

### `packages/producer/src/services/distributed/shared.ts` — types

- `PlanDeferredFrameRange` (line 105)

### `packages/cli/src/utils/projectConfig.ts` — types

- `ProjectConfigPaths` (line 19)
- `ProjectConfigMedia` (line 28)

### `packages/cli/src/utils/contrastMotion.ts` — types

- `ContrastTweenState` (line 1)

### `packages/cli/src/utils/renderArgs.ts` — types

- `BrowserTimeoutParseError` (line 41)

### `packages/cli/src/audio/read/effects.ts` — types

- `EffectSource` (line 283)

### `packages/cli/src/audio/read/types.ts` — types

- `Separation` (line 5)

### `packages/cli/src/commands/lambda/policies.ts` — types

- `PoliciesVerb` (line 28)

### `packages/cli/src/commands/render/plan.ts` — types

- `RenderQuality` (line 57)
- `HdrMode` (line 59)
- `RenderProject` (line 60)

### `packages/cli/src/audio/analysis/providers/api.ts` — types

- `AudioApiCapability` (line 36)

### `packages/studio/src/player/index.ts` — types

- `ZoomMode` (line 21)

### `packages/studio/src/player/components/TimelineProvider.tsx` — types

- `TimelineCanvasState` (line 38)
- `TrackGapContextMenuState` (line 82)
- `TimelineState` (line 154)
- `TimelineActions` (line 164)

### `packages/studio/src/webmcp/types.ts` — types

- `ModelContextToolAnnotations` (line 25)
- `ToolExecuteCallbackOptions` (line 32)

### `packages/studio/src/captions/types.ts` — types

- `CaptionGradient` (line 8)

### `packages/studio/src/hooks/gestureTransaction.ts` — types

- `TxCommit` (line 11)

### `packages/studio/src/components/editor/keyframeRetime.ts` — types

- `KeyframePctRemap` (line 27)

### `packages/studio/src/hooks/gsapRuntimeKeyframes.ts` — types

- `GsapVars` (line 26)

### `packages/studio/src/hooks/gsapRuntimePatch.ts` — types

- `KeyframeStep` (line 43)

### `packages/studio/src/hooks/useEditorSave.ts` — types

- `EditorSaveCandidate` (line 28)
- `EditorSaveDrainResult` (line 34)

### `packages/studio/src/components/editor/rotationDraft.ts` — types

- `PressChoseGsap` (line 54)

### `packages/studio/src/utils/gsapUndoRestore.ts` — types

- `UndoRestoreFile` (line 25)

### `packages/studio/src/player/lib/playbackTypes.ts` — types

- `ClipManifest` (line 47)

### `packages/studio/src/utils/sdkEditTransaction.ts` — types

- `SdkSessionPublication` (line 18)
- `SdkSessionPublicationResult` (line 24)

### `packages/studio/src/webmcp/registrar.ts` — types

- `ToolRegistrationFailure` (line 13)

### `packages/studio/src/components/feedback/feedbackTrigger.ts` — types

- `FollowUpPreset` (line 31)

### `packages/studio/src/components/editor/propertyPanelHelpers.ts` — types

- `FontSource` (line 99)

### `packages/studio/src/components/editor/domEditLayerWalkCache.ts` — types

- `DomEditLayerIdentity` (line 53)

### `packages/studio/src/components/editor/useVolumeAutomation.ts` — types

- `LaneBinding` (line 32)

### `packages/studio/src/components/editor/motionPathGeometry.ts` — types

- `MotionPathNode` (line 22)

### `packages/studio/src/components/editor/topologyLensGeometry.ts` — types

- `TopologyLensNode` (line 6)

### `packages/studio/src/player/hooks/previewMessageRouter.ts` — types

- `ClipManifestMessage` (line 28)

### `packages/studio/src/player/hooks/useTimelineSyncCallbacks.ts` — types

- `PreviewIframeRole` (line 96)

### `packages/studio/src/player/lib/timelinePerformanceDiagnostics.ts` — types

- `TimelinePosterState` (line 3)

### `packages/studio/src/player/components/automationLaneData.ts` — types

- `AutomationLaneGroupEntry` (line 217)

### `packages/studio/src/player/components/timelineKeyboardNavigation.ts` — types

- `TimelineLogicalItem` (line 45)

### `packages/studio/src/webmcp/tools/animationTools.ts` — types

- `GsapMethod` (line 21)

### `packages/studio-server/src/types.ts` — types

- `ProjectLintResult` (line 59)

### `packages/studio-server/src/helpers/backgroundRemovalJob.ts` — types

- `BackgroundRemovalProgressEvent` (line 7)

### `packages/studio-server/src/history/videoState.ts` — types

- `FileVersion` (line 23)
- `RevisionState` (line 28)

### `packages/studio-server/src/helpers/mediaMetadata.ts` — types

- `FfprobeRunResult` (line 13)
- `MediaDynamicRange` (line 57)
- `MediaHdrTransfer` (line 58)

### `packages/studio-server/src/helpers/previewAdapter.ts` — types

- `DraftPayload` (line 10)
- `CommitPatch` (line 14)

### `packages/core/src/runtime/timelineInspection.ts` — types

- `Interval` (line 32)

### `packages/engine/src/services/streamingEncoder.ts` — types

- `EncoderOptions` (line 60)

### `packages/engine/src/services/parallelCoordinator.ts` — types

- `ParallelWorkerPhase` (line 104)

### `packages/engine/src/utils/urlDownloader.ts` — types

- `UrlDownloadTelemetryOutcome` (line 57)

### `packages/player/tests/playbench/compositions.ts` — types

- `TakeSpec` (line 4)

### `packages/aws-lambda/src/s3Stitch.ts` — types

- `SendRangeParts` (line 32)

### `packages/aws-lambda/src/events.ts` — types

- `WarmEvent` (line 28)
- `WarmLambdaResult` (line 247)

### `packages/producer/src/plan-parity-contract.ts` — types

- `PlanParityDriverInput` (line 22)
- `PlanParityChunkArtifact` (line 35)
- `PlanParityChunkMeasurement` (line 100)
- `PlanParityCheck` (line 134)

### `packages/producer/src/services/renderOrchestrator.ts` — types

- `RenderStageCode` (line 749)
- `StreamingEncodeGateReason` (line 1541)

### `packages/producer/src/services/compilationTester.ts` — types

- `CompiledElement` (line 10)

### `packages/producer/src/regression-harness-lambda-local-types.ts` — types

- `RunLambdaLocalInput` (line 16)
- `LambdaLocalRenderResult` (line 43)

### `packages/producer/src/services/render/observability.ts` — types

- `RenderObservationValue` (line 8)

### `packages/producer/src/services/frameCapture.ts` — types

- `CaptureBufferResult` (line 17)

### `packages/producer/src/services/animatedGifPrep.ts` — types

- `PreparedAnimatedGif` (line 14)

### `packages/producer/src/services/heifImagePrep.ts` — types

- `PreparedHeifImage` (line 88)

### `packages/producer/src/config.ts` — types

- `EngineConfig` (line 6)

### `packages/producer/src/services/assetMediaType.ts` — types

- `DetectedAssetMediaType` (line 18)

### `packages/producer/src/services/render/stages/extractVideosStage.ts` — types

- `VideoExtractionFailureMode` (line 192)

### `packages/producer/src/services/render/stages/captureStreamingStage.ts` — types

- `DeDrainStats` (line 305)

### `packages/producer/src/services/render/segmentManifest.ts` — types

- `SegmentManifestEntry` (line 14)

### `packages/producer/src/services/render/stages/captureSegmentedStage.ts` — types

- `SegmentedStageDeps` (line 53)
- `SessionFactory` (line 63)

### `packages/producer/src/services/shaderTransitionWorkerPool.ts` — types

- `ShaderBlendRequest` (line 69)
- `ShaderBlendResult` (line 79)

### `packages/core/src/vfx/refs/displacementMap.ts` — types

- `MapTexel` (line 19)

### `packages/producer/src/services/render/audioPadTrim.ts` — types

- `PadTrimOperation` (line 109)
- `PadTrimAudioStep` (line 128)

### `packages/producer/src/services/distributed/planSize.ts` — types

- `PlanSizeComponent` (line 29)

### `packages/producer/src/services/render/capturePlan.ts` — types

- `CapturePlanTarget` (line 14)

### `packages/core/src/runtime/types.ts` — types

- `RuntimeStateMessage` (line 58)
- `RuntimeDiagnosticMessage` (line 122)
- `RuntimePickerHoveredMessage` (line 131)
- `RuntimePickerCandidatesMessage` (line 137)
- `RuntimePickerPickedMessage` (line 145)
- `RuntimePickerPickedManyMessage` (line 151)
- `RuntimePickerCancelledMessage` (line 157)
- `RuntimeStageSizeMessage` (line 162)
- `RuntimeMediaAutoplayBlockedMessage` (line 176)
- `RuntimeReadyMessage` (line 190)
- `RuntimeAssetsReadyMessage` (line 198)
- `RuntimeDataErrorMessage` (line 204)
- `RuntimeDataAppliedMessage` (line 212)
- `RuntimeAnalyticsMessage` (line 226)
- `RuntimePerformanceMessage` (line 240)
- `RuntimeGroupLevelsMessage` (line 251)
- `RuntimePreviewCopiesMessage` (line 257)
- `RuntimePreviewFactsMessage` (line 289)
- `RuntimeGsapSetTarget` (line 451)
- `RuntimeGsapSetVars` (line 453)

### `packages/core/src/vfx.ts` — types

- `HfVfxNumberParam` (line 37)
- `HfVfxEnumParam` (line 51)
- `HfVfxBoolParam` (line 60)

### `packages/core/src/compiler/compositionAssembly.ts` — types

- `NestedHostSkipReason` (line 270)
- `NestedCompositionHost` (line 272)

### `packages/core/src/figma/client.ts` — types

- `BatchRenderedNode` (line 85)

### `packages/core/src/runtime/vfx.ts` — types

- `VfxEntry` (line 175)

### `packages/cli/src/templates/generators.ts` — types

- `TemplateSource` (line 9)

### `packages/cli/src/telemetry/transport.ts` — types

- `EventPropertyValue` (line 35)

### `packages/studio/src/player/store/keyframeSlice.ts` — types

- `RevealedAudioFxTargetRequest` (line 53)

### `packages/producer/src/services/render/extractionFailureMetadata.ts` — types

- `ExtractionFailureKindCount` (line 7)

### `packages/cli/src/timeline/a2Mutations.ts` — types

- `SetField` (line 1)

### `packages/studio/src/player/components/timelineLayout.ts` — duplicates

- `[{'name': 'TRACK_H', 'line': 8, 'col': 14, 'pos': 328}, {'name': 'TRACKS_BOTTOM_PAD', 'line': 67, 'col': 14, 'pos': 2545}]`

### `packages/studio-server/src/helpers/fileVersion.ts` — duplicates

- `[{'name': 'identifyFileWrite', 'line': 106, 'col': 17, 'pos': 3854}, {'name': 'consumeFileWriteReceipt', 'line': 140, 'col': 14, 'pos': 5345}]`

### `packages/engine/src/utils/ffprobe.ts` — duplicates

- `[{'name': 'extractMediaMetadata', 'line': 913, 'col': 23, 'pos': 33774}, {'name': 'extractVideoMetadata', 'line': 1220, 'col': 14, 'pos': 47556}]`

### `packages/producer/src/services/distributed/planProtocol.ts` — duplicates

- `[{'name': 'PLAN_PROTOCOL_V1', 'line': 40, 'col': 14, 'pos': 1720}, {'name': 'CURRENT_PLAN_PROTOCOL', 'line': 52, 'col': 14, 'pos': 2117}]`

### `packages/producer/src/services/render/planValidation.ts` — duplicates

- `[{'name': 'DISTRIBUTED_DURATION_OUT_OF_RANGE', 'line': 71, 'col': 14, 'pos': 2619}, {'name': 'RENDER_DURATION_OUT_OF_RANGE', 'line': 73, 'col': 14, 'pos': 2788}]`
- `[{'name': 'MAX_DISTRIBUTED_DURATION_SECONDS', 'line': 76, 'col': 14, 'pos': 2940}, {'name': 'MAX_RENDER_DURATION_SECONDS', 'line': 78, 'col': 14, 'pos': 3070}]`
