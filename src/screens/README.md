# Screens Module

A screen is a view in the docs app at `/screens/<id>`, written against a typed SDK. The project
config declares screens (`screens: [{ id, module, options? }]`), and the build compiles them into
the app. There is no runtime plugin loader.

`module` reads like an import: `./` or `../` is a workspace directory, and anything else is an npm
package with an optional subpath. `build/declarations.ts` resolves both to `ScreenFiles`; nothing
else resolves `module`. A package exports the UI at its subpath and optional
`<subpath>/collections`, `<subpath>/options` and `<subpath>/tools`, read with the `import` and
`default` conditions. The app adds screen packages to `transpilePackages`.

A screen directory holds:

| File | Imports | Runs in |
|------|---------|---------|
| `index.tsx` | `handoff-app/screens` | The browser. Default-exports `defineScreen({ ... })`. |
| `collections.ts` | `defineCollection` and types from `handoff-app/screens` | The browser and the server. Pure data. |
| `options.ts` (optional) | `defineScreenOptions` from `handoff-app/screens` | The browser and the server. Pure data. |
| `tools.ts` (optional) | `handoff-app/screens/server` | The server. Default-exports `defineScreenTools(...)`. |

## Entry points

- `handoff-app/screens` (`index.ts`): definitions, helpers and types. The hooks and components are
  declared here and implemented by the docs app (`src/app/lib/screens/sdk.ts`). The app maps the
  package name to that file in its bundler aliases and tsconfig, so a screen shares React context and
  caches with the app. The declarations come from `client-api.ts`, and the implementation is typed
  against the same file, so the two cannot drift apart. `sdk.ts` also fails to type-check when its
  exports and the declarations list different names. Outside the app, the hooks are `undefined`.
- `handoff-app/screens/server` (`server.ts`): `defineScreenTools`, `defineTool`, `toolResult`,
  `toolError`, the store and docs types, and the list helpers. No runtime dependencies.

Neither entry point loads the CLI.

## Data

- A collection is a JSON Schema plus a version. `FromSchema` (`schema.ts`) derives the document type,
  so hooks, stores and tool handlers are typed from the schema.
- `store.ts` is the typed store, written once over `CollectionsBackend`: validation (`validate.ts`),
  a size cap, upgrades on read with write-back, optimistic revisions, and `update()` with retries.
- Storage is keyed by owner kind, owner id, collection and document id (`CollectionScope`). Screens
  are the `screen` owner kind; the app sets it, and a screen cannot choose its location. A new
  feature that stores documents adds an owner kind to `DocumentOwnerKind` instead of a new store.
- Backings: files at `handoff/data/<owner kind>/<owner id>/<collection>/<id>.json` in a workspace,
  such as `handoff/data/screens/notes/items/abc.json` (`src/app/lib/screens/workspace-backend.ts`),
  and the `documents` table in a registry (`src/registry/screen-documents`). Screens never reach
  either one directly.
- Collection names and document ids are lowercase: a registry tells `Abc` from `abc`, but the
  default macOS and Windows filesystems do not. Every key part is a path segment in a workspace,
  so the workspace backing rejects anything that `isStorageName()` does not accept.
- Queries are equality filters on top-level fields, a sort on `createdAt`, `updatedAt` or `id`, and
  cursor paging. Anything richer is a core feature, not a screen feature.

## Adding to the SDK

Public types live in this directory and never re-export a core type. Screens depend on them, so a
change to core internals, such as the preview transformer's `SlotMetadata`, must not change them.
Where the app assigns a core record to a public type, the compiler checks that the shapes still match.

- A helper that runs anywhere: write it in its module, export it from `runtime.ts`, and document it in `docs/api.md`.
- A hook or a component: add its type to `client-api.ts`, declare it in `index.ts`, implement it in the
  app and export it from `src/app/lib/screens/sdk.ts`, and document it in `docs/api.md`.
- A component or pattern query option: add it to `ComponentQuery` or `PatternQuery` (`types.ts`) and
  apply it in `catalog.ts`. The hooks and `docs.components()` pick it up.

## Build

`build/` runs in the CLI only:

| File | Purpose |
|------|---------|
| `declarations.ts` | Resolves the `screens` config at load: ids, duplicates, options as plain JSON, directories and packages (`exports`) |
| `analyze.ts` | Reads `title`, `description`, `icon`, `nav`, `access` and `fullscreen` from `defineScreen()` as literals |
| `check.ts` | Bundles each import graph with esbuild and rejects forbidden imports; loads `collections.ts`, `options.ts` and `tools.ts` to check names, schemas and declared options, and fills option defaults |
| `generate.ts` | Writes `generated/screens.json`, `screens.client.ts`, `screens.server.ts` and `screens.css` into the staged app |
| `scaffold.ts` | `make:screen <id>` |

Forbidden imports, each reported with the file and the fix:

- any graph: the database packages, `handoff-app` and its other entry points, `@handoff/*`;
- UI graph: `handoff-app/screens/server`, the screen's `tools.ts`, Node built-ins;
- server graph: React, Next and other UI packages, `.tsx`/`.jsx` files, hooks or components from
  `handoff-app/screens`;
- `collections.ts` and `options.ts`: Node built-ins.

## Options

`options.ts` default-exports `defineScreenOptions({ schema })`. The build checks the declaration's
`options` against the schema, fills each `default` (`withDefaults`), and bakes the result into the
manifest. `useScreenOptions(definition)` and `options.get(definition)` in tools return it; the
definition only types the result. The browser receives the manifest, so options must not hold secrets.

## Files

| File | Purpose |
|------|---------|
| `index.ts` | `handoff-app/screens` |
| `server.ts` | `handoff-app/screens/server` |
| `client-api.ts` | Signatures of the hooks and components |
| `public-types.ts` | Every public type; both the entry point and the app implementation re-export it |
| `runtime.ts` | The runtime values that run anywhere. `index.ts`, the app's `sdk.ts` and the server-safe module of `check.ts` re-export it |
| `define.ts` | `defineCollection`, `defineScreen`, `ComponentInstance` |
| `schema.ts` | The supported JSON Schema subset and `FromSchema` |
| `validate.ts` | Value validation, schema checks, `emptyValue()` |
| `instances.ts` | Component instances: create, expand a pattern, assess against contracts, list helpers |
| `catalog.ts` | Docs records as `ComponentSummary`, `ComponentInfo` and `PatternInfo`, and the component and pattern queries. The browser hooks and the server docs reader both use it |
| `store.ts` | `CollectionsBackend` and the typed store |
| `types.ts` | Stored documents, queries, docs shapes (including `ComponentContract`), `ScreenDataError` |
| `core-contract.ts` | Internal. Hands a public `ComponentContract` to the core custom-previews helpers |
| `manifest.ts` | The shape of `generated/screens.json` |
