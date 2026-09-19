const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fromEnv } = require('../dist/config/from-env');
const { defaultConfig } = require('../dist/config/defaults');
const { initConfigWithMetadata, HandoffConfigError } = require('../dist/config/loader');
const { resolveRegistryConnection } = require('../dist/registry/connection');
const { resolveDatabaseUrlEnv } = require('../dist/registry/db/driver');
const { resolveAssetStorageFromConfig } = require('../dist/registry/asset-storage/resolve');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-env-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (name, config) => fs.writeFileSync(path.join(dir, name), JSON.stringify(config));
  const load = (config, profile) => initConfigWithMetadata(config, { workingPath: dir, profile }).config;
  return { dir, write, load };
}

function env(t, values) {
  const before = { ...process.env };
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.after(() => {
    for (const key of Object.keys(process.env)) if (!(key in before)) delete process.env[key];
    Object.assign(process.env, before);
  });
}

test('markers and defaults do not read the environment', (t) => {
  const original = process.env;
  process.env = new Proxy(original, {
    get() {
      throw new Error('Unexpected environment read');
    },
  });
  let marker, defaults;
  try {
    marker = fromEnv('TEST_OUTPUT', { default: 'fallback' });
    defaults = defaultConfig();
  } finally {
    process.env = original;
  }
  assert.deepEqual(marker, { $env: 'TEST_OUTPUT', default: 'fallback' });
  assert.deepEqual(fromEnv('TEST_OUTPUT'), { $env: 'TEST_OUTPUT' });
  assert.deepEqual(defaults.dev_access_token, { $env: 'HANDOFF_DEV_ACCESS_TOKEN', default: null });
});

test('only the winning layer resolves and marker defaults never merge', (t) => {
  const { write, load } = fixture(t);
  env(t, { TEST_MISSING_BASE: undefined, TEST_MISSING_PROFILE: undefined });
  write('handoff.config.json', { exportsOutputDirectory: fromEnv('TEST_MISSING_BASE', { default: 'base' }) });
  write('handoff.config.stage.json', { exportsOutputDirectory: 'profile' });
  assert.equal(load(undefined, 'stage').exportsOutputDirectory, 'profile');
  write('handoff.config.stage.json', { exportsOutputDirectory: fromEnv('TEST_MISSING_PROFILE') });
  assert.throws(
    () => load(undefined, 'stage'),
    (error) => {
      assert.ok(error instanceof HandoffConfigError);
      assert.match(error.message, /exportsOutputDirectory.*stage.*TEST_MISSING_PROFILE/);
      return true;
    }
  );
  assert.equal(load({ exportsOutputDirectory: 'override' }, 'stage').exportsOutputDirectory, 'override');
});

test('eager values and secrets resolve once; deferred names remain unchanged in both modes', (t) => {
  const { load } = fixture(t);
  env(t, {
    TEST_FIGMA: 'figma-secret',
    TEST_URL: 'https://registry.example',
    TEST_TOKEN: 'registry-secret',
    TEST_DB: 'postgres://secret',
    TEST_BLOB: 'blob-secret',
  });
  for (const mode of ['workspace', 'registry']) {
    const config = load({
      devAccessToken: fromEnv('TEST_FIGMA'),
      runtime: {
        mode,
        registryConnection: { url: fromEnv('TEST_URL'), accessToken: fromEnv('TEST_TOKEN') },
        registry: { databaseUrl: fromEnv('TEST_DB'), assetStorage: { token: fromEnv('TEST_BLOB') } },
      },
    });
    assert.equal(config.dev_access_token, 'figma-secret');
    assert.equal(config.runtime.registryConnection.accessToken, 'registry-secret');
    assert.deepEqual(config.runtime.registry.databaseUrl, { $env: 'TEST_DB' });
    assert.deepEqual(config.runtime.registry.assetStorage.token, { $env: 'TEST_BLOB' });
    assert.equal(resolveDatabaseUrlEnv(config), 'TEST_DB');
    assert.equal(resolveAssetStorageFromConfig(config).tokenEnv, 'TEST_BLOB');
    process.env.TEST_TOKEN = 'changed';
    assert.equal(resolveRegistryConnection(config).accessToken, 'registry-secret');
    assert.equal(resolveRegistryConnection(config).accessTokenEnv, 'TEST_TOKEN');
    process.env.TEST_TOKEN = 'registry-secret';
  }
});

test('unset deferred references do not read environment values', (t) => {
  const { load } = fixture(t);
  env(t, { TEST_DB_ABSENT: undefined, TEST_BLOB_ABSENT: undefined });
  const config = load({
    runtime: { registry: { databaseUrl: fromEnv('TEST_DB_ABSENT'), assetStorage: { token: fromEnv('TEST_BLOB_ABSENT') } } },
  });
  assert.equal(config.runtime.registry.databaseUrl.$env, 'TEST_DB_ABSENT');
  assert.equal(config.runtime.registry.assetStorage.token.$env, 'TEST_BLOB_ABSENT');
});

test('literal guards reject JSON and JS secrets without printing their values', (t) => {
  const { dir, write, load } = fixture(t);
  const secret = 'postgres://user:do-not-print@host/db';
  const cases = [
    { devAccessToken: secret },
    { dev_access_token: secret },
    { devAccessToken: null },
    { runtime: { registryConnection: { accessToken: secret } } },
    { runtime: { registry: { databaseUrl: secret } } },
    { runtime: { registry: { assetStorage: { token: secret } } } },
    { runtime: { registry: { databaseUrlEnv: secret } } },
    { runtime: { registry: { databaseUrl: { $env: secret } } } },
    { devAccessToken: fromEnv('TEST_TOKEN', { default: secret }) },
  ];
  for (const config of cases) {
    for (const extension of ['json', 'cjs']) {
      const filename = `handoff.config.${extension}`;
      if (extension === 'json') write(filename, config);
      else fs.writeFileSync(path.join(dir, filename), `module.exports = ${JSON.stringify(config)};`);
      assert.throws(
        () => load(),
        (error) => {
          assert.ok(error instanceof HandoffConfigError);
          assert.ok(!error.message.includes(secret));
          return true;
        }
      );
      fs.unlinkSync(path.join(dir, filename));
    }
  }
});

