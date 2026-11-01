# AGENTS.md

## Local instructions

Before starting work, check whether `AGENTS.local.md` exists in the repository root.

If it exists, read and follow its instructions in addition to this file. Treat `AGENTS.local.md` as developer-specific local guidance.

If it does not exist, proceed normally.

## Project

`handoff-app` is an npm package (CLI + library) that turns design tokens (fetched from Figma), components, patterns, and Markdown pages into a Next.js documentation app and distributable artifacts. User-facing docs: [README.md](README.md), [RECIPES.md](RECIPES.md), [docs/cli.md](docs/cli.md), [docs/api.md](docs/api.md), [UPGRADE.md](UPGRADE.md).

Requires Node.js >= 22 and npm >= 10.

## Commands

```bash
npm run build     # tsc: compiles src/ (except src/app) to dist/
npm run lint      # next lint over src/app
npm test          # alias for lint; there is no unit test suite
npx tsc -p src/app/tsconfig.json --noEmit   # typecheck the Next.js app (root tsc excludes src/app);
                                            # errors under a stale src/app/.next/types are not real
npx drizzle-kit generate                    # generate a registry migration after editing src/registry/db/schema.ts
```

The CLI (`dist/cli.js`, bin `handoff-app`) always runs against a **working directory**: the directory that holds `handoff.config.ts` (or `HANDOFF_WORKING_PATH`). This repo is not a Handoff project, so to exercise a change, build here and run the CLI from a consumer project that uses this build (`start`, `dev`, `build`, `fetch`, `publish`, `checkout`, ...). Verify behavior there; `npm run lint` and the two `tsc` runs are the only checks in this repo.

Formatting: Prettier (config in `package.json`: 140 cols, single quotes, `es5` trailing commas, Tailwind class sorting) and `.editorconfig` (2 spaces, LF).

## Architecture

### Runtime modes

- **Workspace** (default): local files are the source of truth; no database. It is the **only** place that builds content.
- **Registry**: a deployed catalog backed by PostgreSQL (Drizzle). It serves only what a workspace publishes. It never builds and never reads workspace source.
- A **connected workspace** publishes to / checks out from a registry; it is not a third mode.

`runtime.mode` selects the mode; `build --target registry` sets registry mode in the generated app. Keep registry-only dependencies (Drizzle/Postgres) out of the workspace and static paths — e.g. `src/store/index.ts` deliberately does not re-export the registry store; registry consumers import `@handoff/store/registry` lazily.

### Two TypeScript programs

- **`src/` (minus `src/app`)** — the Node CLI/library, CommonJS, compiled by root `tsconfig.json` to `dist/`. `src/index.ts` holds the `Handoff` class (`fetch`, `build`, `publish`, `checkout`, `start`, `dev`); `src/cli.ts` registers the yargs commands in `src/commands/`.
- **`src/app/`** — the Next.js (pages router) documentation app. It is not compiled by `tsc`; at build/start time `src/app-builder` stages it into `.handoff/<projectId>/` under the package and runs `next build` / `next dev`. It imports the core via the `@handoff/*` alias (→ `src/*`). It also hosts the APIs: docs API, registry API, MCP endpoint (`/api/mcp`), auth, and the AI assistant (`src/app/lib/*`, `src/app/pages/api/*`).

### Main flows

- **fetch**: `src/pipeline` — Figma auth → extract → fonts → token transformers; output goes to the working directory's `exported/`.
- **build/start**: `src/config` loads `handoff.config.*` + profile sidecar + env, then `initRuntimeConfig()` normalizes catalog declarations (`src/catalog`) into component/pattern records; `src/transformers` builds previews with Vite/esbuild per renderer (React, Handlebars, CSF); `src/cache` skips unchanged components (`.handoff/.cache/build-cache.json`, bypass with `--force`); `src/app-builder` builds the app (static → `out/static`, registry → `out/registry`, `--package vercel` → `.vercel/output`). Watch mode uses chokidar + a WebSocket reload server with diff-aware rebuilds.
- **publish/checkout**: `src/registry` (`publish/`, `checkout/`, `transfer.ts`, `tokens/`, `assets/`, `auth/`) against the registry API in `src/app/lib/registry-api`. Storage is abstracted by `src/store` (filesystem vs. registry implementations of the same interfaces). Asset blobs go through a pluggable storage provider; email and AI providers are also pluggable custom server modules (`handoff-app/providers`).
- **Migrations**: SQL in `drizzle/` ships with the package and is applied by `handoff-app db:migrate`.

