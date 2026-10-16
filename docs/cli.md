# Handoff CLI

The `handoff-app` CLI fetches Figma foundations, builds and serves the
documentation, and transfers content between a workspace and a registry. The
[README](../README.md) explains the concepts and the configuration. This page
lists every command and option.

## Run the CLI

`init` installs `handoff-app` in the project and adds npm scripts for the
common commands. Use the npm scripts, so that local development and CI use the
project version:

```bash
npm run build -- --target registry
```

npm forwards the arguments after `--` to the CLI. For a command without an npm
script, use `npx`:

```bash
npx handoff-app validate:components
```

Show the help of the CLI or of one command:

```bash
npx handoff-app --help
npx handoff-app publish --help
```

Each command runs against the working directory. The working directory is the
directory that holds `handoff.config.ts`. It is the current directory, or the
directory that `HANDOFF_WORKING_PATH` sets.

## Shared options

Every command except `init` accepts these options:

| Option | Description |
| --- | --- |
| `-c, --config <file>` | Load this config file, relative to the working directory, instead of `handoff.config.*` |
| `--profile <name>` | Merge `handoff.config.<name>.*` onto the base config, and use the registry login of this profile. Has priority over `HANDOFF_PROFILE`. |
| `-d, --debug` | Show debug logs |
| `-f, --force` | Force the action. The effect depends on the command. |
| `--help` | Show the help of the command |

`handoff-app --version` shows the CLI version.

