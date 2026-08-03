# Handoff - Design System Runtime

<a aria-label="NPM version" href="https://www.npmjs.com/package/handoff-app">
  <img alt="" src="https://img.shields.io/npm/v/handoff-app?style=for-the-badge&labelColor=000000">
</a>
<a aria-label="License" href="https://github.com/convertiv/handoff-app/blob/main/License.md">
  <img alt="" src="https://img.shields.io/npm/l/handoff-app?style=for-the-badge&labelColor=000000">
</a>

Handoff is a design system runtime. It turns the source of truth for your design
system, the tokens, components, and patterns, into dev-ready artifacts and living
documentation, and serves both through one consistent runtime whether you are
authoring locally or running a shared, deployed catalog.

## Table of contents

* [What is Handoff?](#what-is-handoff)
* [How it works](#how-it-works)
* [Requirements](#requirements)
* [Quick start](#quick-start)
* [Project layout](#project-layout)
* [Authoring components, patterns, and pages](#authoring-components-patterns-and-pages)
* [Fetching design tokens](#fetching-design-tokens)
* [Running locally](#running-locally)
* [Building artifacts](#building-artifacts)
  * [Static site (default)](#static-site-default)
  * [Registry app](#registry-app)
  * [Deploying](#deploying)
* [Publishing and checkout](#publishing-and-checkout)
* [Configuration](#configuration)
  * [The runtime block](#the-runtime-block)
  * [Environment variables](#environment-variables)
  * [Registry installation and access](#registry-installation-and-access)
  * [Hooks](#hooks)
* [CLI reference](#cli-reference)
* [Maintainers](#maintainers)
* [Contributing](#contributing)
* [License](#license)

## What is Handoff?

Handoff is an open source design system runtime that closes the gap between
design and development. By automating the delivery of your design system, it
helps eliminate the bottlenecks between the two.

It brings a few pieces together:

* **Token extraction.** Pull standardized foundations from your design source and
  store them as JSON. Figma is supported out of the box through the Figma REST
  API.
* **Transformation pipeline.** Produce SCSS and CSS by default, with optional
  Style Dictionary or custom transformer output.
* **Documentation runtime.** Render live, working previews of your components,
  tokens, and styles, served through a stable docs read API.
* **Delivery tooling.** Build and ship the deliverables, either as a static site
  or as a deployed, database-backed catalog.

Use the global `entries.scss` and `entries.js` files to load a framework or your
own frontend code into previews. For example, a Bootstrap project can import
[Bootstrap 5](https://getbootstrap.com/) from its Sass and JavaScript entries.

You install `handoff-app` as a project-local dependency and run its commands in
your project's context, so every project pins its own toolchain version.

## How it works

Handoff has two runtime modes. Mode is resolved solely from `runtime.mode` in
your config and defaults to `workspace`. It is never inferred from environment
variables or token presence, so setting `DATABASE_URL` can never silently flip
your app into another mode. The app chrome shows a `Workspace` or `Registry`
badge so the active mode is always clear.

* **Workspace mode (default).** Your local filesystem is the source of truth.
  You author components, patterns, and tokens locally, preview them with a dev
  server, and build a static documentation snapshot. Local authoring stays fast
  and self-contained, with no database or registry required.
* **Registry mode.** A deployed, dynamic Next.js app backed by PostgreSQL serves
  a shared catalog from published records and packaged default pages. The
  registry never compiles or materializes workspace source.

A **connected workspace** is workspace mode plus a registry connection. It still
renders only local files and still reads as `Workspace`, but it can publish and
check out components, patterns, pages, token sets, and asset collections.

Under the hood, documentation in every mode is consumed through one stable docs
read API and one canonical artifact URL scheme (`/api/docs/artifacts/{path}`),
so the same UI serves workspace, static, and registry backings without knowing
which store is behind it.

## Requirements

* Node 18.18 or newer. Node 20 LTS or newer is recommended.
* npm 8+
* A paid Figma account, if you fetch tokens from a Figma library
* PostgreSQL (or a Postgres-compatible service such as Neon) for registry mode

## Quick start

Scaffold a new project with the interactive wizard:

```bash
npx handoff-app init
```

The wizard asks for a project name, whether to include sample components, your
preferred language, optional Vercel deployment settings, and optional Figma
credentials. It then creates the project, writes the starter files, and installs
the project-local dependencies.

```bash
cd my-handoff-project
npm run fetch    # pull design tokens after adding Figma credentials (optional)
npm run start    # author locally with live preview at http://localhost:3000
```

The generated `package.json` wires up the common scripts:

```json
{
  "scripts": {
    "start": "handoff-app start",
    "dev": "handoff-app dev",
    "fetch": "handoff-app fetch",
    "build": "handoff-app build",
    "db:migrate": "handoff-app db:migrate"
  }
}
```

Any other command can be run with `npx handoff-app <command>` or added as a
script of your own.

## Project layout

A typical workspace project looks like this:

```
my-handoff-project/
├─ handoff.config.ts        # project + runtime configuration
├─ .env                     # Figma credentials and other secrets
├─ components/
│  └─ button/
│     ├─ Button.tsx         # component implementation
│     └─ button.handoff.ts  # component declaration
├─ patterns/                # multi-component compositions
│  └─ hero/
│     └─ hero.handoff.ts
├─ pages/                   # custom Markdown documentation and navigation
│  └─ guides/
│     └─ getting-started.md
├─ sass/                    # optional global SCSS entry
├─ js/                      # optional global JS entry
├─ public/                  # optional static assets
├─ exported/                # fetched tokens and assets; commit this directory
└─ out/                     # build output (gitignored)
```

A working Handoff project can mix global Sass and JavaScript entry points,
React, Handlebars, and CSF components, composed patterns, nested Markdown pages,
and fetched files under `exported/<projectId>`.

## Authoring components, patterns, and pages

A component is a directory with an implementation file and a declaration. The
declaration is discovered as `*.handoff.{ts,js,cjs,json}`. The older
`{dirname}.{js,cjs,json}` form also works. List individual directories or a
parent collection such as `components` under `entries.components`.

Declarations are written with the typed helpers exported from `handoff-app`:

```ts
import { defineReactComponent } from 'handoff-app';
import Button from './Button';

export default defineReactComponent(Button, {
  id: 'button',
  name: 'Button',
  description: 'Interactive button used for primary and secondary actions.',
  group: 'Atomic Elements',
  entries: {
    component: './Button.tsx',
  },
  previews: {
    primary: {
      title: 'Primary',
      args: { type: 'primary', children: 'Click me!' },
    },
  },
});
```

The available helpers are:

* `defineReactComponent` for React components
* `defineHandlebarsComponent` for Handlebars templates
* `defineCsfComponent` for Component Story Format stories
* `defineComponent` for a generic, renderer-agnostic declaration
* `definePattern` for compositions that reference several components by `id`

Every component and pattern has a stable `id` (explicit `id` field, otherwise the
directory name). The display `name`/`title` is independent of the `id`, so you
can rename freely without breaking references. Identity is matched by `id`
during publish and checkout.

Patterns use `definePattern` and compose component IDs. Each reference can select
a named preview or supply its own arguments. Custom documentation lives as
Markdown under `pages/`. A page's relative file path becomes both its route and
registry ID, so `pages/guides/getting-started.md` is served and transferred as
`guides/getting-started`.

## Fetching design tokens

Handoff fetches tokens from Figma out of the box. Set your Figma credentials in
`.env`:

```bash
HANDOFF_FIGMA_PROJECT_ID=your-figma-file-id
HANDOFF_DEV_ACCESS_TOKEN=your-figma-personal-access-token
```

Then pull the latest foundations and component data:

```bash
npm run fetch
```

The fetch output is stored under `exported/<projectId>`. It includes
`tokens.json`, generated CSS and Sass, and available icon or logo archives. Keep
this directory in version control so local and CI builds use the same source
data.

To create a personal access token in Figma, open the account menu from the file
browser, select `Settings`, open `Security`, and generate a token under
`Personal access tokens`. Grant `file_content:read` and `library_content:read`,
then copy the token when Figma displays it. Republish your Figma library after
design changes and run `fetch` again to pick them up.

## Running locally

Both commands run a workspace-first local server with live preview.

```bash
handoff-app dev     # development server with the live docs read API
handoff-app start   # dev server plus file watchers that rebuild on change
```

`start` is the day-to-day authoring loop: edit a component, save, and the
preview updates. The site boots at http://localhost:3000 by default.

## Building artifacts

`handoff-app build` accepts two independent flags. `--target` decides *what* is
produced. The target, not `NODE_ENV`, drives this. The optional `--package`
decides *how* that target is packaged for deployment.

### Static site (default)

```bash
handoff-app build                  # static target (default)
handoff-app build --target static  # explicit, identical output
```

The static target builds workspace components and patterns, includes local
pages, tokens, and assets, materializes the docs read model into route-shaped
static files, and exports to `out/<projectId>` (respecting
`sitesOutputDirectory`). The output renders list, detail, preview, and inspect
pages with no live server, so any static file server or CDN can serve it without
host-specific rewrites.

The build fails clearly if a required artifact referenced by generated HTML
cannot be materialized, and it fails if the runtime is registry-only (there is
no local workspace to export).

### Registry app

```bash
handoff-app build --target registry
```

The registry target packages a deployable, dynamic Next.js app to
`<sitesOutputDirectory>/registry` (default `out/registry`) as a Next.js
standalone bundle. It never builds or bundles workspace source and has no
workspace-source runtime dependency. It serves the docs read API and the
registry API from the database and published artifacts.

The bundle is self-hostable on a Node server, VPS, or container. Supply the
database connection, a session secret of at least 32 characters, and the public
registry URL at deploy time:

```bash
DATABASE_URL="postgres://..." \
AUTH_SECRET="replace-with-a-long-random-value" \
AUTH_URL="https://registry.example.com" \
node out/registry/server.js
```

A generated `README.md` next to the bundle documents the required env vars and
how to run it. Apply database migrations from the CLI as a controlled release
step (e.g. in CI/CD) before deploying:

```bash
handoff-app db:migrate
```

`db:migrate` reads your project config and database environment variables, applies the
package-owned migration set, and runs independently of `build`. PostgreSQL is
the supported database; `runtime.registry.database.driver` selects the
connection driver (`pg` or `neon`), not the database engine. Both drivers ship
with the package.

Registry assets are stored in PostgreSQL by default, with a 4 MB limit per
blob. Larger deployments can use the built-in Vercel Blob adapter or a custom
storage adapter through `runtime.registry.assetStorage`.

### Deploying

* **Static** produces plain files under `out/<projectId>`. Serve them with any
  static file server or CDN. Commit `exported/` so a clean checkout has token
  data to build from.
* **Registry** produces a self-contained Node bundle under `out/registry`. Run it
  on any Node host with `node out/registry/server.js` and configure
  `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL` in the environment.

The optional `--package` flag repackages a target without changing what it
builds:

| `--package` | Output |
| --- | --- |
| omitted (default) | `out/<projectId>` (static) or the `out/registry` Node bundle (registry) |
| `vercel` | `.vercel/output`, a Vercel Build Output API bundle |

`handoff-app init` can scaffold a `vercel.json` that runs a packaged build; edit
its `buildCommand` to change the target.

## Publishing and checkout

For interactive use, authorize the workspace with the browser device flow:

```bash
handoff-app login --url https://registry.example.com
```

The saved login supplies the registry URL and credential to `publish` and
`checkout`. For CI or another headless environment, add a `registryConnection`
block and provide a user-issued access token through an environment variable:

```ts
runtime: {
  mode: 'workspace',
  registryConnection: {
    url: 'https://registry.example.com',
    accessTokenEnv: 'HANDOFF_REGISTRY_ACCESS_TOKEN',
  },
},
```

```bash
# .env
HANDOFF_REGISTRY_ACCESS_TOKEN=your-registry-token
```

Then push and pull one entity by ID, or omit the ID to process every entity of
that kind:

```bash
handoff-app publish components button    # build locally, upload that entity's package
handoff-app checkout patterns hero       # pull a registry entity into this workspace
handoff-app publish pages                # publish every custom Markdown page
handoff-app checkout tokens foundation/colors
```

`publish` builds the selected content before upload. Components and patterns
include normalized metadata, referenced source files, rendered docs artifacts,
shared preview assets, and build metadata. Pages upload their Markdown source.
Tokens and assets upload their generated sets or collections. Declaration files
remain local to the workspace.

`checkout` restores the standard workspace layout. It synthesizes component and
pattern declarations in `runtime.workspace.declarationFormat`, which defaults to
`js`, and restores pages, tokens, and assets to their normal locations.
Overwriting local files requires `--force` or interactive confirmation.

## Configuration

Project configuration lives in `handoff.config.{ts,js,cjs,json}` and is resolved
in that order. Use `defineConfig` for typed authoring and camelCase aliases.
Plain object exports remain supported.

```ts
import { defineConfig } from 'handoff-app';

export default defineConfig({
  entries: {
    scss: './sass/main.scss',
    js: './js/main.js',
    components: ['components/button', 'components/badge'],
    patterns: ['patterns'],
  },
});
```

### The runtime block

The `runtime` block selects the mode and carries mode-specific settings. It is
optional and deep-merged into the defaults, so a partial block never wipes them.

```ts
runtime: {
  // Sole determinant of runtime mode. Defaults to 'workspace'.
  mode: 'workspace', // 'workspace' | 'registry'

  workspace: {
    // Format for newly generated / checkout-synthesized declarations.
    declarationFormat: 'ts', // 'ts' | 'js' | 'cjs' | 'json'
  },

  // Connect a workspace to a remote registry (publish/checkout).
  registryConnection: {
    url: 'https://registry.example.com',
    accessTokenEnv: 'HANDOFF_REGISTRY_ACCESS_TOKEN',
  },

  // Registry deployment settings (build --target registry, db:migrate).
  registry: {
    databaseUrlEnv: 'DATABASE_URL',
    database: { driver: 'pg' }, // connection driver: 'pg' | 'neon' (PostgreSQL only)
    assetStorage: {
      adapter: 'database', // 'database' | 'vercel-blob' | 'custom'
      maxInlineBytes: 4194304,
    },
  },
},
```

Registry secrets are referenced by environment-variable name, never written as
values, and are redacted from API responses.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `HANDOFF_FIGMA_PROJECT_ID` | Figma file ID used by `fetch` |
| `HANDOFF_DEV_ACCESS_TOKEN` | Figma personal access token used by `fetch` |
| `HANDOFF_REGISTRY_URL` | Default env var for a connected workspace's registry URL |
| `HANDOFF_REGISTRY_ACCESS_TOKEN` | User-issued CI token for publish/checkout |
| `DATABASE_URL` | Registry database connection string (name is configurable) |
| `AUTH_SECRET` | Long random secret used to sign registry browser sessions |
| `AUTH_URL` | Canonical public registry URL, including its base path |
| `RESEND_API_KEY` | Optional Resend API key for invitations and password resets |
| `AUTH_FROM_EMAIL` | Optional verified sender used with Resend |
| `BLOB_READ_WRITE_TOKEN` | Default credential for the Vercel Blob asset adapter |
| `HANDOFF_OUTPUT_DIR` | Override the fetched output directory (`exported`) |
| `HANDOFF_SITES_DIR` | Override the build output directory (`out`) |
| `HANDOFF_APP_PORT` | Local documentation server port (`3000`) |
| `HANDOFF_WEBSOCKET_PORT` | Local reload server port (`3001`) |
| `HANDOFF_LOG_LEVEL` | Logging level: `debug`, `info`, `warn`, `error`, or `silent` |

### Registry installation and access

Database migrations remain an explicit deployment step. Configure the
environment, run `handoff-app db:migrate`, deploy, and immediately open
`/install` to create the first administrator. The installer validates the
deployment but never changes the schema.

The first visitor can claim an uninstalled registry. Do not leave a new
deployment unattended before installation is complete.

Administrators can invite users, manage roles, and deactivate accounts. Members
receive read access for browsing and checkout, while administrators can also
publish. If Resend is not configured, the registry shows invitation links once
for manual delivery.

`handoff-app login` stores a revocable credential in
`.handoff/cli-auth.json` and only uses it for the exact registry URL that issued
it. For CI, create a scoped token in Account settings and expose it through
`runtime.registryConnection.accessTokenEnv`. The former
`HANDOFF_REGISTRY_API_TOKEN` server secret is no longer accepted.

### Hooks

Pipeline customization is done in your config under `hooks` (camelCase names such
as `validateComponent`, `jsBuildConfig`, `registerHandlebarsHelpers`). For
example, `registerHandlebarsHelpers` runs after Handoff registers the built-in
`field` and `eq` helpers, so you can register your own helpers for `.hbs`
preview templates.

See [docs/api.md](docs/api.md#hooks) for hook arguments and examples.

## CLI reference

| Command | Description |
| --- | --- |
| `init` | Scaffold a new workspace project with the interactive wizard |
| `fetch` | Fetch design tokens from Figma |
| `scaffold` | Scaffold component stubs from fetched Figma components |
| `dev` | Start the local dev server with the live docs read API |
| `start` | Start the dev server with file watchers for live authoring |
| `build [--target static\|registry] [--package standalone\|vercel]` | Build the static site (default) or registry app; `--package vercel` emits a Vercel Build Output bundle |
| `build:app` | Alias for `build --target static` |
| `build:components [component]` | Build components without building the full app |
| `publish <components\|patterns\|pages\|tokens\|assets> [id]` | Build and publish entities to the connected registry (all of the kind, or one by id) |
| `checkout <components\|patterns\|pages\|tokens\|assets> [id]` | Pull entities from the connected registry into this workspace |
| `login --url <registry-url>` | Authorize this workspace through the registry device flow |
| `logout [--url <registry-url>]` | Revoke and remove the saved workspace credential |
| `db:migrate` | Run registry database migrations (Drizzle / PostgreSQL) |
| `make:component <name>` | Scaffold a new component |
| `make:page <name> [parent]` | Scaffold a documentation page |
| `make:template <component> [state]` | Scaffold a preview template |
| `eject:config` | Eject the default config to the project |
| `eject:pages` | Eject the default documentation pages |
| `eject:theme` | Eject the default theme |
| `validate:components` | Run component validation |

Global flags: `-c, --config <file>`, `-d, --debug`, `-f, --force`,
`-h, --help`, `-v, --version`. Run `handoff-app <command> --help` for the exact
options in your installed version.

## Maintainers

[@bradmering](https://github.com/bradmering)

[@DomagojGojak](https://github.com/DomagojGojak)

[@Natko](https://github.com/Natko)

## Contributing

Feel free to dive in. [Open an issue](https://github.com/Convertiv/handoff-app/issues/new)
or submit a PR.

Handoff follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/)
Code of Conduct.

## License

[MIT](License.md) ©Convertiv
