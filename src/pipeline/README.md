# Pipeline Module

Handles the end-to-end Figma data pipeline: authentication, extraction, token generation, and style building.

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Main `pipeline()` orchestrator and barrel re-exports |
| `figma.ts` | `validateFigmaAuth()` — interactive credential prompting; `figmaExtract()` — Figma data extraction |
| `styles.ts` | `buildStyles()` — design token transformers; `buildCustomFonts()` — font zipping |
| `components.ts` | `buildComponents()` — component preview generation |
| `documentation.ts` | `createDocumentationObject()` — Figma data extraction into a documentation object with assets and SVG sprites |
| `archive.ts` | `zip()`, `zipAssets()`, `readPrevJSONFile()` — archive utilities |
| `validation.ts` | `validateHandoffRequirements()` — Node.js version check |

## Pipeline Flow

```
validateHandoffRequirements → validateFigmaAuth → figmaExtract → buildCustomFonts → buildStyles → [buildApp]
```
