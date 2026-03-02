# Component JSON Definition

The Handoff build produces component data as JSON files under the project’s **public API**. The static docs app reads these to build the component list, menus, and component detail pages.

## Where the files live

- **`public/api/components.json`** — Array of component list entries (one per component). Used for menus and the component list page.
- **`public/api/component/{id}.json`** — Full transform result for a single component (e.g. `button.json`). Used for component detail pages and previews.

These files are written during the build by the component pipeline ([writeComponentSummaryAPI](src/transformers/preview/component/api.ts) and [writeComponentApi](src/transformers/preview/component/api.ts)). The path is relative to the project’s `workingPath` (e.g. `public` or `public-<projectId>`); at build time they are copied into the app’s public directory and end up in the static export under `api/`.

## components.json — list entries

An array of **component list objects**. Each entry is a summary for one component.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Component identifier (e.g. `button`) |
| `path` | string | Path to full data, e.g. `/api/component/{id}.json` |
| `title` | string | Display name (e.g. "Button") |
| `description` | string | Short description for lists and docs |
| `image` | string | Preview image URL or path |
| `group` | string | Category (e.g. "Inputs", "Atoms") |
| `type` | string | Type: `element`, `block`, `navigation`, or `utility` |
| `categories` | string[] | Optional categories for search/filter |
| `tags` | string[] | Optional tags (e.g. "primary", "interactive") |
| `figma` | string | Optional Figma file or node URL |
| `figmaComponentId` | string | Optional Figma component ID |
| `properties` | object | Property/slot schema (key → metadata) |
| `previews` | object | Preview variation id → `{ title, values, url }` |

The list is sorted by `title`. The docs app uses it to build the sidebar menu and the system component list page.

## component/{id}.json — full transform result

A single JSON object per component. Shape aligns with **TransformComponentTokensResult** ([types](src/transformers/preview/types.ts)).

### Core identity and metadata

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Component id |
| `type` | string | `element` \| `block` \| `navigation` \| `utility` |
| `title` | string | Display name |
| `description` | string | Description |
| `group` | string | Category |
| `image` | string | Preview image |
| `categories` | string[] | Optional |
| `tags` | string[] | Optional |
| `figma` | string | Optional Figma URL |
| `figmaComponentId` | string | Optional Figma component ID |
| `should_do` | string[] | Optional best-practice bullets |
| `should_not_do` | string[] | Optional anti-pattern bullets |

### Generated assets and code

| Field | Type | Description |
|-------|------|-------------|
| `format` | string | Output format label |
| `code` | string | Generated code (e.g. HTML) |
| `html` | string | Optional HTML |
| `preview` | string | Preview URL or path |
| `js` | string | Optional JS path or content |
| `css` | string | Optional CSS path or content |
| `sass` | string | Optional Sass path or content |
| `sharedStyles` | string | Optional shared styles |

### Previews and properties

| Field | Type | Description |
|-------|------|-------------|
| `previews` | object | Preview id → `{ title, values, url }` |
| `properties` | object | Property/slot name → slot metadata |
| `variant` | object | Optional variant key → value |
| `entries` | object | Optional `js`, `scss`, `template`, `schema` paths |
| `options` | object | Optional `preview.groupBy` etc. |
| `validations` | object | Optional validation id → result |
| `docgen` | object | Optional generated docs (handoff-docgen) |

### Page definition

| Field | Type | Description |
|-------|------|-------------|
| `page` | object | Optional page definition for the docs site |
| `page.slices` | array | Ordered list of page slices (see below) |
| `page.options` | object | Optional slice options |

## Page definition — slices

The `page.slices` array defines the layout of the component’s documentation page. Each slice has a **`type`** and type-specific fields.

| Slice type | Description | Extra fields |
|------------|-------------|--------------|
| `BEST_PRACTICES` | Best-practices section | — |
| `COMPONENT_DISPLAY` | Renders the component (and optional code) | `showPreview?`, `showCodeHighlight?`, `defaultHeight?`, `filterBy?` |
| `VALIDATION_RESULTS` | Validation results block | — |
| `PROPERTIES` | Properties table | — |
| `TEXT` | Free-form text (H3 + HTML) | `title?`, `content?` |
| `CARDS` | Card grid | `cards`, `maxCardsPerRow?` (1 or 2) |

The docs app renders slices in order. Slice types are defined in [src/transformers/preview/types.ts](src/transformers/preview/types.ts).

## Relationship to config

- **Source of component set**: The list of components and their metadata (type, group, entries) comes from **runtime config**: `config/docs` (e.g. `handoff.config.js` / docs structure) and `entries.components` (paths to component directories).
- **Build output**: The pipeline runs the component transformer, then writes `components.json` and each `public/api/component/{id}.json`. Partial rebuilds can update a single component’s JSON and merge into `components.json` via [updateComponentSummaryApi](src/transformers/preview/component/api.ts).
- **Consumption**: The static Next app reads these files at build time (e.g. `fetchComponents()` from the util that reads `components.json` and optional tokens) and at runtime from the exported `api/` under the app’s base path.
