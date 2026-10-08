# Handoff recipes

Each recipe is a complete example for one setup. The [README](README.md)
explains the concepts, the rules, and the full configuration. Read the related
README section before you use a recipe.

**Project layout**

- [Handoff in a subdirectory](#handoff-in-a-subdirectory)
- [Handoff in the project root](#handoff-in-the-project-root)
- [Handoff as a workspace package](#handoff-as-a-workspace-package)
- [pnpm](#pnpm)
- [npm scripts on Windows](#npm-scripts-on-windows)

**Catalog items**

- [React preview with a render function](#react-preview-with-a-render-function)
- [Handlebars item](#handlebars-item)
- [CSF stories](#csf-stories)
- [Composition with preview overrides](#composition-with-preview-overrides)

**Profiles**

- [Local profile](#local-profile)
- [Registry build profile](#registry-build-profile)
- [One workspace, several registries](#one-workspace-several-registries)

**Registry hosting**

- [Local registry](#local-registry)
- [Vercel and Neon](#vercel-and-neon)

**Asset storage**

- [S3-compatible storage](#s3-compatible-storage)
- [Vercel Blob](#vercel-blob)

**Email**

- [Resend](#resend)
- [SMTP](#smtp)
- [Custom email provider](#custom-email-provider)

**AI assistant**

- [Service key through a gateway](#service-key-through-a-gateway)
- [Local Ollama](#local-ollama)
- [Reader keys](#reader-keys)
- [Custom AI provider](#custom-ai-provider)
- [Change connections without a rebuild](#change-connections-without-a-rebuild)

**MCP**

- [Connect a client by hand](#connect-a-client-by-hand)
- [Turn off MCP](#turn-off-mcp)

**Continuous integration**

- [Publish from GitHub Actions](#publish-from-github-actions)

---

## Project layout

These recipes add Handoff to an existing application. The README section
[Adding Handoff to an existing application](README.md#adding-handoff-to-an-existing-application)
gives the two rules that apply to all of them.

### Handoff in a subdirectory

This is the recommended layout. The application does not change.
`handoff-app` is a dependency of the application package.
`HANDOFF_WORKING_PATH` keeps the generated directories in `handoff/`.

```json
{
  "scripts": {
    "handoff:dev": "HANDOFF_WORKING_PATH=handoff handoff-app start",
    "handoff:build": "HANDOFF_WORKING_PATH=handoff handoff-app build"
  }
}
```

```ts
// handoff/handoff.config.ts
import { defineConfig } from 'handoff-app';

export default defineConfig({
  catalog: { include: ['../src/components', '../src/blocks'] },
  entries: { scss: '../src/styles/main.scss' },
});
```

```jsonc
// handoff/tsconfig.json: Handoff reads this file to make the property tables.
{
  "extends": "../tsconfig.json",
  "include": ["../src", "handoff.config.ts"],
  "exclude": ["node_modules", "out", "public"]
}
```

Notes:

- The project root `tsconfig.json` type checks the declarations in `src/`.
- Catalog paths are relative to the working directory, so they start with
  `../`.

### Handoff in the project root

The working directory is the project root, so one `tsconfig.json` does both
jobs. Handoff writes to `public/api`. Thus a bundler that serves static files
from `public/` must use a different directory:

```ts
// vite.config.ts
export default defineConfig({
  publicDir: 'static',
});
```

Notes:

- Without this change, the generated documentation API goes into the
  production build of the application.
- A Next.js application cannot use this layout. Its `public` directory is a
  fixed convention, and no setting moves it.

### Handoff as a workspace package

Use this layout when the repository is already a workspace. `handoff/` has its
own `package.json` and scripts. The root forwards to it:

```json
{
  "workspaces": ["handoff"],
  "scripts": { "handoff:dev": "npm run dev --workspace handoff" }
}
```

```json
// handoff/package.json
{
  "name": "handoff",
  "private": true,
  "scripts": { "dev": "handoff-app start", "build": "handoff-app build" },
  "dependencies": { "handoff-app": "^2.0.0" }
}
```

Notes:

- The declarations in `src/` belong to the application package, not to the
  workspace. Thus both packages declare `handoff-app`.

### pnpm

`build` and `build --package vercel` work with the default pnpm layout.
`build --target registry` cannot follow pnpm symlinks when it copies its
runtime dependencies into a standalone bundle. Use a flat layout:

```yaml
# pnpm-workspace.yaml
nodeLinker: hoisted
```

Notes:

- With the default layout, Handoff skips a declaration that has no direct
  dependency on `handoff-app`, with `Could not resolve "handoff-app/react"`.
  The build still exits with code 0.

### npm scripts on Windows

An inline variable does not work in an npm script on Windows. Set the variable
with `cross-env`:

```bash
npm install --save-dev cross-env
```

```json
{ "scripts": { "handoff:dev": "cross-env HANDOFF_WORKING_PATH=handoff handoff-app start" } }
```

---

## Catalog items

The README section [Catalog items](README.md#catalog-items) explains
declarations, ids, and previews.

### React preview with a render function

Handoff serializes the arguments. A preview that needs an icon, a callback, JSX
children, or its own state uses `render`. The item continues to document the
implementation, not a wrapper.

```tsx
// components/example/example.handoff.tsx
import { useState } from 'react';
import { defineCatalogItem, type Preview } from 'handoff-app/react';
import Component from './Component';

const item = defineCatalogItem({
  id: 'component-id',
  name: 'Component name',
  implementation: Component,
});

export default item;

type ComponentPreview = Preview<typeof item>;

export const Default = {
  args: { label: 'Example' },
} satisfies ComponentPreview;

export const Interactive = {
  name: 'Interactive state',
  render: function Interactive() {
    const [label, setLabel] = useState('Example');
    return <Component label={label} onSelect={() => setLabel('Selected')} />;
  },
} satisfies ComponentPreview;
```

Notes:

- The `render` function is a component. A name that starts with an uppercase
  letter lets it use hooks.
- A declaration that holds JSX must use the `.handoff.tsx` extension.
- `name` sets a display title. Without it, the export name is the title.

### Handlebars item

The implementation is the path to the template. The arguments are
`Record<string, unknown>` by default. Give an argument type to
`defineCatalogItem` to type them.

```ts
// components/badge/badge.handoff.ts
import { defineCatalogItem, type Preview } from 'handoff-app/handlebars';

type BadgeArgs = { variant: 'primary' | 'secondary'; children: string };

const item = defineCatalogItem<BadgeArgs>({
  id: 'badge',
  name: 'Badge',
  implementation: './Badge.hbs',
  entries: { scss: './badge.scss' },
});

export default item;

type BadgePreview = Preview<typeof item>;

export const Primary = {
  args: { variant: 'primary', children: 'New' },
} satisfies BadgePreview;
```

Notes:

- `entries` names the supporting files. The template is already the
  implementation.
- `npx handoff-app make:component badge` creates a Handlebars item with a
  CommonJS declaration.

### CSF stories

A React item can use an existing CSF story file. The story file does not
change. Its named exports are the previews.

```ts
// components/card/card.handoff.ts
import { defineCatalogItem, fromCSF } from 'handoff-app/react';

export default defineCatalogItem({
  id: 'card',
  name: 'Card',
  implementation: fromCSF('./Card.stories.tsx'),
});
```

```tsx
// components/card/Card.stories.tsx
import { type Meta, type StoryObj } from 'handoff-app/react';
import Card from './Card';

const meta = {
  component: Card,
  args: { tone: 'neutral' },
} satisfies Meta<typeof Card>;
export default meta;

export const Primary: StoryObj<typeof meta> = {
  args: { title: 'Example' },
};
```

Notes:

- The `args` of each story merge with `meta.args` and override them.
- Handoff keeps story names, `argTypes`, and `render` functions.
- Handoff finds the component through `meta.component`.
- `Meta` and `StoryObj` come from `handoff-app/react`, so the file needs no
  Storybook dependency. A project with Storybook can keep its own types.
- The server renders a CSF preview, and the browser does not hydrate it.

### Composition with preview overrides

A composition references other items by id. Each reference can select a named
preview and override its arguments.

```ts
// patterns/signup/signup.handoff.ts
import { defineCatalogItem } from 'handoff-app/pattern';

export default defineCatalogItem({
  id: 'signup',
  name: 'Sign-up form',
  description: 'Collects an email address for the newsletter.',
  group: 'Forms',
  composition: [
    { ref: 'text-input', preview: 'Default', args: { label: 'Email' } },
    { ref: 'button', preview: 'Primary', args: { children: 'Subscribe' } },
  ],
});
```

---

## Profiles

The README section [Profiles](README.md#profiles) explains how profiles merge
and how to select one.

### Local profile

The generated `.gitignore` lists `handoff.config.local.*`. Thus a `local`
profile stays on one machine.

```ts
// handoff.config.local.ts
import { defineConfig } from 'handoff-app';

export default defineConfig({
  app: { title: 'Design System (local)' },
});
```

```dotenv
# .env
HANDOFF_PROFILE=local
```

Notes:

- `HANDOFF_PROFILE` in `.env` selects the profile for every command.
- When this profile is selected, Handoff reads `.env.local` on top of `.env`.

### Registry build profile

Put the registry build settings in a profile. The base config stays a
workspace config.

```ts
// handoff.config.registry.ts
import { defineConfig, fromEnv } from 'handoff-app';

export default defineConfig({
  runtime: {
    mcp: true,
    registry: {
      database: { url: fromEnv('DATABASE_URL'), driver: 'pg' },
      email: { from: 'Handoff <no-reply@example.com>' },
    },
  },
});
```

```bash
npm run build -- --target registry --profile registry
```

Notes:

- `build --target registry` always builds a registry-mode application. The
  profile does not set `runtime.mode`.
- On a host or in CI, set `HANDOFF_PROFILE=registry` instead of the flag.

### One workspace, several registries

Each profile keeps its own registry login:

```bash
npm run login -- --profile staging --url https://staging.example.com
npm run login -- --profile production --url https://registry.example.com
```

```bash
npm run publish -- all --profile staging
npm run checkout -- catalog button --profile production
```

Notes:

- A login profile needs no `handoff.config.<name>.*` file.
- If a profile has no login of its own, it uses the default login.
- Instead of a login, `.env.staging` and `.env.production` can each set
  `HANDOFF_REGISTRY_URL` and `HANDOFF_REGISTRY_ACCESS_TOKEN`.

---

## Registry hosting

The README section [Registry](README.md#registry) gives the deploy steps and
the runtime environment variables.

### Local registry

This recipe runs a registry on your computer with PostgreSQL in Docker.

1. Start PostgreSQL:

   ```bash
   docker run --name handoff-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=handoff -p 5432:5432 -d postgres:17
   ```

2. Apply the migrations from the workspace:

   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/handoff" npm run db:migrate
   ```

3. Build the registry:

   ```bash
   npm run build -- --target registry
   ```

4. Start the registry server:

   ```bash
   PORT=4000 \
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/handoff" \
   AUTH_SECRET="replace-with-at-least-32-random-characters" \
   AUTH_URL="http://localhost:4000" \
   node out/registry/server.js
   ```

5. Open http://localhost:4000/install and create the first administrator.

6. Sign in from the workspace and publish:

   ```bash
   npm run login -- --url http://localhost:4000
   npm run publish -- all
   ```

### Vercel and Neon

This recipe deploys the registry to Vercel with a Neon database. Each
integration also works alone.

1. Select the Neon driver in a registry profile:

   ```ts
   // handoff.config.registry.ts
   import { defineConfig, fromEnv } from 'handoff-app';

   export default defineConfig({
     runtime: {
       registry: {
         database: { url: fromEnv('DATABASE_URL'), driver: 'neon' },
       },
     },
   });
   ```

2. Set the Vercel build command. `init` writes this file when you select the
   Vercel option:

   ```json
   {
     "framework": null,
     "buildCommand": "npm run build -- --target registry --package vercel"
   }
   ```

3. In the Vercel project, set these environment variables: `HANDOFF_PROFILE=registry`,
   `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL`.

4. Apply the migrations before the first deployment and before each upgrade:

   ```bash
   DATABASE_URL="<neon connection string>" npm run db:migrate
   ```

5. Deploy, then open `<registry url>/install`.

Notes:

- Vercel limits one request to about 4.5 MB. To publish larger assets, use
  [Vercel Blob](#vercel-blob) or [S3-compatible storage](#s3-compatible-storage)
  with direct uploads.

---

## Asset storage

The README section [Asset storage](README.md#asset-storage) explains the
adapter contract and direct uploads.

### S3-compatible storage

This adapter works with Amazon S3, Cloudflare R2, MinIO, SeaweedFS, and other
services with an S3 API. It uses `@aws-sdk/client-s3` and
`@aws-sdk/s3-request-presigner`.

```ts
runtime: {
  registry: {
    assetStorage: {
      adapter: 'custom',
      module: './server/storage/s3.mjs',
      options: {
        endpoint: 'http://127.0.0.1:8333',
        bucket: 'handoff-assets',
        accessKey: fromEnv('S3_ACCESS_KEY'),
        secretKey: fromEnv('S3_SECRET_KEY'),
      },
    },
  },
},
```

```js
// server/storage/s3.mjs
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { defineAssetStorage } from 'handoff-app/define';

export default defineAssetStorage(({ options }) => {
  const client = new S3Client({
    endpoint: options.endpoint,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: options.accessKey, secretAccessKey: options.secretKey },
  });
  const Bucket = options.bucket;
  return {
    async put({ hash, bytes, contentType }) {
      await client.send(new PutObjectCommand({ Bucket, Key: hash, Body: bytes, ContentType: contentType }));
      return { storageRef: hash };
    },
    async get(storageRef) {
      const result = await client.send(new GetObjectCommand({ Bucket, Key: storageRef }));
      return { kind: 'stream', stream: result.Body, contentType: result.ContentType };
    },
    async delete(storageRef) {
      await client.send(new DeleteObjectCommand({ Bucket, Key: storageRef }));
    },
    async createUpload({ hash, contentType }) {
      const checksum = Buffer.from(hash, 'hex').toString('base64');
      const command = new PutObjectCommand({ Bucket, Key: hash, ContentType: contentType, ChecksumSHA256: checksum });
      const url = await getSignedUrl(client, command, {
        expiresIn: 900,
        unhoistableHeaders: new Set(['x-amz-checksum-sha256']),
      });
      return { url, headers: { 'Content-Type': contentType, 'x-amz-checksum-sha256': checksum }, storageRef: hash };
    },
  };
});
```

Notes:

- `createUpload` signs a SHA-256 checksum header. Thus storage rejects bytes
  that do not match `hash`.

### Vercel Blob

This adapter stores blobs in a private Vercel Blob store. It uses
`@vercel/blob` 2.x. When the store is connected to the Vercel project, the SDK
reads the store credentials from the deployment environment. Thus the adapter
needs no `options`.

```ts
runtime: {
  registry: {
    assetStorage: {
      adapter: 'custom',
      module: './server/storage/vercel-blob.mjs',
    },
  },
},
```

```js
// server/storage/vercel-blob.mjs
import { Readable } from 'node:stream';
import { del, get, issueSignedToken, parseStoreIdFromDelegationToken, presignUrl, put } from '@vercel/blob';
import { defineAssetStorage } from 'handoff-app/define';

const access = 'private';
const pathnameFor = (hash) => `assets/${hash}`;

export default defineAssetStorage({
  async put({ hash, bytes, contentType }) {
    const blob = await put(pathnameFor(hash), bytes, { access, contentType, addRandomSuffix: false, allowOverwrite: true });
    return { storageRef: blob.pathname };
  },
  async get(storageRef) {
    const result = await get(storageRef, { access });
    if (!result?.stream) {
      throw new Error(`Blob "${storageRef}" does not exist.`);
    }
    return { kind: 'stream', stream: Readable.fromWeb(result.stream), contentType: result.blob.contentType };
  },
  async delete(storageRef) {
    await del(storageRef);
  },
  async createUpload({ hash, size, contentType }) {
    const pathname = pathnameFor(hash);
    const token = await issueSignedToken({
      pathname,
      operations: ['put'],
      validUntil: Date.now() + 15 * 60 * 1000,
      allowedContentTypes: [contentType],
      maximumSizeInBytes: size,
    });
    const { presignedUrl } = await presignUrl(token, { operation: 'put', pathname, access, allowOverwrite: true });
    return {
      url: presignedUrl,
      headers: {
        'x-api-version': '12',
        'x-vercel-blob-store-id': parseStoreIdFromDelegationToken(token.delegationToken),
        'x-vercel-blob-access': access,
        'x-content-type': contentType,
      },
      storageRef: pathname,
    };
  },
});
```

Notes:

- `get` converts the stream. The SDK returns a web stream, but the registry
  needs a Node stream.
- A private blob has no public URL. Thus the registry sends each blob to the
  reader.
- **Vercel Blob cannot reject bytes that do not match `hash`.** The signed URL
  limits only the path, the size, and the content type. Thus the registry does
  not verify a blob that the CLI uploads directly.
- Without `createUpload`, each blob goes through the registry, which verifies
  its hash. The Vercel limit of about 4.5 MB then applies to each blob.
- The CLI sends a plain `PUT` request. Thus `createUpload` returns the headers
  that the SDK sends for a presigned upload. These headers are not a documented
  API, so a new version of `@vercel/blob` can change them.

---

## Email

The README section [Email](README.md#email) explains when the registry sends
email.

### Resend

Resend is the default provider. It reads its key from `RESEND_API_KEY`.

```ts
runtime: {
  registry: {
    email: { from: 'Handoff <no-reply@example.com>' },
  },
},
```

To read the key from a different variable, set `options.apiKey`:

```ts
email: {
  from: 'Handoff <no-reply@example.com>',
  options: { apiKey: fromEnv('HANDOFF_RESEND_KEY') },
},
```

### SMTP

Use this provider for an SMTP server, for example Amazon SES, SendGrid, or
Microsoft 365.

```ts
email: {
  from: 'Handoff <no-reply@example.com>',
  provider: 'smtp',
  options: {
    host: fromEnv('SMTP_HOST'),
    port: 465, // default, uses TLS. 587 uses STARTTLS.
    user: fromEnv('SMTP_USER'),
    password: fromEnv('SMTP_PASSWORD'),
  },
},
```

### Custom email provider

This example sends email through the Postmark HTTP API. The factory gets
`options` with the `fromEnv()` values resolved.

```ts
email: {
  from: 'Handoff <no-reply@example.com>',
  provider: 'custom',
  module: './server/email/postmark.mjs',
  options: { apiKey: fromEnv('POSTMARK_SERVER_TOKEN') },
},
```

```js
// server/email/postmark.mjs
import { defineEmailProvider } from 'handoff-app/define';

export default defineEmailProvider(({ options }) => ({
  async send({ from, to, subject, html, text }) {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': options.apiKey,
      },
      body: JSON.stringify({ From: from, To: to, Subject: subject, HtmlBody: html, TextBody: text }),
    });
    if (!response.ok) {
      throw new Error(`Postmark rejected the message: ${response.status} ${await response.text()}`);
    }
  },
}));
```

Notes:

- `send` must throw an error when the provider does not accept the message.

---

## AI assistant

The README section [AI assistant](README.md#ai-assistant) explains
connections and credentials. Each recipe adds one connection. A config can
declare many connections.

### Service key through a gateway

The deployment key pays for every reader. The gateway enforces budgets and rate
limits.

```ts
runtime: {
  ai: {
    connections: [
      {
        id: 'gateway',
        label: 'Acme LiteLLM',
        baseUrl: 'https://llm.acme.internal/v1',
        apiKey: fromEnv('LITELLM_API_KEY'),
        models: ['gpt-4o', 'claude-sonnet-4-5', 'grok-4'],
      },
    ],
    defaultModel: 'gateway/claude-sonnet-4-5',
  },
},
```

### Local Ollama

The endpoint needs no credential.

```ts
runtime: {
  ai: {
    connections: [{ id: 'local', label: 'Ollama', baseUrl: 'http://127.0.0.1:11434/v1', models: ['llama3.1'] }],
    defaultModel: 'local/llama3.1',
  },
},
```

### Reader keys

The config sets the endpoint and the models. Each reader adds their own key
under Account → AI providers.

```ts
runtime: {
  ai: {
    connections: [
      {
        id: 'openai',
        label: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        credential: 'user',
        models: ['gpt-4o', 'o3'],
      },
    ],
  },
},
```

```dotenv
HANDOFF_AI_KEY_SECRET="replace-with-at-least-32-random-characters"
```

Notes:

- Reader keys work only in registry mode.

### Custom AI provider

Use a module when a provider does not serve the OpenAI-compatible API. This
example uses the Anthropic provider of the AI SDK.

```ts
runtime: {
  ai: {
    connections: [
      {
        id: 'anthropic',
        label: 'Anthropic',
        module: './server/ai/anthropic.mjs',
        apiKey: fromEnv('ANTHROPIC_API_KEY'),
        models: ['claude-sonnet-4-5'],
      },
    ],
  },
},
```

```js
// server/ai/anthropic.mjs
import { createAnthropic } from '@ai-sdk/anthropic';
import { defineAiProvider } from 'handoff-app/define';

export default defineAiProvider(({ apiKey }) => createAnthropic({ apiKey }));
```

Notes:

- The factory gets `apiKey`, which is the deployment key or the key of the
  reader. It also gets `options` with the `fromEnv()` values resolved.
- The provider must return a language model for each model in `models`.
- Install a provider version that supports AI SDK 7, which `handoff-app` uses.

### Change connections without a rebuild

`HANDOFF_AI_CONNECTIONS` holds a JSON array. The registry reads it at request
time and merges it over the built-in list by `id`. The array names each key
variable instead of holding the key:

```dotenv
HANDOFF_AI_CONNECTIONS='[{"id":"gateway","label":"Acme LiteLLM","baseUrl":"https://llm.acme.internal/v1","apiKeyEnv":"LITELLM_API_KEY","models":["gpt-4o"]}]'
```

Notes:

- A connection in this list can use a `module` only if a connection in the
  config names the same module.

---

## MCP

The README section [MCP](README.md#mcp) gives the endpoints and credentials.

### Connect a client by hand

The documentation app shows a ready-made client config behind the plug icon in
the header. To write it by hand:

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

Notes:

- Keep the trailing slash. `/api/mcp` answers with a 308 redirect.
- A workspace endpoint, `http://localhost:3000/api/mcp/`, needs no
  `Authorization` header.

### Turn off MCP

```ts
runtime: {
  mcp: false,
},
```

Notes:

- This value is baked at build time. Rebuild a deployed registry after you
  change it.

---

## Continuous integration

### Publish from GitHub Actions

This workflow publishes all content when a change goes into `main`.

```yaml
# .github/workflows/publish.yml
name: Publish to registry
on:
  push:
    branches: [main]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run publish -- all
        env:
          HANDOFF_REGISTRY_URL: ${{ vars.HANDOFF_REGISTRY_URL }}
          HANDOFF_REGISTRY_ACCESS_TOKEN: ${{ secrets.HANDOFF_REGISTRY_ACCESS_TOKEN }}
          HANDOFF_FIGMA_PROJECT_ID: ${{ vars.HANDOFF_FIGMA_PROJECT_ID }}
          HANDOFF_DEV_ACCESS_TOKEN: ${{ secrets.HANDOFF_DEV_ACCESS_TOKEN }}
```

Notes:

- The access token needs read and write access.
- `publish tokens` and `publish assets` run the Figma pipeline. Thus `all`
  needs the Figma variables. To publish only catalog items and pages, run
  `npm run publish -- catalog` and `npm run publish -- pages`, and remove the
  Figma variables.
- Without a terminal, a missing Figma value stops the command with an error
  that names the variable.
