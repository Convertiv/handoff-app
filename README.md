# Handoff - Design System Runtime

<a aria-label="NPM version" href="https://www.npmjs.com/package/handoff-app">
  <img alt="" src="https://img.shields.io/npm/v/handoff-app?style=for-the-badge&labelColor=000000">
</a>
<a aria-label="License" href="https://github.com/convertiv/handoff-app/blob/main/License.md">
  <img alt="" src="https://img.shields.io/npm/l/handoff-app?style=for-the-badge&labelColor=000000">
</a>

Design tokens, components, and patterns are turned by Handoff into working
documentation and distributable artifacts. A local workspace, a static site,
or a shared PostgreSQL-backed registry can be used.

## Runtime modes

- **Workspace** is the default. Local files are the source of truth and no
  database is required.
- **Registry** is a deployed catalog backed by PostgreSQL.
- A **connected workspace** remains in workspace mode but can publish to and
  check out from a registry.

Workspace mode is used by local projects for authoring. A separate
registry-mode application is created automatically by a registry build.

## Requirements

- Node.js 18.18 or newer; Node.js 20 LTS or newer is recommended
- npm 8 or newer
- A paid Figma account when fetching a Figma library
- PostgreSQL when running a registry

## Quick start

A project is created with the interactive wizard:

```bash
npx handoff-app init
cd my-handoff-project
```

The project name, sample content, JavaScript or TypeScript, optional Vercel
setup, and optional Figma credentials are requested by the wizard. Starter
files are created and `handoff-app` is installed locally. Generated npm scripts
are used for project operations so the pinned project version is shared by
local development and CI:

```bash
npm run fetch       # optional: fetch Figma foundations
npm run start       # local server with Handoff file watchers
npm run dev         # local development server without Handoff file watchers
npm run build       # static build by default
npm run db:migrate  # registry database migrations
npm run validate
```

## Project layout

```text
my-handoff-project/
├─ handoff.config.ts
├─ .env
├─ components/
├─ patterns/
├─ pages/
├─ exported/       # fetched tokens and assets; commit this directory
└─ out/            # build output; gitignored
```

## Catalog items

Every documented UI entry is a catalog item. Each item declares either an implementation or a composition of other items.
An implementation names its renderer. `defineCatalogItem` comes from the module for that renderer.
The declaration supplies stable identity, documentation metadata, source entries, and previews.

### React

Handoff finds the implementation file from its import, so you do not need to repeat the path.
Previews are named exports. `Preview<typeof item>` gives them the implementation's argument type.

```tsx
// components/example/Component.tsx
export type ComponentProps = {
  label: string;
};

export default function Component({ label }: ComponentProps) {
  return <div>{label}</div>;
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

The export name is the preview name. Use `name` to set a different display title.

### Handlebars

The implementation is the path to the template. Arguments are `Record<string, unknown>` by default;
an explicit argument type is supplied through `defineCatalogItem<BadgeArgs>`.

```ts
// components/badge/badge.handoff.ts
import { defineCatalogItem, type Preview } from 'handoff-app/handlebars';

const item = defineCatalogItem({
  id: 'badge',
  name: 'Badge',
  implementation: './Badge.hbs',
});

export default item;

type BadgePreview = Preview<typeof item>;

export const Primary = {
  args: { variant: 'primary', children: 'New' },
} satisfies BadgePreview;
```

### CSF

CSF is a source format. A story file uses the renderer from the module that declares it. A React item references an existing CSF file with `fromCSF`.
The CSF file stays unchanged and defines its previews through named exports. Each story's `args` merge with and override `meta.args`.
Handoff preserves story names, `argTypes`, and `render` functions.
It finds the React component through `meta.component`, then documents and publishes it with the story file.

```ts
// components/card/card.handoff.ts
import { defineCatalogItem, fromCSF } from 'handoff-app/react';

