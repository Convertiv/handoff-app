# App Screens

The docs app side of screens (see `src/screens/README.md` for the SDK and the build).

## Flow

```
/screens/<id>/<params…>  → ScreenHost loads the UI chunk (generated/screens.client.ts)
   hooks                 → /api/screens/<id>/<collection>/[id]  → http.ts → typed store → backend
   assistant column      → /api/ai/chat (screen page context)   → MCP server + screen tools
   tool writes           → `data-screen-change` stream parts     → events.ts → client caches refresh
```

## Files

| File | Purpose |
|------|---------|
| `manifest.ts` | The baked manifest: listed screens, routes, static-export availability. Client-safe. |
| `sdk.ts` | What `handoff-app/screens` resolves to inside the app |
| `client/context.tsx` | Screen context, `useScreenRoute`, `useSession`, `useAssistantContext` |
| `client/data.ts` | Document and collection caches: optimistic updates, debounced saves, conflicts, remote changes |
| `client/docs.ts` | Docs hooks: components, patterns, docs API reads, custom previews, assessments. Queries and record shapes come from `src/screens/catalog.ts` |
| `client/api.ts` | The collection API client |
| `client/chrome.ts` | `isScreenChrome` and the attribute that marks app regions drawn inside a screen |
| `events.ts` | Browser events between the assistant and screens. Client-safe. |
| `server.ts` | Access rules, the collections backend for the mode, stores, the docs reader, declared tools. Server-only. |
| `http.ts` | The collection API handler |
| `mcp.ts` | Generated CRUD tools and declared tools as MCP tools, scoped per screen |
| `workspace-backend.ts` | The file backing of collections |
| `types.ts` | Shapes of the generated files |

UI components live in `components/Screens`.

## Rules

- `server.ts`, `http.ts`, `mcp.ts` and `workspace-backend.ts` import `@/generated/screens.server`
  or Node modules. Never import them from browser code, not even lazily.
- A workspace applies no roles. A registry needs a signed-in user whose role meets the screen's
  `access`. An MCP token also needs a write scope (`registry:write` or `previews:write`) to write.
- A `screen`-scoped tool is listed only when the chat's latest question was asked on that screen.