`HANDOFF_LOG_LEVEL` (`debug`, `info`, `warn`, `error`, or `silent`) and
`HANDOFF_LOG_SCOPES` (`handoff`, `vite`, `next`) control the log output of
every command. The README lists all
[environment variables](../README.md#environment-variables).

## Project

### init

```bash
npx handoff-app init
```

Creates a project with an interactive wizard. The wizard asks for the project
name, sample content, JavaScript or TypeScript, an optional Vercel setup, and
optional Figma credentials. It installs `handoff-app` and adds these npm
scripts: `start`, `dev`, `fetch`, `build`, `login`, `logout`, `publish`,
`checkout`, and `db:migrate`.

### fetch

```bash
handoff-app fetch
```

Fetches tokens and assets from the Figma file and writes them to `exported/`.
It reads `HANDOFF_FIGMA_PROJECT_ID` and `HANDOFF_DEV_ACCESS_TOKEN`. If a value
is empty, `fetch` asks for it in the terminal. Without a terminal, `fetch`
stops with an error that names the missing variable.

### start

```bash
handoff-app start
```

Starts the workspace documentation server and the Handoff file watchers. While
the command runs, Handoff rebuilds changed files and updates the
documentation.

### dev

```bash
handoff-app dev
```

Starts the workspace documentation server without the Handoff file watchers.

### build

```bash
handoff-app build [--target static|registry] [--package standalone|vercel] [--skip-components]
```

Builds the documentation.

| Option | Description |
| --- | --- |
| `--target static` | Default. Builds a static site in `out/static`. |
| `--target registry` | Builds a standalone registry server in `out/registry`. The application is always in registry mode. |
| `--package vercel` | Writes a Vercel Build Output bundle to `.vercel/output` for the selected target |
| `--package standalone` | Writes the default output of the target |
| `--skip-components` | Builds the application without a component build first |
| `-f, --force` | Builds every component again, and ignores the build cache |

`--package` never changes the target.

### build:app

```bash
handoff-app build:app [--skip-components]
```

Builds the static site. It is the same as `build --target static`.

### build:components

```bash
handoff-app build:components [component]
```

Builds the catalog items without the documentation application. A name builds
only that item.

### validate:components

```bash
handoff-app validate:components [--skip-build]
```

Validates the catalog items. `--skip-build` validates the existing build
output without a build first.

## Content

### make:component

```bash
handoff-app make:component <name>
```

Creates a Handlebars catalog item: a template, a CommonJS declaration, and,
if you select them, a JavaScript file and a Sass file. The item goes into the
first directory in `catalog.include`, or into `components/`. If that directory
is not registered, Handoff adds it to `catalog.include`. The name can contain
letters, numbers, hyphens, and underscores. `--force` overwrites an existing
template.

### make:page

```bash
handoff-app make:page <name> [parent]
```

Creates a Markdown page in `pages/`, or in `pages/<parent>/`. If a default page
has the same name, the new page starts with its content. `--force` overwrites
an existing page.

### scaffold

```bash
handoff-app scaffold
```

Creates catalog item stubs for the components in the fetched Figma data. The
command asks which components to create and how.

### eject:config

```bash
handoff-app eject:config
```

Writes the default config to the working directory. The command asks for
TypeScript or JavaScript. `--force` overwrites an existing config file.

### eject:pages

```bash
handoff-app eject:pages
```

Copies the default documentation pages to `pages/`, so that you can change
them. `--force` adds the default pages that you did not change.

### eject:theme

```bash
handoff-app eject:theme
```

Copies the Sass file of the selected theme to `theme/default.scss`, so that
you can change it.

## Registry

### db:migrate

```bash
DATABASE_URL="postgresql://…" handoff-app db:migrate
```

Applies the registry database migrations. The command reads the project config
and the database variables, and uses the same database driver as the registry
build. Run it before the first deployment and before each upgrade. The build,
the server start, and the installer never run migrations.

### login

```bash
handoff-app login [--url <registry-url>] [--profile <name>] [--no-browser]
```

Authorizes the CLI through the device flow of the registry. The CLI saves the
token in `.handoff/cli-auth.json`, under the selected profile.

| Option | Description |
| --- | --- |
| `--url <registry-url>` | Registry URL, with its base path when the registry has one. Without it, the CLI uses the configured registry URL. |
| `--profile <name>` | Saves the login under this profile. The profile needs no config file. |
| `--no-browser` | Shows the approval URL, but does not open the browser. `HANDOFF_LOGIN_NO_BROWSER=true` does the same. |

### logout

```bash
handoff-app logout [--profile <name>] [--url <registry-url>] [--all]
```

Revokes the saved token when possible. Then it removes the saved login of the
selected profile.

| Option | Description |
| --- | --- |
| `--url <registry-url>` | Revokes the login only if it belongs to this exact registry URL |
| `--all` | Revokes and removes the logins of every profile |

### publish

```bash
handoff-app publish <catalog|pages|tokens|assets|all> [id...] [--dry-run] [--no-build]
```

Builds the content and publishes it to the connected registry. `all` publishes
every kind in dependency order. One or more ids limit the publish to those
entities: catalog item ids, page ids, token set ids, or asset collections.
`tokens` and `assets` run the Figma pipeline first.

| Option | Description |
| --- | --- |
| `--dry-run` | Lists the content that a real publish uploads. Does not connect to a registry. The build still runs. |
| `--no-build` | Publishes the existing build output without a build first |

### checkout

```bash
handoff-app checkout <catalog|pages|tokens|assets|all> [id...] [--dry-run]
```

Writes content from the connected registry into the workspace. Checkout writes
declarations in the format that `runtime.workspace.declarationFormat` sets.

| Option | Description |
| --- | --- |
| `--dry-run` | Lists the files that a real checkout creates or overwrites. Writes nothing. |

### Registry connection

`publish` and `checkout` find the registry URL and the token in this order:

1. `HANDOFF_REGISTRY_URL` and `HANDOFF_REGISTRY_ACCESS_TOKEN`, or
   `runtime.registryConnection` in the config.
2. The saved login of the selected profile, if it belongs to the same registry
   URL. A profile without a login uses the default login.
3. `HANDOFF_SYNC_SECRET`, when no token and no login is available.

## Deprecated commands

These commands still work. Each shows a deprecation warning.

| Command | Replacement |
| --- | --- |
| `push [type] [id...]` | `publish` |
| `push:all` | `publish all` |
| `push:tokens [setId...]` | `publish tokens` |
| `push:assets [collection]` | `publish assets` |
| `pull [type] [id...]` | `checkout` |

The `push` and `pull` commands also accept `components` and `patterns` as the
type. They accept the options for features that Handoff 2 does not have, and
show a warning for each one.
