# App Builder Module

Builds and runs the Next.js documentation app from runtime config + generated preview output.

## End-to-End Flow

1. **Initialize app shell** (`build.ts`)
   - Prepare `.handoff/<project>/app`, copy app sources, sync `public`, persist client config.

2. **Build component artifacts**
   - Production: `buildComponents` + `buildPatterns`, with `failOnError`. After building every component, `processComponents` throws `ComponentBuildError` for the components that failed and the declarations that did not load (`runtimeConfig.invalidDeclarations`). The build stops before `next build`.
   - Publish: a bulk build catches the error, skips the failed items and the patterns that compose them, publishes the rest, and exits non-zero.
   - Watch mode: `processComponents(handoff)` without `failOnError`. A failure is logged and the watchers keep running.
   - Every full component build uses the build cache to skip unchanged components (see `src/cache`).

3. **Build global bundles**
   - Build main JS/CSS entry bundles when configured.

4. **Run/watch**
   - Production: run `next build` and publish static output.
   - Watch: run `next dev` + WebSocket + chokidar watchers.

5. **Incremental rebuild behavior** (`watchers.ts`)
   - Source entry change (or a file in a `templates` entry directory) -> targeted component segment rebuild.
   - Change to any other file a component build read (`.handoff/.cache/component-sources.json`) -> full rebuild of every component that read it. The watcher also watches that record, so a file that a build reads for the first time is watched from then on. Files in a global entry directory belong to the global entries watcher.
   - Main config/global entry change -> full component rebuild. The global entries watcher ignores `node_modules` and `public/api`, so a global entry in the workspace root does not rebuild on its own output.
   - Pattern config change -> diff-aware selective preview rebuild only for affected components.
   - After component rebuilds -> run config-diff finalizers (e.g. pattern composition).

6. **Event coalescing**
   - Watchers share a single scheduler lock; rapid updates from the same source coalesce.
   - Component file changes share one scheduler key. Changes that arrive during a build are rebuilt together after it, and each affected component builds once.

## Key Files

| Path | Purpose |
|------|---------|
| `build.ts` | `buildApp()`, `watchApp()`, `devApp()` orchestration |
| `watchers.ts` | Watcher orchestration and rebuild routing |
| `watchers/component.ts` | Runtime component path mapping, segment resolution, and the readers of each recorded source file |
| `watchers/utils.ts` | Coalescing scheduler + watcher state |
| `config-diff/index.ts` | Diff strategy exports + registry/finalizers |
| `config-diff/strategies/pattern.ts` | Pattern snapshot/diff/apply strategy |
| `client-config.ts` | Persist client runtime config + token API payload |
| `paths.ts` | App/public path helpers + public sync |
| `websocket.ts` | Dev reload WebSocket server |
