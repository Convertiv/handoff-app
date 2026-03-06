# Page JSON Definition

The Handoff build can produce **page** data alongside components. Pages are compositions of existing components: each page defines an ordered list of component IDs and, for each preview, an array of data objects (one per component). The build renders full HTML documents from these definitions and writes JSON and HTML into the public API.

## Where the files live

* **`public/api/pages.json`** — Array of page list entries (one per page). Used for the page list and design system menu.
* **`public/api/page/{id}.json`** — Full page data for a single page (metadata, component list, previews with values and URLs).
* **`public/api/page/{id}-{preview}.html`** — Rendered HTML document for a given page and preview (e.g. `boilerplate-default.html`).

These files are written during the build by the page pipeline ([updatePageSummaryApi](src/transformers/preview/page/api.ts), [writePageApi](src/transformers/preview/page/api.ts), and [processPages](src/transformers/preview/page/builder.ts)). The path is relative to the project’s `workingPath`; at build time they are copied into the app’s public directory and served under `/api/`.

## Config: including patterns

In `handoff.config.js`, add an `entries.patterns` array of paths to scan for page definitions (same pattern as `entries.components`):

```js
entries: {
  components: ['./test_components'],
  pages: ['./test_pages'],
},
```

Each path is scanned like component paths: if the path has a config file named `{dirname}.json` or `{dirname}.js`, it is treated as a single page; otherwise the directory is scanned for subdirectories, each of which can be a page. The **page ID** is the directory name (e.g. `boilerplate` for `test_pages/boilerplate/boilerplate.json`).

## Page document format

Each page is defined by a JSON or JS file in its directory. The file must export a **page object** with the following shape.

### Metadata (mirrors component metadata)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display name for the page |
| `description` | string | Short description for lists and docs |
| `group` | string | Category (e.g. "Marketing", "Templates") |
| `image` | string | Optional preview image URL or path |
| `figma` | string | Optional Figma file or frame URL |
| `should_do` | string\[] | Optional best-practice bullets |
| `should_not_do` | string\[] | Optional anti-pattern bullets |

### Structure

| Field | Type | Description |
|-------|------|-------------|
| `components` | string\[] | **Ordered** array of component IDs that compose this page. Each ID must exist in `entries.components`. |
| `previews` | object | Preview variations. Key = preview ID (e.g. `default`, `compact`). Value = preview object (see below). |

### Preview object

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Display name for this preview (e.g. "Default", "With hero") |
| `values` | object\[] | **Array of data objects**, one per component. `values[i]` is passed to the component at `components[i]` when rendering. Each object’s shape matches that component’s properties (e.g. `{ cards: [...] }` for a card-row component). |

Example page document (JSON):

```json
{
  "title": "Homepage",
  "description": "Marketing homepage with hero and feature row.",
  "group": "Templates",
  "components": ["hero", "example"],
  "previews": {
    "default": {
      "title": "Default",
      "values": [
        { "heading": "Welcome", "subheading": "..." },
        { "cards": [ { "title": "Card 1", "image": { "src": "...", "alt": "..." }, "link": { "label": "Learn more", "url": "#" } } ] }
      ]
    }
  }
}
```

In JS/CommonJS you can export the same object:

```js
module.exports = {
  title: 'Homepage',
  description: 'Marketing homepage with hero and feature row.',
  group: 'Templates',
  components: ['hero', 'example'],
  previews: {
    default: {
      title: 'Default',
      values: [
        { heading: 'Welcome', subheading: '...' },
        { cards: [...] },
      ],
    },
  },
};
```

## pages.json — list entries

An array of **page list objects**. Each entry is a summary for one page.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Page identifier (e.g. `boilerplate`) |
| `path` | string | Path to full data, e.g. `/api/page/{id}.json` |
| `title` | string | Display name |
| `description` | string | Short description |
| `group` | string | Category |
| `image` | string | Optional preview image |
| `figma` | string | Optional Figma URL |
| `should_do` | string\[] | Optional |
| `should_not_do` | string\[] | Optional |
| `components` | string\[] | Ordered list of component IDs |
| `previews` | object | Preview id → `{ title, values, url }` |

The list is sorted by `title`. The docs app uses it for the page list and system menu.

## page/{id}.json — full page data

A single JSON object per page. Shape matches **TransformPageResult** ([types](src/transformers/preview/page/types.ts)).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Page id |
| `title` | string | Display name |
| `description` | string | Description |
| `group` | string | Category |
| `image` | string | Optional |
| `figma` | string | Optional |
| `should_do` | string\[] | Optional |
| `should_not_do` | string\[] | Optional |
| `components` | string\[] | Ordered component IDs |
| `previews` | object | Preview id → `{ title, values, url }`. `url` is the relative HTML filename (e.g. `boilerplate-default.html`). |

## Rendered HTML previews

For each page and each preview, the build:

1. Renders each component in order with its corresponding `values[i]` (using the component’s template and helpers).
2. Composes the resulting fragments into a full HTML document that includes:
   * Shared and component-specific CSS (`main.css`, `{id}.css`)
   * Component scripts (`{id}.js`)
   * Preview script and styles

**Important:** Only **Handlebars (`.hbs`)** component templates are used for page composition. Components that use TSX or CSF are skipped (replaced with a placeholder comment) until multi-format page rendering is supported.

Output file: `public/api/page/{pageId}-{previewId}.html`. The docs app can load this in an iframe for the page detail view.

## Relationship to config and build

* **Source of pages**: The list of pages comes from **runtime config**: `entries.pages` in `handoff.config.js` points to directories that are scanned for page config files (`{dirname}.json` or `{dirname}.js`).
* **Validation**: At runtime config load, the build checks that every page’s `components` array only references known component IDs; unknown IDs are reported with a warning.
* **Build order**: Pages are built **after** components. The page pipeline runs [processPages](src/transformers/preview/page/builder.ts) after the component build so that component templates and assets exist.
* **Consumption**: The static Next app reads `pages.json` for the page list (e.g. `fetchPages()`) and loads `api/page/{id}.json` and the HTML preview URLs for the page detail view. See **[rest\_api.md](./rest_api.md)** and **[rest.yml](./rest.yml)** for the full API overview and OpenAPI spec.