test('functions survive and primitive values have the expected types', (t) => {
  const { load } = fixture(t);
  env(t, { TEST_PORT: '4010', TEST_FLAG: 'true', TEST_ID: '12345' });
  const hook = () => {};
  const transformer = () => {};
  const config = load({
    figmaProjectId: fromEnv('TEST_ID'),
    useVariables: fromEnv('TEST_FLAG'),
    app: { ports: { app: fromEnv('TEST_PORT'), websocket: 4011 } },
    hooks: { registerHandlebarsHelpers: hook },
    pipeline: { transformers: [{ transformer, outDir: 'css', format: 'css' }] },
  });
  assert.equal(config.figma_project_id, '12345');
  assert.equal(config.useVariables, true);
  assert.equal(config.app.ports.app, 4010);
  assert.equal(config.hooks.registerHandlebarsHelpers, hook);
  assert.equal(config.pipeline.transformers[0].transformer, transformer);
});

test('default seeds yield to explicit literals', (t) => {
  const { load } = fixture(t);
  env(t, { HANDOFF_OUTPUT_DIR: 'environment', HANDOFF_USE_VARIABLES: 'true' });
  assert.equal(load().exportsOutputDirectory, 'environment');
  assert.equal(load({ exportsOutputDirectory: 'literal', useVariables: false }).exportsOutputDirectory, 'literal');
  assert.equal(load({ useVariables: false }).useVariables, false);
});

test('runtime.server.json keeps the deployed schema and excludes eager secrets', async (t) => {
  const { persistClientConfig } = require('../dist/app-builder/client-config');
  const { dir, load } = fixture(t);
  env(t, { TEST_EAGER_SECRET: 'never-write-this-secret' });
  for (const mode of ['workspace', 'registry']) {
    const config = load({
      devAccessToken: fromEnv('TEST_EAGER_SECRET'),
      runtime: {
        mode,
        registryConnection: { url: 'https://registry.example', accessToken: fromEnv('TEST_EAGER_SECRET') },
        registry: {
          databaseUrl: fromEnv('TEST_DB'),
          assetStorage: { adapter: 'vercel-blob', token: fromEnv('TEST_BLOB'), options: { region: 'eu' } },
        },
      },
    });
    await persistClientConfig({ config, workingPath: dir, modulePath: dir, getProjectId: () => mode });
    const output = path.join(dir, '.handoff', mode);
    const serverText = fs.readFileSync(path.join(output, 'runtime.server.json'), 'utf8');
    const clientText = fs.readFileSync(path.join(output, 'client.config.json'), 'utf8');
    assert.deepEqual(JSON.parse(serverText), {
      mode,
      mcp: true,
      registry: { driver: 'pg', databaseUrlEnv: 'TEST_DB' },
      assetStorage: { adapter: 'vercel-blob', tokenEnv: 'TEST_BLOB', maxInlineBytes: 4194304, options: { region: 'eu' } },
    });
    assert.ok(!serverText.includes('never-write-this-secret'));
    assert.ok(!clientText.includes('never-write-this-secret'));
    assert.ok(!serverText.includes('$env'));
  }
});

test('profile environment loads before resolution and shell values win', (t) => {
  const { spawnSync } = require('node:child_process');
  const { dir, write } = fixture(t);
  write('handoff.config.json', { exportsOutputDirectory: fromEnv('TEST_PRECEDENCE'), figmaProjectId: fromEnv('TEST_BASE') });
  write('handoff.config.stage.json', {});
  fs.writeFileSync(path.join(dir, '.env'), 'TEST_PRECEDENCE=base\nTEST_BASE=base-only\n');
  fs.writeFileSync(path.join(dir, '.env.stage'), 'TEST_PRECEDENCE=profile\n');
  const loader = require.resolve('../dist/config/loader');
  const script = `const result = require(${JSON.stringify(loader)}).initConfigWithMetadata(undefined, { profile: 'stage' }); process.stdout.write(JSON.stringify([result.config.exportsOutputDirectory, result.config.figma_project_id]));`;
  for (const shell of [undefined, 'shell']) {
    const childEnv = { ...process.env };
    delete childEnv.TEST_PRECEDENCE;
    delete childEnv.TEST_BASE;
    if (shell) childEnv.TEST_PRECEDENCE = shell;
    const child = spawnSync(process.execPath, ['-e', script], { cwd: dir, env: childEnv, encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), [shell ?? 'profile', 'base-only']);
  }
});

test('nested fallback objects cannot bypass reference-only guards', (t) => {
  const { load } = fixture(t);
  env(t, { TEST_RUNTIME_ABSENT: undefined });
  assert.throws(
    () => load({ runtime: fromEnv('TEST_RUNTIME_ABSENT', { default: { registry: { databaseUrl: 'postgres://do-not-print' } } }) }),
    (error) => {
      assert.ok(error instanceof HandoffConfigError);
      assert.match(error.message, /runtime.registry.databaseUrl/);
      assert.ok(!error.message.includes('postgres://do-not-print'));
      return true;
    }
  );
});
