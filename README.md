# Handoff - Design System Runtime

<a aria-label="NPM version" href="https://www.npmjs.com/package/handoff-app">
  <img alt="" src="https://img.shields.io/npm/v/handoff-app?style=for-the-badge&labelColor=000000">
</a>
<a aria-label="License" href="https://github.com/convertiv/handoff-app/blob/main/License.md">
  <img alt="" src="https://img.shields.io/npm/l/handoff-app?style=for-the-badge&labelColor=000000">
</a>

Handoff turns design tokens, components, and patterns into working
documentation and distributable artifacts. You can serve the documentation
from a local workspace, a static site, or a shared registry with a PostgreSQL
database.

> **Recipes:** [RECIPES.md](RECIPES.md) has complete examples for project
> layouts, catalog items, profiles, registry hosting, asset storage, email, and
> the AI assistant.

> **Upgrade from version 1.x.x:** read the
> [migration guide](UPGRADE.md#version-1xx-to-version-2xx) for the breaking
> changes and the migration steps.

## Contents

- [How Handoff works](#how-handoff-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Authoring](#authoring)
- [Running the workspace](#running-the-workspace)
- [Building](#building)
- [Registry](#registry)
- [Connecting a workspace to a registry](#connecting-a-workspace-to-a-registry)
- [MCP](#mcp)
- [AI assistant](#ai-assistant)
- [CLI reference](#cli-reference)

## How Handoff works

### Runtime modes

- **Workspace** is the default mode. Local files are the source of truth, and
  no database is necessary. You use it to author content.
- **Registry** is a deployed catalog with a PostgreSQL database. It stores and
  serves only the content that a workspace publishes to it.
- A **connected workspace** is a workspace that can publish to a registry and
  check out from it. It is not a third mode.

The `runtime.mode` value in the config sets the mode. A registry build sets
registry mode automatically, so the base config stays in workspace mode.

### Workflow

```text
Figma            ── fetch ──▶  exported/      tokens, CSS, Sass, assets
catalog, pages   ── start ──▶  local documentation at http://localhost:3000
                 ── build ──▶  out/static (static site) or out/registry (registry server)
workspace        ── publish ─▶ registry ── checkout ─▶ workspace
```

The workspace is the only place that builds content. A registry never builds
and never reads workspace source.

### Terms

- **Working directory:** the directory that holds `handoff.config.ts`. Every
  command runs against it.
- **Catalog item:** one documented UI entry. It has a declaration file, a
  stable id, and previews.
- **Component:** a catalog item with an implementation (React, Handlebars, or
  CSF).
- **Pattern:** a catalog item that is a composition of other catalog items.
- **Foundations:** the tokens and assets that `fetch` gets from Figma.
- **Page:** a Markdown documentation page under `pages/`.
- **Profile:** a config file that merges onto the base config for one
  environment.

## Requirements

- Node.js 22 or newer. We recommend Node.js 24 LTS.
- npm 10 or newer.
- A paid Figma account, to fetch a Figma library.
- PostgreSQL, to run a registry.

## Installation

### New project

Create a project with the interactive wizard:

```bash
npx handoff-app init
cd my-handoff-project
```

The wizard asks for the project name, sample content, JavaScript or
TypeScript, an optional Vercel setup, and optional Figma credentials. It
creates the starter files and installs `handoff-app` in the project.

Use the generated npm scripts. They run the project version of `handoff-app`,
so local development and CI use the same version:

```bash
npm run fetch       # optional: fetch Figma foundations
npm run start       # local server with Handoff file watchers
npm run dev         # local development server without Handoff file watchers
npm run build       # static build by default
npm run publish     # publish to a registry
npm run checkout    # check out from a registry
npm run login       # sign in to a registry
npm run logout      # sign out of a registry
npm run db:migrate  # registry database migrations
```

### Project layout

```text
<working directory>/
├─ handoff.config.ts
├─ .env
├─ components/
├─ patterns/
├─ pages/
├─ exported/       # fetched tokens and assets; commit this directory
├─ public/api/     # generated docs API; gitignored
├─ out/            # build output; gitignored
├─ .vercel/        # `--package vercel` output; gitignored
└─ .handoff/       # local Handoff state; gitignored
```

In a project that `init` creates, the working directory is the repository
root. `HANDOFF_WORKING_PATH` sets a different working directory.

### Adding Handoff to an existing application

Declarations sit next to the components that they document. Thus the catalog
points into the application source:

```ts
catalog: { include: ['src/components', 'src/blocks'] },
```

Two rules apply to every layout.

**`handoff-app` must be a dependency of the package that holds the
`*.handoff.ts` files.** A declaration imports `handoff-app/react`. Handoff
resolves that import from the directory of the declaration, not from the
directory of the config. With npm, hoisting usually hides a missing dependency.
With pnpm, Handoff skips the affected items with
`Could not resolve "handoff-app/react"`, and the build still exits with code 0.
In a workspace-package layout, the application package and the `handoff/`
package must both declare `handoff-app`.

**Two `tsconfig.json` files do different jobs:**

- The config nearest to the declarations type checks them. An editor reads
  only the nearest config. A config in a different directory that includes
  `src/` does not count.
- The config in the working directory makes the property tables. Without it,
  Handoff shows `TypeScript config not found`, and every table is empty.

If the working directory is not the project root, you need both files.

Three layouts work. Each keeps one dependency tree, so the catalog renders the
real components with the same React instance. Handoff does not support a
separate install with its own `node_modules` outside that tree.

| Layout | Working directory | Use when |
| --- | --- | --- |
| Subdirectory (recommended) | `handoff/`, set by `HANDOFF_WORKING_PATH` | The application must not change |
| Project root | The project root | The bundler can move its `public/` directory (not Next.js) |
| Workspace package | `handoff/`, with its own `package.json` | The repository is already a workspace |

In the project-root layout, Handoff writes the generated documentation API to
`public/api`. Thus a bundler that serves `public/` copies it into the
production build of the application. Move the bundler to a different
directory. A Next.js application cannot move its `public` directory, so it
cannot use this layout.

With pnpm, `build --target registry` cannot follow the pnpm symlinks. Set
`nodeLinker: hoisted` in `pnpm-workspace.yaml`. The other builds work with the
default pnpm layout.

To add Handoff in the recommended subdirectory layout:

1. Install `handoff-app` in the application package:

   ```bash
   npm install handoff-app
   ```

2. Create `handoff/handoff.config.ts`. Point the catalog at the application
   source, and load the global stylesheet of the application into the
   previews:

   ```ts
   import { defineConfig } from 'handoff-app';

   export default defineConfig({
     app: { title: 'Acme Design System' },
     catalog: { include: ['../src/components'] },
     entries: { scss: '../src/styles/main.scss' },
   });
   ```

   Paths are relative to the working directory. `npx handoff-app eject:config`
   writes the full default config instead.

3. Create `handoff/tsconfig.json`, so that Handoff can make the property
   tables:

   ```json
   { "extends": "../tsconfig.json", "include": ["../src", "handoff.config.ts"] }
   ```

4. Add the scripts to the `package.json` of the application:

   ```json
   {
     "scripts": {
       "handoff:dev": "HANDOFF_WORKING_PATH=handoff handoff-app start",
       "handoff:build": "HANDOFF_WORKING_PATH=handoff handoff-app build"
     }
   }
   ```

5. Write a declaration next to a component, for example
   `src/components/button/button.handoff.ts`. The
   [Catalog items](#catalog-items) section shows the format.

6. Start the documentation:

   ```bash
   npm run handoff:dev
   ```

7. Add `handoff/public/api`, `handoff/out`, `handoff/.handoff`, and
   `handoff/.vercel` to `.gitignore`. Commit `handoff/exported` if you fetch
   from Figma.

> **Recipes:** [Subdirectory](RECIPES.md#handoff-in-a-subdirectory) ·
> [Project root](RECIPES.md#handoff-in-the-project-root) ·
> [Workspace package](RECIPES.md#handoff-as-a-workspace-package) ·
> [pnpm](RECIPES.md#pnpm) · [npm scripts on Windows](RECIPES.md#npm-scripts-on-windows)

## Configuration

### Config file

Handoff reads `handoff.config.ts`, `.js`, `.cjs`, or `.json`, in that order.
`-c, --config <file>` loads one specific file instead. `defineConfig` gives
typed authoring:

```ts
// handoff.config.ts
import { defineConfig, fromEnv } from 'handoff-app';

export default defineConfig({
  app: { title: 'Acme Design System' },
  catalog: { include: ['components', 'patterns'] },
  runtime: {
    mode: 'workspace',
    workspace: { declarationFormat: 'ts' },
    registry: {
      database: { url: fromEnv('DATABASE_URL'), driver: 'pg' },
    },
  },
});
```

Values merge onto the defaults. Plain objects merge recursively. Arrays,
scalars, `null`, and functions replace the default.

### Main settings

| Setting | Purpose |
| --- | --- |
| `app.title`, `app.client` | Name of the documentation site and of the client |
| `app.theme` | Theme of the documentation app. `npx handoff-app eject:theme` copies it so that you can change it. |
| `app.basePath` | URL path of the site when you serve it under a sub-path, for example `/design-system` |
| `app.breakpoints` | Preview widths. A declared block merges onto the defaults. |
| `app.ports` | Workspace server ports, `{ app, websocket }`. The defaults are 3000 and 3001. |
| `catalog.include` | Catalog directories. See [Registration](#registration). |
| `entries.scss`, `entries.js` | Global stylesheet and script that Handoff builds and loads into every preview |
| `integrations.figma` | Figma file and token. See [Figma foundations](#figma-foundations). |
| `exportsOutputDirectory` | Directory for fetched foundations. The default is `exported`. |
| `sitesOutputDirectory` | Directory for build output. The default is `out`. |
| `runtime.mode` | `workspace` (default) or `registry` |
| `runtime.workspace.declarationFormat` | Format of the declarations that `checkout` writes: `ts`, `js`, or `cjs` |
| `runtime.registryConnection` | Registry URL and token of a connected workspace |
| `runtime.registry` | Registry database, asset storage, and email. See [Registry](#registry). |
| `runtime.mcp` | MCP endpoint on or off. See [MCP](#mcp). |
| `runtime.ai` | AI assistant. See [AI assistant](#ai-assistant). |
| `hooks` | Build hooks, documented in [docs/api.md](docs/api.md) |

The `Config` type documents every setting. Several settings read an environment
variable by default. [Environment variables](#environment-variables) lists them.

### Build-time and runtime values

`fromEnv('NAME')` refers to an environment variable. It does not copy the
value into the config.

- A literal value is baked into the build.
- For a `fromEnv()` value, the build keeps only the variable name. A deployed
  registry reads the value at request time. Thus you can change it without a
  rebuild.
- Secrets must use `fromEnv()`.

Some settings change the shape of the build. These settings are baked, so a
change to a deployed registry needs a rebuild:

- `runtime.mode`
- `runtime.mcp`
- `runtime.ai.enabled`
- The database driver
- The asset storage adapter and the email provider
- Every custom server module

### Profiles

A profile is a config file that merges onto the base config. It holds only what
changes between environments. Thus a project keeps one shared config, not a
second full copy.

- The base config is `handoff.config.ts`, `.js`, `.cjs`, or `.json`. When no
  profile is selected, Handoff loads only this file.
- A profile file is `handoff.config.<profile>.*`, with the same four
  extensions.
- Select a profile with `--profile <name>` or with `HANDOFF_PROFILE`.
  `--profile` has priority over `HANDOFF_PROFILE`.
- Profile names are not predefined. A name can contain lowercase letters,
  numbers, and hyphens.
- A selected profile must exist. If no `handoff.config.<name>.*` file exists,
  the command stops with an error.
- `login`, `logout`, `publish`, and `checkout` also accept a profile that has
  only a saved registry login. For these commands, the profile selects the
  registry. Every other command needs the config file.
- Layers apply in this order: defaults, base config, profile, then
  programmatic config. The [merge rules](#config-file) apply to each layer.
- A selected profile also reads `.env.<profile>` on top of `.env`, if that file
  exists. Handoff reads both files from the directory where the command runs. A
  variable that is already in the environment has priority over both files.

```bash
npx handoff-app build --target registry --profile registry
```

A profile is a good place for the registry build settings: the database
driver, the database variable name, the asset storage, the email provider, and
MCP. `build --target registry` always builds a registry-mode application, so
the profile does not set `runtime.mode`. A hosting provider or a CI job selects
the profile with `HANDOFF_PROFILE`.

`defineConfig` types a profile and a base config the same way. The generated
`.gitignore` lists `handoff.config.local.*`. Thus `local` is the usual name for
a profile that stays on one machine.

Arrays replace. Thus a profile that declares `catalog.include` also controls
what `make:component` and `checkout` register.

Handoff reads `.env.<profile>` once at startup and does not watch it. It cannot
set `HANDOFF_WORKING_PATH`, because Handoff finds the working path before it
knows the profile.

> **Recipes:** [Local profile](RECIPES.md#local-profile) ·
> [Registry build profile](RECIPES.md#registry-build-profile) ·
> [One workspace, several registries](RECIPES.md#one-workspace-several-registries)

### Environment variables

Handoff reads two kinds of variables:

- **Fixed variables.** Handoff always reads these names.
- **Setting defaults.** Each one is the default `fromEnv()` name of a setting.
  To use a different name, set the setting to `fromEnv('YOUR_NAME')`.

This section does not list the variables that you name in the config. Examples
are the keys of a custom asset storage adapter or of an AI connection. A
standalone registry build writes `out/registry/README.md`, which lists every
variable that the build needs, with the names from your config.

**Fixed variables**

| Variable | Purpose |
| --- | --- |
| `HANDOFF_PROFILE` | Config profile merged onto the base config |
| `HANDOFF_WORKING_PATH` | Directory that holds `handoff.config.ts`. The default is the current directory. |
| `HANDOFF_LOG_LEVEL` | `debug`, `info`, `warn`, `error`, or `silent`. The default is `info`. |
| `HANDOFF_LOG_SCOPES` | Comma-separated log sources: `handoff`, `vite`, `next`. The default is all three. |
| `HANDOFF_LOGIN_NO_BROWSER` | Set to `true` to stop `login` from opening a browser, the same as `--no-browser` |
| `HANDOFF_CREATE_ASSETS_ZIP_FILES` | Set to `false` to skip the icon and logo zip files in `fetch` |
| `HANDOFF_SYNC_SECRET` | Optional deployment-wide credential with read and write access. The registry accepts it. A workspace uses it only when it has no token and no login. |
| `AUTH_SECRET` | Registry session-signing secret, at least 32 characters. Required by a registry. |
| `AUTH_URL` | Canonical public registry URL, with the base path. Required by a registry. |
| `PORT` | Standalone registry server port |
| `HOSTNAME` | Standalone registry server bind hostname |
| `HANDOFF_AI_KEY_SECRET` | Encrypts the AI provider keys of readers, at least 32 characters |
| `HANDOFF_AI_CONNECTIONS` | JSON array of AI connections, merged over the built-in list by `id` |

**Setting defaults**

| Variable | Setting | Purpose |
| --- | --- | --- |
| `HANDOFF_FIGMA_PROJECT_ID` | `integrations.figma.projectId` | Figma file ID that `fetch` uses |
| `HANDOFF_DEV_ACCESS_TOKEN` | `integrations.figma.accessToken` | Figma personal access token that `fetch` uses |
| `HANDOFF_REGISTRY_URL` | `runtime.registryConnection.url` | Registry URL of a connected workspace |
| `HANDOFF_REGISTRY_ACCESS_TOKEN` | `runtime.registryConnection.accessToken` | Registry access token of a connected workspace |
| `DATABASE_URL` | `runtime.registry.database.url` | PostgreSQL connection string. Required by a registry. |
| `HANDOFF_APP_PORT` | `app.ports.app` | Workspace documentation server port. The default is 3000. |
| `HANDOFF_WEBSOCKET_PORT` | `app.ports.websocket` | Workspace live-reload server port. The default is 3001. |
| `HANDOFF_OUTPUT_DIR` | `exportsOutputDirectory` | Fetched output directory. The default is `exported`. |
| `HANDOFF_SITES_DIR` | `sitesOutputDirectory` | Build output directory. The default is `out`. |

Keep the name `HANDOFF_OUTPUT_DIR`. The documentation app also reads this
variable directly.

## Authoring

### Catalog items

Every documented UI entry is a catalog item. An item declares one of these:

- An `implementation`, which names a renderer: React, Handlebars, or CSF.
  The registry stores the item as a component.
- A `composition` of other items. The registry stores the item as a pattern.

An item never declares both. `defineCatalogItem` comes from the module of the
renderer. The declaration gives the stable id, the documentation metadata, the
source entries, and the previews.

**React.** Handoff finds the implementation file from its import, so you do not
repeat the path. Handoff builds the CSS of the item from the stylesheets that
the import chain loads, descendants included. Previews are named exports.
`Preview<typeof item>` gives them the argument type of the implementation.

```tsx
// components/example/Component.tsx
export type ComponentProps = {
  label: string;
  onSelect?: () => void;
};

export default function Component({ label, onSelect }: ComponentProps) {
  return <div onClick={onSelect}>{label}</div>;
}
```

```tsx
// components/example/example.handoff.ts
import { defineCatalogItem, type Preview } from 'handoff-app/react';
import Component from './Component';

const item = defineCatalogItem({
  id: 'component-id',
  name: 'Component name',
  description: 'Usage guidance for the component.',
  group: 'Group name',
  implementation: Component,
});

export default item;

type ComponentPreview = Preview<typeof item>;

export const Default = {
  args: { label: 'Example' },
} satisfies ComponentPreview;
```

The export name is the preview name. `name` sets a different display title.
Handoff serializes the arguments. Thus a preview that needs an icon, a
callback, JSX children, or its own state declares a `render` function. A
declaration that holds JSX must use the `.handoff.tsx` extension.

**Handlebars.** The implementation is the path to the template:
`implementation: './Badge.hbs'`, from `handoff-app/handlebars`.

**CSF.** A React item uses an existing story file with
`implementation: fromCSF('./Card.stories.tsx')`. The story file does not
change, and its named exports are the previews. The server renders a CSF
preview, and the browser does not hydrate it. The browser hydrates a direct
React implementation.

**Compositions.** A composition references other items by stable id. Each
reference can select a named preview and override its arguments. A composition
needs no renderer, so it uses `defineCatalogItem` from `handoff-app/pattern`:

```ts
// patterns/example/example.handoff.ts
import { defineCatalogItem } from 'handoff-app/pattern';

export default defineCatalogItem({
  id: 'pattern-id',
  name: 'Pattern name',
  description: 'Purpose and usage of the composition.',
  group: 'Group name',
  composition: [
    { ref: 'component-id', preview: 'Default' },
    { ref: 'badge', args: { children: 'Send' } },
  ],
});
```

**Ids.** The `id` addresses the item everywhere: its artifacts, its
documentation URL, and the `publish` and `checkout` commands. Components and
patterns share one namespace, so each id must be unique across both. If two
declarations use one id, Handoff keeps the first, skips the second, and names
both files in a warning. `publish` does not run until each id is unique.

Terms such as atom, element, and block are optional classification metadata on
`type` and `categories`.

> **Recipes:** [React preview with a render function](RECIPES.md#react-preview-with-a-render-function) ·
> [Handlebars item](RECIPES.md#handlebars-item) · [CSF stories](RECIPES.md#csf-stories) ·
> [Composition with preview overrides](RECIPES.md#composition-with-preview-overrides)

### Registration

`catalog.include` in the config registers the catalog directories. Each path is
one of these:

- An item directory.
- A collection directory. Each subdirectory is an item.

```ts
catalog: {
  include: ['components', 'patterns'],
},
```

`npx handoff-app make:component <name>` creates a Handlebars item and adds its
directory to `catalog.include` when necessary.

### Pages

Custom documentation pages are Markdown files under `pages/`. The relative
path of a page is its route and its registry id.
`npx handoff-app make:page <name> [parent]` creates a page.
`npx handoff-app eject:pages` copies the default pages so that you can change
them.

### Figma foundations

The Figma integration is optional. If you enter Figma credentials during
`init`, the wizard writes them to `.env`, and `fetch` is ready to run.

To add or change the Figma source, set these values in `.env`:

```dotenv
HANDOFF_FIGMA_PROJECT_ID=figma-file-id
HANDOFF_DEV_ACCESS_TOKEN=figma-personal-access-token
```

The personal access token must have the `file_content:read` and
`library_content:read` scopes. Fetch the library:

```bash
npm run fetch
```

`fetch` writes tokens, CSS, Sass, and the available assets to `exported/`.
Commit `exported/` so that local builds and CI builds use the same inputs. To
make sure that the fetch worked, look for `exported/tokens.json`. An empty
foundation page does not prove that the fetch worked.

If a value is empty, `fetch` asks for it in the terminal. It can save the value
to `.env`, or to `.env.<profile>` when a profile is selected. Without a
terminal, for example in CI, `fetch` stops with an error that names the
missing variable.

After a design change, publish the Figma library again. Then run `fetch` again
to get the latest foundations.

These variable names are the defaults of `integrations.figma`. Set the block
only to use different variable names, to commit the file ID, or to change the
file for a profile. The access token accepts only an environment reference:

```ts
integrations: {
  figma: {
    projectId: fromEnv('HANDOFF_FIGMA_PROJECT_ID', { default: null }),
    accessToken: fromEnv('HANDOFF_DEV_ACCESS_TOKEN', { default: null }),
  },
},
```

## Running the workspace

Start the documentation server and the Handoff file watchers:

```bash
npm run start
```

While the command runs, Handoff rebuilds changed files and updates the
documentation. If you do not need the file watchers, run `npm run dev`
instead.

Open http://localhost:3000 and make sure that:

- The app shows `Workspace` as the active runtime mode.
- The component list shows your components.
- Each component page renders all of its previews.
- Each pattern renders the components that it references.
- The foundation pages show the fetched values.

## Building

**Static site.** Build the documentation as a static site:

```bash
npm run build
```

The output goes to `out/static`. A static file server or a CDN can serve it. A
static site has no API routes. Thus it has no MCP endpoint and no AI
assistant.

**Build cache.** Handoff does not build a component again if its files did not
change since the last build. The cache in `.handoff/.cache/` records the files
of each component and every file that its last build read, Sass partials
included. The lockfile covers files under `node_modules`. The cache does not
track assets that a stylesheet loads through `url()`. Build every component
again:

```bash
npm run build -- --force
```

**Registry server.** Build a standalone registry application:

```bash
npm run build -- --target registry
```

The command sets registry mode in the generated application. It writes the
Next.js server bundle to `out/registry`. It does not compile or serve the
workspace source. The [Registry](#registry) section explains how to deploy it.

**Vercel.** Add `--package vercel` to either target to make a Vercel Build
Output bundle in `.vercel/output`:

```bash
npm run build -- --target registry --package vercel
```

## Registry

A registry is a deployed catalog with a PostgreSQL database. It serves only
the records that a workspace publishes. It never reads the workspace
directly.

### Deploy a registry

1. Apply the database migrations from the workspace or a CI checkout, where the
   project config is available:

   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/handoff?schema=public" \
   npm run db:migrate
   ```

   Migrations are a controlled release step. The build, the server start, and
   the installer never run them. Run `db:migrate` again each time you upgrade
   `handoff-app`, before you deploy the new registry build.

2. Select the [database driver](#database), the [asset storage](#asset-storage),
   and the [email provider](#email). The build bakes these choices, so set them
   before you build. The defaults work without more configuration.

3. Build the registry:

   ```bash
   npm run build -- --target registry
   ```

4. Start `out/registry/server.js` with these environment variables:

   ```dotenv
   PORT=4000
   HOSTNAME=0.0.0.0
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/handoff?schema=public"
   AUTH_SECRET="replace-with-at-least-32-random-characters"
   AUTH_URL="http://localhost:4000"
   ```

   `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL` are required. The standalone
   server also reads `PORT` and `HOSTNAME`. For Vercel, build with
   `--package vercel` and set these variables in the deployment environment.

5. Open http://localhost:4000/install and create the first administrator. The
   installer examines the deployment, but it never runs migrations.

CAUTION: Complete the installation immediately after the deployment. The first
visitor can claim a registry that is not installed.

> **Recipes:** [Local registry](RECIPES.md#local-registry) ·
> [Vercel and Neon](RECIPES.md#vercel-and-neon)

### Database

PostgreSQL is the supported database. `driver` selects how the registry
connects. The default is `pg`. Use `neon` for Neon PostgreSQL:

```ts
runtime: {
  registry: {
    database: {
      url: fromEnv('DATABASE_URL'),
      driver: 'neon',
    },
  },
},
```

Both drivers use the same schema and the same `db:migrate` step.

### Asset storage

By default, the registry stores asset blobs in PostgreSQL. Each blob can be at
most 4 MB. `assetStorage.maxInlineBytes` changes this limit.

A [custom server module](#custom-server-modules) can store blobs in a
different service:

```ts
runtime: {
  registry: {
    assetStorage: {
      adapter: 'custom',
      module: './server/storage/s3.mjs',
      options: { bucket: 'handoff-assets', secretKey: fromEnv('S3_SECRET_KEY') },
    },
  },
},
```

The module default-exports a `defineAssetStorage()` adapter with these
methods:

- `put` stores a blob and returns the `storageRef` that the registry records.
- `get` returns a blob by its `storageRef`, as `{ kind: 'stream', stream }`,
  `{ kind: 'bytes', bytes }`, or `{ kind: 'redirect', url }`.
- `delete` removes a blob by its `storageRef`.
- `createUpload` is optional. It enables direct uploads.

**Upload paths.** `publish` uploads only the blobs that the registry does not
have. The active adapter decides which of two paths each blob takes. No
setting changes the path.

| Path | When | Hash check | Size limit |
| --- | --- | --- | --- |
| Through the registry | The `database` adapter, or a custom adapter without `createUpload` | The registry | The request limit of the host, about 4.5 MB on Vercel. The `database` adapter also applies `maxInlineBytes`. |
| Direct to storage | A custom adapter with `createUpload` | Storage, through the signed URL | The limit of the storage |

For a direct upload, the registry gives the CLI a signed URL, and the CLI sends
the blob to storage. The registry records the blob only after `get` finds the
stored object.

- The machine that runs `publish` must be able to connect to the storage URL.
- If a direct upload fails, `publish` stops. It does not try again through the
  registry.
- The signed URL must make storage reject bytes that do not match `hash`.
- The registry does not delete an uploaded object that it never records.

**Download paths.** The result of `get` controls how a reader receives a blob.
With `{ kind: 'redirect' }`, the registry sends the reader to storage. With
`bytes` or `stream`, the registry sends the blob itself.

**Changing the adapter.** The registry records which adapter stores each blob.
Blobs in PostgreSQL stay readable after you select a custom adapter. A publish
does not move blobs. If you change the custom adapter or its storage, copy the
stored objects first. The new adapter must find each object by the
`storageRef` that the previous adapter returned. After a change back to
`database`, the registry cannot read the blobs of the custom adapter.

> **Recipes:** [S3-compatible storage](RECIPES.md#s3-compatible-storage) ·
> [Vercel Blob](RECIPES.md#vercel-blob)

### Email

The registry sends invitation and password-reset emails when `email.from` is
set. Without it, an administrator sees each invitation link one time and sends
it manually, and password reset is not available.

```ts
runtime: {
  registry: {
    email: {
      from: 'Handoff <no-reply@example.com>',
      provider: 'smtp',
      options: { host: fromEnv('SMTP_HOST') },
    },
  },
},
```

`provider` selects the delivery service. It is required when you set `email`.

- `smtp` sends through an SMTP server, for example Amazon SES, SendGrid, or
  Microsoft 365.
- `custom` names a [custom server module](#custom-server-modules) that
  default-exports `defineEmailProvider()`. Use it for an HTTP API, for example
  Resend or Postmark.

`apiKey` and `password` must use `fromEnv()`. A profile can set a different
sender or provider. When a profile changes the provider, it replaces
`options`.

> **Recipes:** [SMTP](RECIPES.md#smtp) · [Resend](RECIPES.md#resend) ·
> [Custom email provider](RECIPES.md#custom-email-provider)

### Custom server modules

Asset storage, email, and AI connections can name a custom server module. Each
module must obey these rules:

- The path is relative to the working directory.
- The file is `.js` or `.mjs`.
- The default export is the object, or a factory that returns it.
- The module imports its define helper from `handoff-app/define`. The registry
  build stops when a module imports `handoff-app`.
- The project installs the packages that the module imports. The registry
  build copies them into the bundle.

The factory gets `options` with each `fromEnv()` value resolved at request
time.

## Connecting a workspace to a registry

A connected workspace publishes content to a registry and checks content out
from it. It needs a registry URL and an access token. You can supply them with
a [device login](#device-login) or with [environment variables](#access-token).
Both use the same kind of token. You can see and revoke tokens under
Account → Access tokens in the registry.

### Device login

Start the authorization from the workspace:

```bash
npm run login -- --url http://localhost:4000
```

In the browser, sign in to the registry, enter the device code, and approve the
CLI. The CLI saves the credential in `.handoff/cli-auth.json` for that exact
registry URL.

The CLI saves one credential for each profile. Thus a workspace can stay signed
in to several registries:

```bash
npm run login -- --profile staging --url https://staging.example.com
npm run publish -- all --profile staging
```

A login profile name is free. It needs no `handoff.config.<name>.*` file, and
`login` is the only command that accepts a new name. A profile without its own
login uses the default login. Thus one `npm run login` is enough for a
workspace with one registry.

`npm run logout` revokes and removes the login of the selected profile.
`--all` removes every saved login.

### Access token

Create a token in the registry under Account → Access tokens. To publish, the
token needs read and write access. To check out, read access is enough. Set the
token and the registry URL in `.env`:

```dotenv
HANDOFF_REGISTRY_URL=http://localhost:4000
HANDOFF_REGISTRY_ACCESS_TOKEN=hnd_...
```

These two variables are the defaults of `runtime.registryConnection`, so no
config entry is necessary. A selected profile reads `.env.<profile>` on top of
`.env`. Thus each profile can address a different registry. In CI, the job
environment supplies the same two variables.

Environment values have priority over a saved device login. Thus a CI job gives
the same result on a computer where a developer is signed in. A token works
only for the registry URL that issued it. If the environment names a different
registry than the login of the selected profile, `publish` and `checkout`
report which login they skipped and why.

A config block is necessary only to keep the URL in the repository, or to read
the values from variables with different names:

```ts
runtime: {
  registryConnection: {
    url: 'https://registry.example.com',
    accessToken: fromEnv('HANDOFF_REGISTRY_ACCESS_TOKEN'),
  },
},
```

### Publishing

Publish every kind of content in dependency order:

```bash
npm run publish -- all
```

Publish one kind:

```bash
npm run publish -- catalog
npm run publish -- pages
npm run publish -- tokens
npm run publish -- assets
```

`catalog` covers every catalog item. The declaration of each item decides if
the registry stores it as a component or as a pattern. Thus the command names
items, not component or pattern kinds.

`tokens` and `assets` run the Figma pipeline before the upload. Thus the
[Figma credentials](#figma-foundations) must be available.

Add one or more ids to publish only those entities:

```bash
npm run publish -- catalog item-id another-id
```

`--dry-run` lists the content that a real publish uploads. It does not connect
to a registry. Thus it needs no registry URL and no token. It still runs the build,
which updates the generated output on disk. `--no-build` skips the build and
publishes the existing output. Together, the two options do not change the
workspace:

```bash
npm run publish -- all --dry-run
npm run publish -- catalog --no-build
```

After a publish, reload the registry to see the published items and
foundations.

### Checkout

`checkout` writes registry content into the workspace. It takes the same
`all`, kind, id, and `--dry-run` forms as `publish`:

```bash
npm run checkout -- all
npm run checkout -- catalog item-id
npm run checkout -- all --dry-run
```

A dry-run checkout reads from the registry and lists the files that a real
checkout creates or overwrites. It writes nothing. Checkout writes declarations in the
format that `runtime.workspace.declarationFormat` sets.

> **Recipes:** [One workspace, several registries](RECIPES.md#one-workspace-several-registries) ·
> [Publish from GitHub Actions](RECIPES.md#publish-from-github-actions)

## MCP

The documentation app serves a Model Context Protocol endpoint at `/api/mcp/`.
Coding agents use it to find the pages, components, and tokens that exist. Thus
they do not invent markup and values. The endpoint uses stateless Streamable
HTTP over `POST`. There is nothing to start and no extra port.

| Target | Endpoint | Credential |
| --- | --- | --- |
| Workspace (`dev` / `start`) | `http://localhost:3000/api/mcp/` | None, as with `/api/docs/*` |
| Registry (standalone or Vercel) | `<registry url>/api/mcp/` | An access token. Read access is enough. |
| Static site | Not available | Not applicable |

Keep the trailing slash. The app sets `trailingSlash: true`, so `/api/mcp`
answers with a 308 redirect. Registry tokens come from `handoff-app login` or
from Account → Access tokens in the registry.

The documentation app shows its endpoint and a ready-made client config for
Claude Code, Cursor, and VS Code behind the plug icon in the header.

MCP is on by default. To turn it off, set `runtime.mcp: false`. The build bakes
this value. A build with MCP off answers 404 on the route, leaves the MCP SDK
out of the bundle, and shows no connect control.

> **Recipes:** [Connect a client by hand](RECIPES.md#connect-a-client-by-hand) ·
> [Turn off MCP](RECIPES.md#turn-off-mcp)

## AI assistant

The documentation app can answer questions about the design system. The
assistant reads through the same MCP tools. Thus each answer comes from the
catalog and links to the pages and components that it read. Open the assistant
from the search control in the header, or with `⌘K`.

The `ai` block turns on the assistant, and the deployment selects the
provider:

```ts
runtime: {
  ai: {
    connections: [
      {
        id: 'gateway',
        label: 'Acme LiteLLM',
        baseUrl: 'https://llm.acme.internal/v1',
        apiKey: fromEnv('LITELLM_API_KEY'),
        models: ['gpt-4o', 'claude-sonnet-4-5'],
      },
    ],
    defaultModel: 'gateway/claude-sonnet-4-5',
  },
},
```

`ai: { enabled: false }` turns off the assistant. The build bakes this flag.
A build without the assistant serves no chat route and shows no control.

Each connection uses one of these credentials:

- **Service key:** `apiKey` names a deployment key. The deployment pays for
  every reader.
- **No credential:** the endpoint needs no key, for example a local Ollama.
- **Reader key:** `credential: 'user'` asks each reader for their own key.

**The declared connections are the full surface.** A reader can add a key only
for a connection that the config declares. Thus the server never calls a URL
that a reader selected. Without a `credential: 'user'` connection, readers have
no AI setting.

Each connection uses the OpenAI-compatible `/chat/completions` API. This does
not limit the models. Ollama serves an OpenAI-compatible API at `/v1`. LiteLLM,
OpenRouter, vLLM, LM Studio, and Azure OpenAI each give access to Anthropic,
Google, and xAI models. For a provider without this API, name a
[custom server module](#custom-server-modules) that default-exports
`defineAiProvider()`, instead of `baseUrl`.

The gateway controls cost. LiteLLM and OpenRouter both apply budgets and rate
limits for each key. The assistant limits only the number of steps for one
question.

### Reader keys

A reader adds a key under Account → AI providers. The registry encrypts keys
with `HANDOFF_AI_KEY_SECRET`. It does not hash them, because the server must
send them to the provider. Set this variable to a random value of at least 32
characters. A key is write-only through the API. After a save, a read reports
only that a key exists.

Reader keys work only in registry mode. A workspace has one user, whose config
file and `.env` hold their keys. Thus a workspace supplies a key through
`apiKey`.

### Changing connections without a rebuild

The connection list is deployment data, not build shape. Thus a registry can
change it without a rebuild. `HANDOFF_AI_CONNECTIONS` holds a JSON array. The
registry reads it at request time and merges it over the built-in list by `id`.
Each entry names its key variable with `apiKeyEnv`, not the key value.

A connection in this list can use a `module` only if a connection in the config
names the same module. The build copies only those modules into the registry.

> **Recipes:** [Service key through a gateway](RECIPES.md#service-key-through-a-gateway) ·
> [Local Ollama](RECIPES.md#local-ollama) · [Reader keys](RECIPES.md#reader-keys) ·
> [Custom AI provider](RECIPES.md#custom-ai-provider) ·
> [Change connections without a rebuild](RECIPES.md#change-connections-without-a-rebuild)

## CLI reference

| Command | Description |
| --- | --- |
| `npx handoff-app init` | Create a project with the interactive wizard |
| `npm run fetch` | Fetch design tokens and assets from Figma |
| `npm run start` | Start the workspace server and the Handoff file watchers |
| `npm run dev` | Start the workspace server without the file watchers |
| `npm run build -- [--target static\|registry] [--package vercel]` | Build the static site or the registry server |
| `npm run db:migrate` | Apply the registry database migrations |
| `npm run publish -- <kind\|all> [id...]` | Publish catalog items, pages, tokens, or assets |
| `npm run checkout -- <kind\|all> [id...]` | Write published content into the workspace |
| `npm run login -- [--profile <name>] --url <url>` | Authorize the CLI through the registry device flow |
| `npm run logout -- [--profile <name>] [--all]` | Revoke and remove saved CLI credentials |
| `npx handoff-app validate:components` | Validate the catalog items |
| `npx handoff-app make:component <name>` | Create a Handlebars catalog item |
| `npx handoff-app make:page <name> [parent]` | Create a documentation page |
| `npx handoff-app scaffold` | Create catalog item stubs for fetched Figma components |
| `npx handoff-app eject:config` | Write the default config to the working directory |

Every command except `init` accepts `-c, --config`, `--profile`, `-d, --debug`,
and `-f, --force`. `publish` and `checkout` also accept `--dry-run`, and
`publish` accepts `--no-build`.

npm forwards the arguments after `--` to the CLI. To see the options of a
command, add `--help` after `--`. [docs/cli.md](docs/cli.md) lists every
command and option. [docs/api.md](docs/api.md) documents the JavaScript API and
the build hooks.

## Maintainers

[@bradmering](https://github.com/bradmering)

[@DomagojGojak](https://github.com/DomagojGojak)

[@Natko](https://github.com/Natko)

## Contributing

[Issues](https://github.com/Convertiv/handoff-app/issues/new) and pull requests
are welcome.

Handoff follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/)
Code of Conduct.

## License

[MIT](License.md) ©Convertiv