export default defineCatalogItem({
  id: 'card',
  name: 'Card',
  implementation: fromCSF('./Card.stories.tsx'),
});
```

`Meta` and `StoryObj` are exported from `handoff-app/react`, so a story file type-checks without a
Storybook dependency. A project that already has Storybook keeps using its own types.

```tsx
// components/card/Card.stories.tsx
import { type Meta, type StoryObj } from 'handoff-app/react';
import Card from './Card';

const meta = { component: Card } satisfies Meta<typeof Card>;
export default meta;

export const Primary: StoryObj<typeof meta> = {
  args: { title: 'Example' },
};
```

A CSF preview is rendered on the server and is not hydrated. A direct React implementation is
hydrated in the browser.

### Compositions

A composition references other items by stable id. A named preview can be selected and its arguments
can be overridden by each reference. A composition needs no renderer, so it is declared with
`defineCatalogItem` from `handoff-app/pattern`.

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

An item declares `implementation` or `composition`, never both. Terms such as atom, element, and
block stay optional classification metadata on `type` and `categories`.


### Registration

Catalog directories are registered in one place. A path is either an item directory or a collection
directory whose subdirectories are each treated as an item.

```ts
// handoff.config.ts
import { defineConfig } from 'handoff-app';

export default defineConfig({
  catalog: {
    include: ['components', 'patterns'],
  },
  runtime: {
    workspace: {
      declarationFormat: 'ts',
    },
  },
});
```

### Upgrade from version 1.x.x to version 2.x.x

See the [version 1.x.x to version 2.x.x migration guide](UPGRADE.md#version-1xx-to-version-2xx)
for breaking changes, migration steps, and upgrade verification.

Custom documentation pages are Markdown files under `pages/`. Their relative
paths become their routes and registry IDs.

## Figma foundations

Figma integration is optional. When Figma credentials are entered during
`init`, they are written to `.env` by the wizard and the fetch command can be
run directly.

When that step is skipped or the Figma source must be changed, these values can
be added or updated in `.env`:

```bash
HANDOFF_FIGMA_PROJECT_ID=figma-file-id
HANDOFF_DEV_ACCESS_TOKEN=figma-personal-access-token
```

The `file_content:read` and `library_content:read` scopes must be granted to the
personal access token. The configured library is fetched with:

```bash
npm run fetch
```

After design changes, the Figma library should be republished and the command
should be run again so the latest foundations are pulled.

Generated tokens, CSS, Sass, and available assets are written below
`exported/<projectId>`. The `exported/` directory should be committed so the
same inputs are used by local and CI builds. A successful fetch can be verified
by checking for generated token data such as `exported/<projectId>/tokens.json`;
an empty foundation route does not prove that the fetch succeeded.

## Workspace

Components, patterns, pages, styles, and configuration are authored as local
workspace files. For day-to-day authoring, the documentation server and file
watchers are started with:

```bash
npm run start
```

Changes are rebuilt and reflected in the documentation while the command is
running. When Handoff file watchers are not required, the development server
can be started with `npm run dev` instead.

The following should be visible at http://localhost:3000:

- the app reports `Workspace` as the active runtime mode;
- components appear in the component list;
- component detail pages render every configured preview;
- patterns render their referenced components; and
- foundation pages contain the fetched values.

## Build outputs

A static documentation site is built with:

```bash
npm run build
```

Static output is written below `out/<projectId>` and can be served by any
static file server or CDN.

A standalone registry application is built with:

```bash
npm run build -- --target registry
```

The generated application is automatically configured for registry mode by the
command. The database-backed Next.js bundle is written to `out/registry`, and
workspace source is not compiled or served. A Vercel Build Output bundle can be
produced for either target by adding `--package vercel`.

## Registry setup

### 1. Database migrations

Migrations are run from the source workspace or CI checkout, where the project
dependency and configuration are available:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/handoff?schema=public" \
npm run db:migrate
```

Migrations are a controlled release step and are separate from the build,
server startup, and browser installer.

### 2. Registry runtime

The generated registry bundle uses these environment variables:

```dotenv
PORT=4000
HOSTNAME=0.0.0.0
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/handoff?schema=public"
AUTH_SECRET="replace-with-at-least-32-random-characters"
AUTH_URL="http://localhost:4000"
```

`DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL` are required. The standalone
server also reads `PORT` and `HOSTNAME`. The generated entrypoint is
`out/registry/server.js`; how it is started and hosted depends on the deployment
environment.

### Vercel and Neon

Vercel packaging and the Neon PostgreSQL driver are supported independently.
Either integration can be used without the other.

#### Vercel packaging

A registry bundle that follows the Vercel Build Output API is produced with:

```bash
npm run build -- --target registry --package vercel
```

The generated deployment output is written to `.vercel/output`. The registry
runtime variables listed above are supplied through the deployment environment.

#### Neon PostgreSQL

The Neon connection driver is selected in `handoff.config.ts`:

```ts
runtime: {
  registry: {
    databaseUrlEnv: 'DATABASE_URL',
    database: {
      driver: 'neon',
    },
  },
},
```

A Neon PostgreSQL connection string is supplied through `DATABASE_URL`. The
same explicit database migration step is required before deployment.

#### Optional Vercel Blob storage

Registry assets are stored in PostgreSQL by default. Vercel Blob can be selected
when external asset storage is required:

```ts
runtime: {
  registry: {
    assetStorage: {
      adapter: 'vercel-blob',
    },
  },
},
```

The associated `BLOB_READ_WRITE_TOKEN` is supplied through the deployment
environment.

### 3. Installation

The installer is opened at http://localhost:4000/install, where the first
administrator is created. The deployment is verified by the installer, but
migrations are never run by it.

An uninstalled registry can be claimed by the first visitor. A new deployment
should not be left unattended before installation is complete.

### 4. Workspace authorization

CLI authorization is started from the source workspace with:

```bash
npm run login -- --url http://localhost:4000
```

Registry sign-in, entry of the displayed device code, and CLI approval are
completed in the browser. The revocable credential is saved in
`.handoff/cli-auth.json` for that exact registry URL.

### 5. Content publishing

Every kind in the workspace is published in dependency order with:

```bash
npm run publish -- all
```

A single kind is published on its own:

```bash
npm run publish -- catalog
npm run publish -- pages
npm run publish -- tokens
npm run publish -- assets
```

`catalog` covers every catalog item. An item is stored as a component or as a
pattern, and its declaration decides which. The command names items and never a
kind.

Publishing tokens or assets runs the Figma data pipeline before upload, so the
documented Figma credentials must be available.

One or more IDs can be appended to narrow a publish to those entities:

```bash
npm run publish -- catalog item-id another-id
```

`--dry-run` reports what would be uploaded and contacts no registry at all, so
it needs neither a registry URL nor a token. It still runs the build, which
refreshes generated output on disk; `--no-build` skips the build and publishes
the existing output, and the two combine to leave the workspace untouched:

```bash
npm run publish -- all --dry-run
npm run publish -- catalog --no-build
```

`checkout` takes the same `all`, multi-ID, and `--dry-run` forms. A dry-run
checkout reads from the registry, lists the files it would create or overwrite,
and writes nothing.

After the registry is reloaded, the published catalog items and foundations are
visible. Published database records are read by registry pages; the local
workspace is never read directly.

For CI, a registry connection and user-issued token are configured:

```ts
runtime: {
  registryConnection: {
    url: 'https://registry.example.com',
    accessTokenEnv: 'HANDOFF_REGISTRY_ACCESS_TOKEN',
  },
},
```

## MCP

The documentation app serves a Model Context Protocol endpoint at `/api/mcp/`, so
coding agents can look up the pages, components and tokens that already exist instead
of inventing markup and values. It is stateless Streamable HTTP over `POST`;
there is nothing to start and no extra port. Keep the trailing slash: the app
sets `trailingSlash: true`, so `/api/mcp` answers with a 308 redirect.

