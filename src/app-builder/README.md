# App Builder Module

Handles building, watching, and serving the Next.js documentation application.

## Files

| File | Purpose |
|------|---------|
| `build.ts` | `buildApp()` — production build; `watchApp()` — dev server with watchers; `devApp()` — bare Next.js dev |
| `websocket.ts` | `createWebSocketServer()` — WebSocket server for dev hot-reloading |
| `paths.ts` | `getAppPath()`, `getWorkingPublicPath()`, `syncPublicFiles()` |
| `client-config.ts` | `persistClientConfig()`, `generateTokensApi()` |
| `watchers.ts` | File watchers for public dir, pages, SCSS, runtime components, and config |
| `index.ts` | Barrel re-exports |
