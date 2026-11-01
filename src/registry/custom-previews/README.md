# Registry Custom Previews

Rows of the `component_custom_previews` table: list, read, insert, update and delete, with author
names attached. Checking args against a component and deciding who may change a row belong to the
caller, `src/app/lib/custom-previews/service.ts`, which can read the published component.

## Files

| File | Purpose |
|------|---------|
| `store.ts` | Drizzle queries over `component_custom_previews` |
| `index.ts` | Barrel re-exports |
