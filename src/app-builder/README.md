# App Builder Module

Builds and runs the Next.js documentation app from runtime config + generated preview output.

## End-to-End Flow

1. **Initialize app shell** (`build.ts`)
   - Prepare `.handoff/<project>/app`, copy app sources, sync `public`, persist client config.

2. **Build component artifacts**
   - Production: `buildComponents` + `buildPatterns`.
   - Watch mode: `processComponents(..., { useCache: true })` to skip unchanged components.

3. **Build global bundles**
   - Build main JS/CSS entry bundles when configured.

4. **Run/watch**
   - Production: run `next build` and publish static output.
   - Watch: run `next dev` + WebSocket + chokidar watchers.

5. **Incremental rebuild behavior** (`watchers.ts`)
   - Source entry change -> targeted component segment rebuild.
   - Main config/global entry change -> full component rebuild.
   - Pattern config change -> diff-aware selective preview rebuild only for affected components.
   - After component rebuilds -> run config-diff finalizers (e.g. pattern composition).

6. **Event coalescing**
   - Watchers share a single scheduler lock; rapid updates from the same source coalesce.

## Key Files

| Path | Purpose |
|------|---------|
| `build.ts` | `buildApp()`, `watchApp()`, `devApp()` orchestration |
| `watchers.ts` | Watcher orchestration and rebuild routing |
| `watchers/component.ts` | Runtime component path mapping + segment resolution helpers |
| `watchers/utils.ts` | Coalescing scheduler + watcher state |
| `config-diff/index.ts` | Diff strategy exports + registry/finalizers |
| `config-diff/strategies/pattern.ts` | Pattern snapshot/diff/apply strategy |
| `client-config.ts` | Persist client runtime config + token API payload |
| `paths.ts` | App/public path helpers + public sync |
| `websocket.ts` | Dev reload WebSocket server |