| Target | Endpoint | Credential |
| --- | --- | --- |
| Workspace (`dev` / `start`) | `http://localhost:3000/api/mcp/` | none, as with `/api/docs/*` |
| Registry (standalone or Vercel) | `<registry url>/api/mcp/` | an access token, read-only is enough |
| Static export | not available, a static site has no API routes | n/a |

Registry tokens come from `handoff-app login` or Account settings in the
registry itself, and are the same credentials the rest of the registry API takes.

The endpoint is served unless a project turns it off:

```ts
runtime: {
  mcp: false,
},
```

Like `runtime.mode`, this is config-only and baked at build time, so changing it
in a deployed registry means a rebuild. A disabled build answers 404 on the route,
drops the MCP SDK from the packaged bundle, and shows no connect affordance at all
rather than one that fails.

The documentation app carries its own endpoint and a ready-made client config
for Claude Code, Cursor and VS Code behind the plug icon in the header. By hand:

```json
{
  "mcpServers": {
    "handoff": {
      "type": "http",
      "url": "https://registry.example.com/api/mcp/",
      "headers": { "Authorization": "Bearer hnd_..." }
    }
  }
}
```

## Configuration

Configuration is read from `handoff.config.ts`, `.js`, `.cjs`, or `.json`, in
that order. `defineConfig` provides typed authoring. A partial `runtime` block
is deep-merged with defaults.

Useful environment variables:

| Variable | Purpose |
| --- | --- |
| `HANDOFF_FIGMA_PROJECT_ID` | Figma file ID used by `fetch` |
| `HANDOFF_DEV_ACCESS_TOKEN` | Figma personal access token used by `fetch` |
| `HANDOFF_REGISTRY_URL` | Connected workspace registry URL |
| `HANDOFF_REGISTRY_ACCESS_TOKEN` | User-issued CI token |
| `HANDOFF_SYNC_SECRET` | Optional deployment-wide registry credential |
| `DATABASE_URL` | Registry PostgreSQL connection string |
| `AUTH_SECRET` | Registry session-signing secret, at least 32 characters |
| `AUTH_URL` | Canonical public registry URL |
| `PORT` | Standalone registry server port |
| `HOSTNAME` | Standalone registry bind hostname |
| `BLOB_READ_WRITE_TOKEN` | Credential for the Vercel Blob asset adapter |
| `HANDOFF_OUTPUT_DIR` | Override the fetched output directory |
| `HANDOFF_SITES_DIR` | Override the build output directory |
| `HANDOFF_APP_PORT` | Workspace documentation server port |
| `HANDOFF_WEBSOCKET_PORT` | Workspace live-reload server port |

Registry assets are stored in PostgreSQL by default with a 4 MB per-blob limit.
Vercel Blob or a custom adapter can be selected through
`runtime.registry.assetStorage`. The `pg` or `neon` connection driver can be
selected through `runtime.registry.database.driver`; PostgreSQL is used by
both.

## CLI reference

| Command | Description |
| --- | --- |
| `npx handoff-app init` | A workspace is scaffolded with the interactive wizard |
| `npm run fetch` | Design tokens and assets are fetched from Figma |
| `npm run start` | The workspace server and Handoff file watchers are started |
| `npm run dev` | The workspace development server is started |
| `npm run build -- [--target static\|registry]` | The static site or standalone registry bundle is built |
| `npm run db:migrate` | Registry database migrations are applied |
| `npm run validate` | Configured components are validated |
| `npm run publish -- <kind\|all> [id...]` | Catalog items, pages, tokens, or assets are published |
| `npm run checkout -- <kind\|all> [id...]` | Published content is pulled into a workspace |
| `npm run login -- --url <url>` | The CLI is authorized through the registry device flow |
| `npm run logout -- [--url <url>]` | A saved CLI credential is revoked and removed |

`publish` and `checkout` additionally accept `--dry-run`, and `publish` accepts `--no-build`.

Arguments after `--` are forwarded to the local CLI. Exact options can be shown
by adding `--help` after the separator. Advanced configuration and hooks are
documented in [docs/api.md](docs/api.md).

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
