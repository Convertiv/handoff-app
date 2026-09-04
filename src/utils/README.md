# Utils Module

Shared utility functions used across the codebase.

## Files

| File | Purpose |
|------|---------|
| `logger.ts` | `Logger` class — timestamped, color-coded console logging |
| `filter.ts` | `evaluateFilter()`, `filterAndSort()` — generic object filtering with logical operators |
| `path.ts` | `generateFilesystemSafeId()` — creates safe directory names from paths |
| `fs.ts` | `findFilesByExtension()` — recursive file search by extension |
| `markdown.ts` | `parseMarkdown()` — frontmatter parse without gray-matter's unbounded module cache |
| `index.ts` | `filterOutNull()` type guard |
