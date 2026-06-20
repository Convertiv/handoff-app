import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config for generating the registry's package-owned migrations.
 *
 * Migrations are generated into `./drizzle` and shipped with the `handoff-app` package; the
 * bundled runner (`handoff-app db:migrate`) applies them at install/deploy time. Both built-in
 * adapters (`pg`, `neon`) target the Postgres dialect, so a single migration set serves both.
 *
 * Generate after schema changes with: `npx drizzle-kit generate`
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/registry/db/schema.ts',
  out: './drizzle',
});
