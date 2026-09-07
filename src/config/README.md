# Config Module

Handles loading, validation, and resolution of handoff configuration.

## Files

| File | Purpose |
|------|---------|
| `defaults.ts` | Default config values and `getClientConfig()` for the Next.js app |
| `loader.ts` | `initConfig()` — reads `handoff.config.ts/.js/.cjs/.json` (in that order), warns on conflicts, and merges overrides |
| `runtime.ts` | `initRuntimeConfig()` — one pass over every registered catalog directory: loads each declaration, classifies it as an item or a composition, resolves SCSS/JS paths and transformer options |
| `entries.ts` | `isEntryCovered()` / `writeEntries()` — registers a directory under `catalog.include`, or under the deprecated `entries.components` / `entries.patterns` keys |
| `validator.ts` | `validateConfig()` — ensures required Figma credentials are present |
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
