# Config Module

Handles loading, validation, and resolution of handoff configuration.

## Files

| File | Purpose |
|------|---------|
| `defaults.ts` | Default config values and `getClientConfig()` for the Next.js app |
| `from-env.ts` | JSON-compatible environment markers and public types |
| `resolve-env.ts` | Resolves merged environment references and guards reference-only properties |
| `errors.ts` | Shared `HandoffConfigError` |
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

`loadProfileEnv()` runs twice: in `Handoff.construct()` before `Logger.init()`, so the log level can come from a profile, and in `initConfigWithMetadata()` before the merged environment references resolve. Applying it twice changes nothing.

## Layer Precedence

Every loaded file is normalized, then the layers are merged in this order:

1. `defaultConfig()`
2. Base config file
3. Profile file
4. Programmatic override (`HandoffOptions.config`)

Plain objects merge recursively. Arrays, scalars, `null`, and functions replace. `undefined` is skipped.

## Environment references

Import `fromEnv` from `handoff-app`. `fromEnv('OUTPUT_DIR', { default: 'exported' })` creates
`{ $env: 'OUTPUT_DIR', default: 'exported' }` without reading the environment. JSON configs use
that same object. Without a default, an unset variable raises `HandoffConfigError` with the
property path, variable name, and active profile. Invalid names and rejected literals are never echoed.

`EnvValue<T>` accepts a literal or reference. `EnvSecret<T>` accepts only a reference and resolves
at config load. Secret defaults can only be empty or null, for optional credentials.
`RuntimeEnvReference<T>` accepts only a reference with no default. Its name survives config loading and
is read in the deployed process. Database URLs and asset-storage tokens are deferred.

The loader resolves references once after all layers merge, before other config guards.
References replace whole values, including earlier references and their defaults. A profile can
replace an ordinary reference with a literal. Functions in hooks and pipeline remain functions.
Defaults retain the existing `HANDOFF_*` seeds: a higher-layer literal beats a seed, and an explicit
reference beats every lower layer. Only the winning reference reads the environment.

Environment values are strings. A numeric or boolean default selects conversion; the built-in
numeric and boolean properties also retain their default's conversion when a reference omits its
fallback. Booleans are true only for `true`. Numbers must be finite. A lower-layer fallback never
becomes the fallback for a replacement reference.

`runtime.registry.assetStorage.options` is for non-secret values only. Its resolved contents are
JSON-encoded into the bundle. For custom adapter secrets, put a variable name in options and read
it through the adapter factory's `env` argument at runtime. Never put a secret reference in options.

`ResolvedConfig` narrows eager properties by hand. Adding an eager property requires its `Config`
member and resolved narrowing. A secret also needs a `SECRET_PATHS` entry for untyped configs.
Adding a deferred property requires its member and a `DEFERRED_PATHS` entry.

Focused regression checks: after the package build, run `node --test tests/config-env.test.cjs`.
These cover config loading in both modes; they do not replace consumer deployment checks.
