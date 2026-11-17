# Registry Screen Documents

The registry backing of collections: rows of the `documents` table (migration `0010`). One
generic table holds the documents of every owner and collection, keyed by
`(owner_kind, owner_id, collection, id)`, so a new screen, collection or owner kind never needs a
migration. Screens are owner kind `screen`.

`createRegistryCollectionsBackend()` implements `CollectionsBackend` from `src/screens/store.ts`.
It only reads and writes rows. The typed store validates documents, upgrades old versions and
retries updates; `src/app/lib/screens` decides who may read and write.

- A conditional write (`expectedRevision`) updates only the row at that revision and bumps it.
  Revision `0` inserts and fails when the row exists.
- Equality filters use `data @> '{"field": value}'`, which the GIN `jsonb_path_ops` index serves.
- Lists sort on `created_at`, `updated_at` or `id`, with the id as tie-breaker for keyset paging.

## Files

| File | Purpose |
|------|---------|
| `store.ts` | Drizzle queries over `documents` |
| `index.ts` | Barrel re-exports |
