# Catalog Module

The authoring contract for a documented UI entry. A catalog item declares either an
`implementation`, which names its renderer, or a `composition` of other items. The shared model
carries no React types, so another framework adds an entry point without changing it.

The module maps declarations directly into the runtime component and pattern records. An item with
an implementation takes the component pipeline; an item with a composition takes the pattern
pipeline.

## Files

| File                | Purpose                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderers.ts`      | The renderer registry: one row per renderer, per source format, and per source suffix, plus `sourceForFile()`, `entryKeyFor()`, `moduleFor()`. Browser-safe             |
| `types.ts`          | `CatalogItem`, `CatalogItemMeta`, `CompositionRef`, `CatalogPreview`, `Preview<TItem>`, `DataPreview`, `DataPreviewOf<TItem>`, `SourceDescriptor`. Types only, no React |
| `define.ts`         | `createCatalogItem()` shared by the entry points (it stamps the renderer), `validateCatalogItem()`                                                                      |
| `previews.ts`       | `createCatalogPreviews()` — named exports of a declaration module become previews; `readExportOrder()` / `orderPreviews()` restore declaration order                    |
| `implementation.ts` | `resolvePropertySource()` — maps an authored value back to its source file and export. `createImplementationPlaceholder()` — the module the loader binds in its place. `implementationToSkip()` — the file it binds it for |
| `normalize.ts`      | `normalizeCatalogItem()` — declaration module to runtime component or pattern record                                                                                    |
| `index.ts`          | Barrel re-exports                                                                                                                                                       |

## Entry points

`src/react.ts`, `src/angular.ts`, `src/vue.ts`, `src/handlebars.ts` and `src/pattern.ts` compile to
`dist/react.js`, `dist/angular.js`, `dist/vue.js`, `dist/handlebars.js` and `dist/pattern.js`, and
`package.json` `exports` maps them to `handoff-app/react`, `handoff-app/angular`, `handoff-app/vue`,
`handoff-app/handlebars` and `handoff-app/pattern`. The React entry point also
owns `fromCSF`, because CSF is a source format of React rather than a framework.

The renderer entry points call `createCatalogItem` with their renderer. The pattern entry point calls it without a renderer.
`define.ts` handles the shared `implementation` forms: a helper's `{ format, file }`, a file path, or an imported component.

An entry point re-exports only the preview shape its renderer honors: `react.ts` exports `CatalogPreview` with `render`,
`handlebars.ts`, `angular.ts` and `vue.ts` export `DataPreview` and `DataPreviewOf` as `CatalogPreview` and
`Preview`, which reject `render`. `pattern.ts` exports neither. `angular.ts` types preview arguments
from the component class with `InputsOf`, and `vue.ts` from the component's `$props` with `PropsOf`.
The types are structural, so Handoff needs no Angular or Vue types. Their doc comments list where they
differ from what the framework accepts.

A new renderer needs:

- A `RENDERERS` row in `renderers.ts`. The row holds everything that other layers read about the
  renderer: its declaration module and entry key, the packages the loader keeps external, whether
  the loader may run the implementation, how checkout writes the implementation, and how the docs
  label and highlight its code
- `SOURCE_SUFFIXES` rows for the file names only this renderer owns, if any. They enable the
  mismatch check and the sibling-file fallback
- An entry point file, plus its `exports` and `typesVersions` entries in `package.json`
- A `RENDERER_PLUGINS` row in `transformers/preview/component/html.ts`
- A call to `this.addWatchFile()` in its preview plugin for each file the build reads outside the
  import graph, such as an Angular `templateUrl` or a Vue `<template src>`. With `clientRenderPlugin()`,
  list them in `watchFiles`. The build cache, `start`, and `publish` then track the file. Imported
  files need nothing
- The name of the entry point in `MISSING_RENDERER_HELP` (`define.ts`)
- Framework tooling from the workspace, never from Handoff's `dependencies`: check it with
  `requireWorkspacePackages()` and declare its Vite plugin as an optional peer dependency (see
  `transformers/README.md`, "Framework tooling"). A project then installs only the tooling of the
  renderers it uses

`RENDERERS` and `RENDERER_PLUGINS` are `Record<RendererKind, …>` with required fields, so the build
fails until the renderer is complete. No existing renderer file changes.

## Why the renderer is stamped into the declaration

The renderer entry point specifies the renderer, and it is the only authority on it. Nothing
downstream reads a renderer out of a file name.

Declarations use `.handoff.ts`, `.handoff.js`, or `.handoff.cjs` modules and export previews by name.
`validateCatalogItem` rejects removed fields and invalid renderer/source-format pairs.

## Why `SOURCE_SUFFIXES` is keyed by the suffix

The table only checks the implementation file against the renderer the declaration already stated.
Handlebars finds no `{{ }}` expressions in a `.tsx` file, so it emits the source as HTML instead of
failing. A wrong module stays invisible without the check. `normalizeCatalogItem` throws on a
mismatch, and `config/runtime.ts` turns that into a skipped item that retries on the next save.

Keying by the suffix keeps one row per file name. A suffix that more than one renderer owns lists
them all in `renderers`, and a duplicate key is a compile error. A file that no row claims is not
checked, so a renderer whose sources cannot be recognized by name adds no rows and loses nothing
else.

`renderers` is not the same list as `SOURCE_FORMATS[format].renderers`. The format's list says which
renderers can use the format at all. A suffix's list says which renderers can own that file name.
`.stories.tsx` is JSX, so it stays React-only even where a second renderer supports CSF.

Only a suffix that names a source format is conclusive about the format. A `.stories.tsx` file is
always CSF, while a plain `.tsx` file says nothing about its format.

## Why the implementation file is resolved from source text

`implementation: Button` and a CSF `meta.component` are values. The build still needs the file, for
docgen, file watching, and publishing. `resolvePropertySource` reads the declaration or story source,
finds the identifier the property is bound to, and follows its import. Resolution never throws. An
explicit path takes precedence. The fallback is the single sibling file whose suffix only the item's renderer owns.
If resolution fails, Handoff skips the item with an actionable warning and retries on the next save.

A resolved file outside the item directory is reported. `publish` makes entry paths relative to the
entity directory and `registry/path.ts` rejects a `..` segment, so such an item cannot be published.

## Why the loader can skip the implementation module

The loader runs a declaration only to read catalog data. A declaration that imports its
implementation would also run that module in Node. For Angular this fails or depends on the
workspace: decorators need the workspace compiler options, Angular packages are ES modules that
`require()` cannot always load, and a component may touch the DOM when it loads.

When `loadsImplementation` is false, `implementationToSkip()` resolves the implementation file from
the import text, as it does for `componentExport`, and `config/runtime.ts` marks that path external.
The build cache walks the declaration's module graph with the same external, so a file that esbuild
cannot read, such as a `.vue` file, does not void the graph; the renderer's Vite build records it.
esbuild matches an external path against the resolved import, so every import form that reaches the
file stays out of the bundle, and the modules that only it imports are never read. At run time, `require` returns
`createImplementationPlaceholder()` for that file: every export is a named empty class, including
any other value the declaration imports from it. Keep preview data in a separate file. When the
import text cannot be resolved, such as through a tsconfig path alias, the loader runs the module.
That fails for a `.vue` file, so a Vue declaration must import its component by a relative path.

## Why preview order comes from the source text

Previews are named exports, and the evaluated module cannot say which order they were declared in.
esbuild emits its export map alphabetically, and the ESM specification requires sorted namespace
keys. `readExportOrder` reads the order back from the source, and `orderPreviews` re-keys the map. A
preview whose export form does not parse keeps its position at the end rather than being dropped.

The same pass runs on CSF story files, in the loader and again in `csf-render`, so a story list
matches the file the way Storybook shows it.

Publish records carry `previewOrder` because PostgreSQL jsonb does not preserve object key order.
Registry reads and checkout restore this order before serving or exporting previews.
