# AI Module

The connection contract behind the docs assistant. `runtime.ai.connections` declares every endpoint
and model a reader can reach. A reader supplies a key for a declared connection and nothing else, so
the server never calls a URL a reader chose.

Every connection speaks the OpenAI-compatible `/chat/completions` API. A connection that fits
nothing else names a `defineAiProvider()` module instead of a base URL.

Mirrors `registry/asset-storage`: only provider selection, module location, non-secret options, and
env-var _names_ are ever persisted. Secret _values_ are read from `process.env` at request time.

## Files

| File             | Purpose                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connections.ts` | `AiConnectionSettings`/`AiSettings`, `resolveAiFromConfig()`, `parseAiConnections()`, `mergeAiConnections()`, `aiCredentialKind()`, model-id parse/format |
| `define.ts`      | `defineAiProvider()` — typed identity helper for a custom, server-only provider module                                                                    |
| `types.ts`       | `AiProvider`, `AiProviderContext`, `AiProviderFactory` — the pluggable provider contract                                                                  |

## Credential states

A connection declares how it is paid for, and this is never inferred from a missing key. Without the
explicit third state, a reader gets a raw 401 from the provider instead of an instruction.

| State         | Declaration               | Meaning                                                   |
| ------------- | ------------------------- | --------------------------------------------------------- |
| Service key   | `apiKey: fromEnv('NAME')` | The deployment pays. Every reader can use it.             |
| No credential | neither field             | The endpoint needs none, such as a local Ollama.          |
| User key      | `credential: 'user'`      | Each reader adds their own key for the declared endpoint. |

## Resolution order

1. The baked `runtime.ai.connections` list (`HANDOFF_AI_BAKED_CONNECTIONS`).
2. `HANDOFF_AI_CONNECTIONS`, a JSON array read at request time, merged over the baked list by `id`.

A reader's saved keys are not a third layer. They attach to a connection produced by these two
steps, and cannot create, rename or redirect one.

`runtime.ai.enabled` is config-only and baked, like `runtime.mcp`, so it decides whether the route
and the header control exist at all. The connection list is not baked, so a deployment can change it
without a rebuild.
