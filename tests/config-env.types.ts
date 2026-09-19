import { defineConfig, fromEnv, type Config, type ResolvedConfig, type EnvValue, type EnvSecret, type RuntimeEnvReference } from '../dist';

const value: EnvValue<string> = 'literal';
const secret: EnvSecret<string> = fromEnv('TOKEN');
const deferred: RuntimeEnvReference<string> = { $env: 'DATABASE_URL' };
const config: Config = defineConfig({
  devAccessToken: secret,
  figmaProjectId: fromEnv('FIGMA_ID'),
  exportsOutputDirectory: fromEnv('OUTPUT', { default: 'exported' }),
  useVariables: fromEnv('USE_VARIABLES'),
  app: { ports: { app: fromEnv('PORT'), websocket: 3001 } },
  runtime: {
    registryConnection: { url: value, accessToken: secret },
    registry: { databaseUrl: deferred, assetStorage: { token: fromEnv('BLOB_TOKEN') } },
  },
});
void config;
// @ts-expect-error Secret properties reject literals.
defineConfig({ devAccessToken: 'literal' });
// @ts-expect-error Legacy spelling has the same secret guard.
defineConfig({ dev_access_token: 'literal' });
// @ts-expect-error Connection tokens reject literals.
defineConfig({ runtime: { registryConnection: { accessToken: 'literal' } } });
// @ts-expect-error Deferred properties reject literals.
defineConfig({ runtime: { registry: { databaseUrl: 'postgres://literal' } } });
// @ts-expect-error Storage tokens reject literals.
defineConfig({ runtime: { registry: { assetStorage: { token: 'literal' } } } });
// @ts-expect-error Removed v2 property has no alias.
defineConfig({ runtime: { registryConnection: { urlEnv: 'OLD' } } });

declare const resolved: ResolvedConfig;
const token: string | null | undefined = resolved.dev_access_token;
const port: number | undefined = resolved.app?.ports?.app;
const flag: boolean | undefined = resolved.useVariables;
const url: string | undefined = resolved.runtime?.registryConnection?.url;
const dbName: string | undefined = resolved.runtime?.registry?.databaseUrl?.$env;
void [token, port, flag, url, dbName];
