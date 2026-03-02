# CLI Reference

The Handoff CLI is run as `handoff-app` (when installed globally) or `node ./dist/cli.js` from the project root. For full options for any command, run:

```bash
handoff-app <command> --help
```

## Shared options

Most commands accept these options (from [getSharedOptions](src/commands/utils.ts)):

| Option | Short | Description |
|--------|-------|-------------|
| `--config` | `-c` | Path to config file |
| `--force` | `-f` | Force action |
| `--debug` | `-d` | Enable debug mode |

## Commands

### Build

| Command | Description | Main options |
|---------|-------------|--------------|
| `build:app` | Build the documentation application | `--skip-components` — skip building components before building the app |
| `build:components [component]` | Build project components | Optional positional: component name to build a specific component |

### Development

| Command | Description |
|---------|-------------|
| `dev` | Start the design system in development mode (custom dev server with watchers) |
| `start` | Start the design system in development mode (same as dev) |

### Eject

| Command | Description |
|---------|-------------|
| `eject:config` | Eject the default configuration to the current working directory |
| `eject:pages` | Eject the default pages to the current working directory |
| `eject:theme` | Eject the currently selected theme |

### Fetch / Init

| Command | Description |
|---------|-------------|
| `fetch` | Fetch the design tokens |
| `init` | Initialize a new Handoff project with interactive wizard |

### Make

| Command | Description | Arguments |
|---------|-------------|-----------|
| `make:page <name> [parent]` | Create a new page | `name` — page name; optional `parent` |
| `make:component <name>` | Create a new HTML code component for documentation | `name` — component name |
| `make:template <component> [state]` | Create a new template | `component` — component; optional `state` |

### Platform

| Command | Description | Main options |
|---------|-------------|--------------|
| `platform:login` | Log in to the Handoff platform | `--url` — platform URL (overrides config) |
| `platform:init` | Link this directory to a Handoff platform project | `--url` — platform URL |
| `platform:pull` | Pull project files from the Handoff platform | `--url`, `--force`, `--debug` |
| `platform:push` | Push local changes to the Handoff platform | `--url`, `--force`, `--debug` |
| `platform:logout` | Log out from the Handoff platform | `--url` — platform URL |

### ISR (Incremental Static Regeneration)

| Command | Description | Main options |
|---------|-------------|--------------|
| `isr:pages` | Rebuild app (skip components) and optionally deploy only affected routes | `--path`, `--paths`, `--menu-changed`, `--partial`, `--deploy-dir` |
| `isr:component` | Rebuild one or more components, then rebuild app and optionally deploy only affected routes | `--id`, `--ids`, `--partial`, `--deploy-dir` |

For detailed ISR behavior and options, see [ISR](./isr.md).

### Other

| Command | Description | Main options |
|---------|-------------|--------------|
| `scaffold` | Scaffold component stubs for fetched Figma components | |
| `validate:components` | Validate components in the design system | `--skip-build` — skip build step before validating |

## Config

The CLI reads config from `handoff.config.js`, `handoff.config.cjs`, or `handoff.config.json` in the current working directory. Use `-c` or `--config` to point to a different file.
