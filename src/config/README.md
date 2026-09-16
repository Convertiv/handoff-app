# Config Module

Handles loading, validation, and resolution of handoff configuration.

## Files

| File | Purpose |
|------|---------|
| `defaults.ts` | Default config values and `getClientConfig()` for the Next.js app |
| `env.ts` | Reads `.env` at load, then `loadProfileEnv()` applies `.env.<profile>` on top |
| `loader.ts` | `initConfig()` — reads `handoff.config.ts/.js/.cjs/.json` (in that order) plus the selected profile sidecar, warns on conflicts, and merges every layer |
| `runtime.ts` | `initRuntimeConfig()` — one pass over every registered catalog directory: loads each declaration, normalizes it into a component or pattern record, skips a declaration with a taken id, resolves SCSS/JS paths and transformer options |
| `catalog-include.ts` | `isIncluded()` / `addToCatalog()` — registers a directory under `catalog.include` |
| `validator.ts` | `validateConfig()` — ensures required Figma credentials are present |
| `helpers.ts` | `defineConfig()` — typed authoring; maps camelCase keys to the runtime keys |
| `index.ts` | Barrel re-exports |

## Usage

```ts
import { initConfig, initRuntimeConfig, validateConfig } from './config';

const config = initConfig(overrides);
const [runtimeConfig, configPaths] = initRuntimeConfig({ config, workingPath });
const validated = validateConfig(config);
```

## Main Config Precedence

When multiple main config files exist in the project root, Handoff picks the first match in this order and warns about ignored files:

1. `handoff.config.ts`
2. `handoff.config.js`
3. `handoff.config.cjs`
4. `handoff.config.json`

## Profiles

`--profile <name>`, or `HANDOFF_PROFILE` when the flag is absent, adds one sidecar file. It sits beside the resolved base config: the base file name without its extension, then the profile name, then any config extension. So `handoff.config.ts` pairs with `handoff.config.<name>.*`, and a config named through `-c` keeps its own name. The same four extensions are probed in the same order. A selected profile that does not resolve is a `HandoffConfigError`.

## Environment Files

`.env` is read once when `env.ts` loads, before the first `Handoff` is constructed. A selected profile then adds an optional `.env.<profile>` from the same directory. Precedence is the process environment, then the profile env file, then `.env`. The keys present at startup are recorded before `.env` is read and are never overwritten, so an inline `VAR=… handoff-app …` still wins.

`loadProfileEnv()` runs twice: in `Handoff.construct()` before `Logger.init()`, so the log level can come from a profile, and in `initConfigWithMetadata()` before `defaultConfig()` reads the environment. Applying it twice changes nothing.

## Layer Precedence

Every loaded file is normalized, then the layers are merged in this order:

1. `defaultConfig()`
2. Base config file
3. Profile file
4. Programmatic override (`HandoffOptions.config`)

Plain objects merge recursively. Arrays, scalars, `null`, and functions replace. `undefined` is skipped.