### Config and server-module rules

- **Baked vs. request-time values.** For a `fromEnv('NAME')` value, the build keeps only the variable name, and a deployed registry reads the value at request time. Secrets must use `fromEnv()`. These settings change the shape of the build and are baked, so a change needs a rebuild: `runtime.mode`, `runtime.mcp`, `runtime.ai.enabled`, the database driver, the asset storage and email providers, and every custom server module. A new or changed setting must fit one of these two categories.
- **Custom server modules** (asset storage, email, AI providers) are `.js`/`.mjs` files, relative to the working directory, that import their define helper from `handoff-app/providers`. The registry build stops when a module imports `handoff-app`. The build copies each module and the packages it imports into the registry bundle.

Package entry points (`handoff-app`, `/react`, `/handlebars`, `/pattern`, `/providers`) map to `src/index.ts`, `src/react.ts`, `src/handlebars.ts`, `src/pattern.ts`, `src/providers.ts`. Adding a renderer touches several `Record<RendererKind, …>` maps — see [src/catalog/README.md](src/catalog/README.md).

Most `src/<module>/` directories have a `README.md` describing their files and flow. Read it before changing a module, and update it when the module's contract changes.

## Conventions

- **Breaking changes** get migration steps in [UPGRADE.md](UPGRADE.md), per major version.
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) follows Keep a Changelog + SemVer. Entries are written during release prep on the release branch. Do not add or edit entries in feature or fix work unless asked.
- **Docs style**: README/RECIPES/CHANGELOG use short, plain, imperative sentences (Simplified Technical English style).

### Branches and releases

- **Branch names**: `<category>/<kebab-case-topic>`, e.g. `feature/config-profiles`, `bugfix/code-toc-md`, `docs/readme-rewrite`, `chore/remove-mdx`. Categories in use: `feature/`, `bugfix/`, `docs/`, `chore/`, `release/`.
- **Release branches**: each release has a `release/X.Y.Z` branch. Feature and fix branches start from it and merge back into it through a PR, not into `main`. A major release can first collect work in a long-running `integration/X.Y.Z` branch, from which `release/X.Y.Z` is cut (as for 2.0.0).
- **Prereleases and final version**: `np` (`npm run release`) runs on the release branch. It publishes prereleases (`X.Y.Z-N`) and then the final `X.Y.Z`; each creates a commit whose message is the bare version and a `vX.Y.Z[-N]` tag. Do not write these commits by hand. Release prep (changelog entries and date, last fixes) is committed directly on the release branch.
- **`main`** receives only release merges: a PR from `release/X.Y.Z` into `main` ships the release.

### Commit messages

Use a Conventional Commit subject with no scope and, normally, no body:

```
<type>: <description>
```

- Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `build`, `ci`, `perf`, `style`.
- Description: lowercase, imperative, no trailing period. State what the change achieves for the user, not how the code does it; omit file names and implementation details unless needed for clarity.
- Several distinct changes in one commit: one imperative clause each, separated by `; `. Supporting changes belong to the change they support and are not listed separately.
- No fixed length limit; the purpose sets the length.

Examples from history:

```
fix: use plain JSON Schema for MCP tool inputs
feat: move Figma settings to integrations.figma
refactor: rename define entry point and storage adapter to providers
feat: accept fromEnv() references in asset storage options and resolve them at request time; remove providerId and record blobs as database or custom
```
