# Catalog Module

The authoring contract for a documented UI entry. A catalog item declares either an
`implementation`, which names its renderer, or a `composition` of other items. The shared model
carries no React types, so another framework adds an entry point without changing it.

The module maps declarations directly into the runtime component and pattern records. An item with
an implementation takes the component pipeline; an item with a composition takes the pattern
pipeline.

## Files

| File                | Purpose                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderers.ts`      | The renderer registry: one row per renderer and per source format, plus `sourceForFile()`, `entryKeyFor()`, `moduleFor()`          |
| `types.ts`          | `CatalogItem`, `CatalogItemMeta`, `CompositionRef`, `CatalogPreview`, `Preview<TItem>`, `ImplementationSource`, `SourceDescriptor`. Types only, no React |
| `define.ts`         | `createCatalogItem()` shared by the entry points (it stamps the renderer), `defineCatalogItem()` for the root module, `validateCatalogItem()`              |
| `previews.ts`       | `createCatalogPreviews()` — named exports of a declaration module become previews; `readExportOrder()` / `orderPreviews()` restore declaration order |
| `implementation.ts` | `resolvePropertySource()` — maps an authored value back to its source file and export                                                                |
| `normalize.ts`      | `normalizeCatalogItem()` — declaration module to runtime component or pattern record                                                                      |
| `index.ts`          | Barrel re-exports                                                                                                                                    |

## Entry points

`src/react.ts`, `src/handlebars.ts` and `src/pattern.ts` compile to `dist/react.js`,
`dist/handlebars.js` and `dist/pattern.js`, and `package.json` `exports` maps them to
`handoff-app/react`, `handoff-app/handlebars` and `handoff-app/pattern`. The React entry point also
owns `fromCSF`, because CSF is a source format of React rather than a framework.

The renderer entry points call `createCatalogItem` with their renderer. The pattern entry point calls it without a renderer.
`define.ts` handles the shared `implementation` forms: a helper's `{ format, file }`, a file path, or an imported component.
A new renderer module requires a definition in `renderers.ts`, an `exports` entry, and an entry point file.

## Why the renderer is stamped into the declaration

The renderer entry point specifies the renderer. The package root accepts `implementation: { renderer, file }`.

Declarations use `.handoff.ts`, `.handoff.js`, or `.handoff.cjs` modules and export previews by name.
`validateCatalogItem` rejects removed fields and invalid renderer/source-format pairs.

## Why the implementation file is resolved from source text

`implementation: Button` and a CSF `meta.component` are values. The build still needs the file, for
docgen, file watching, and publishing. `resolvePropertySource` reads the declaration or story source,
finds the identifier the property is bound to, and follows its import. Resolution never throws. An
explicit path takes precedence, and a single sibling component file is the fallback.
If resolution fails, Handoff skips the item with an actionable warning and retries on the next save.

A resolved file outside the item directory is reported. `publish` makes entry paths relative to the
entity directory and `registry/path.ts` rejects a `..` segment, so such an item cannot be published.

## Why preview order comes from the source text

Previews are named exports, and the evaluated module cannot say which order they were declared in.
esbuild emits its export map alphabetically, and the ESM specification requires sorted namespace
keys. `readExportOrder` reads the order back from the source, and `orderPreviews` re-keys the map. A
preview whose export form does not parse keeps its position at the end rather than being dropped.

The same pass runs on CSF story files, in the loader and again in `csf-render`, so a story list
matches the file the way Storybook shows it.

Publish records carry `previewOrder` because PostgreSQL jsonb does not preserve object key order.
Registry reads and checkout restore this order before serving or exporting previews.
