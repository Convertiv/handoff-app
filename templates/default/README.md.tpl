# {{projectName}}

A design system documentation site powered by Handoff App.

## Getting Started

1. Configure your Figma credentials in `.env`
2. Run `npm run fetch` to pull design tokens
3. Run `npm run start` to launch the documentation site

## Scripts

- `npm run fetch` - Fetch design data from Figma
- `npm run start` - Start the documentation server
- `npm run dev` - Start the server in watch mode
- `npm run build` - Build the documentation site
- `npm run db:migrate` - Apply registry database migrations

## Deploying

Handoff builds two deployment shapes:

- **Static** — plain files served by any static file server or CDN. Build with
  `handoff-app build --target static`. The simplest to deploy and run.
- **Registry** — a live, database-backed Node app that serves a shared catalog.
  Build with `handoff-app build --target registry`, run it on any Node host, and
  provide a Postgres `DATABASE_URL`. The more capable, actively evolving option,
  and the recommended path for a design system you plan to grow.

Add `--package vercel` to either build to produce a `.vercel/output` bundle. If
you scaffolded a `vercel.json`, it runs the build for the deployment you chose;
edit its `buildCommand` to switch.

## Registry mode

New projects run in **workspace mode**, which needs no database and is the default
for building and iterating locally. The database-backed **registry mode** lets you
publish and share a design system across projects and is where Handoff's
capabilities are expanding, so it's the recommended path as your design system
grows. See the Handoff docs for setting up the database and publishing.

### Database migrations

A registry deployment stores its catalog in Postgres, so its schema has to be
migrated before you deploy new code. Run this against the target database:

```bash
npm run db:migrate
```

It reads `DATABASE_URL` from the environment and applies the migrations bundled
with Handoff. It runs on its own, separate from build and start, so use it as a
release step (for example in CI/CD). Static deployments don't use a database and
can skip it.

### One-time installation

Configure `AUTH_SECRET` and the canonical `AUTH_URL`, run migrations, deploy, and
then open `/install` immediately. The browser installer verifies the deployment
and transactionally creates the first administrator; it never runs migrations.
The first visitor can claim an uninstalled registry, so do not leave a new
deployment unattended.

After installation, sign in and run:

```bash
handoff-app login --url https://registry.example.com
```

Approve the device in the browser before publishing or checking out. CI should
use a user-issued access token from Account settings. The former fixed
`HANDOFF_REGISTRY_API_TOKEN` is not accepted.
