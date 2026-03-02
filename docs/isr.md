# ISR (Incremental Static Regeneration)

The Handoff app is built as a **full static export** (`output: 'export'` in Next.js). There is no long-lived server, so traditional ISR (on-demand revalidation) is not available. Instead, “ISR” here means:

1. **Minimal rebuild** — Run only the necessary work (e.g. pages-only build or rebuild for specific components).
2. **Full Next build** — Next.js does not support building a subset of routes; a full `next build` is always run.
3. **Optional partial deploy** — Copy only the **affected** output files into the existing site output directory (no wipe), so the rest of the site stays from the last full build.

This is useful when the platform triggers updates after a **page change** (e.g. doc/markdown edit) or a **component change** (e.g. one component updated). The CLI commands `isr:pages` and `isr:component` implement this flow.

## Page ISR — `isr:pages`

**Use when:** Documentation or page content has changed (e.g. a markdown file in `config/docs` or `pages`).

**What it does:**

- Runs the app build with **components skipped** (`handoff.build(true)`). Only page/menu content is regenerated; component API is unchanged.
- Runs a full `next build`, then either copies the entire `out` directory to the site output (default) or, with `--partial`, copies only the **affected** static files.

**Options:**

| Option | Description |
|--------|-------------|
| `--path` | Single route path to invalidate (e.g. `/guidelines` or `foundations/colors`) |
| `--paths` | Comma-separated route paths to invalidate |
| `--menu-changed` | Treat as menu change: regenerate all menu-linked routes (all doc pages + system index pages) |
| `--partial` | Partial deploy: copy only the resolved affected output files into the existing site output (no wipe) |
| `--deploy-dir` | Copy output to this directory instead of the default site output |

**Affected paths (for partial deploy):**

- With **`--path`** or **`--paths`**: Only those routes. Each path maps to a static file like `{path}/index.html` (e.g. `guidelines/index.html`, `foundations/colors/index.html`).
- With **`--menu-changed`**: All routes that use the shared menu: `index.html`, every level-1 doc route (`{level1}/index.html`), every level-2 doc route (`{level1}/{level2}/index.html`), plus `system/index.html` and `system/component/index.html`.

Path resolution is implemented in [resolveAffectedOutputPaths](src/app-builder/isr-paths.ts).

**Examples:**

```bash
# Rebuild and deploy only the guidelines page (partial)
handoff-app isr:pages --path /guidelines --partial

# Rebuild and deploy all menu-linked routes (e.g. after adding/removing a doc)
handoff-app isr:pages --menu-changed --partial

# Rebuild and deploy to a custom directory
handoff-app isr:pages --deploy-dir /var/www/site
```

## Component ISR — `isr:component`

**Use when:** One or more components have changed on the platform or locally, and you want to update only their routes and API files.

**What it does:**

1. Runs **processComponents(handoff, id)** for each given component ID. This updates `public/api/component/{id}.json` and refreshes `public/api/components.json`.
2. Syncs the app (including the updated `public/api`) and runs a full **next build**.
3. Copies the full `out` directory to the site output, or with `--partial` copies only the **affected** files (component routes and API JSON).

**Options:**

| Option | Description |
|--------|-------------|
| `--id` | Component ID to rebuild (e.g. `button`) |
| `--ids` | Comma-separated component IDs to rebuild |
| `--partial` | Partial deploy: copy only affected component output files into the existing site output |
| `--deploy-dir` | Copy output to this directory instead of the default site output |

**Affected paths (for partial deploy):**

For each component ID, the following are copied (plus the list/index when applicable):

- `system/component/{id}/index.html`
- `system/component/index.html` (component list page)
- `api/component/{id}.json`
- `api/components.json`

For multiple IDs, the union of these paths is used. See [resolveComponentAffectedOutputPathsBatch](src/app-builder/isr-paths.ts).

**Examples:**

```bash
# Rebuild one component and full deploy
handoff-app isr:component --id button

# Rebuild two components and partial deploy
handoff-app isr:component --ids "button,card" --partial

# Rebuild and deploy to a custom directory
handoff-app isr:component --id button --deploy-dir /var/www/site
```

## Partial deploy behavior

- **Without `--partial`**: The build removes the existing site output directory (if present) and copies the entire `out` tree. This is a full deploy.
- **With `--partial`**: The build does **not** remove the output directory. It copies only the resolved list of affected files (e.g. specific `index.html` and API JSON paths) into the existing output, overwriting those files. All other files in the output directory are left unchanged from the previous build.

So partial deploy is incremental at **deploy** time: only changed routes and API files are updated.

## Default output path

By default, the site output is written to:

```
{workingPath}/{sitesDirectory}/{projectId}
```

Typically `sitesDirectory` is `out` and `projectId` comes from config (e.g. Figma project id or a hash of the working path). Use `--deploy-dir` to override this and write to a different directory (e.g. a staging or CDN upload path).

## Related

- CLI reference: [cli.md](./cli.md) (isr:pages, isr:component)
- Path resolution and build options: [src/app-builder/isr-paths.ts](src/app-builder/isr-paths.ts), [src/app-builder/build.ts](src/app-builder/build.ts)
