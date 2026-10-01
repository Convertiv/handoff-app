# Pipeline Module

Handles the end-to-end Figma data pipeline: authentication, extraction, token generation, and style building.

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Main `pipeline()` orchestrator and barrel re-exports |
| `figma.ts` | `resolveFigmaConnection()` — Figma values from `integrations.figma` and their variable names; `validateFigmaAuth()` — in a terminal, asks for an empty value and can save it to the profile env file, otherwise throws `HandoffConfigError`; `figmaExtract()` — Figma data extraction |
| `styles.ts` | `buildStyles()` — design token transformers; `buildCustomFonts()` — font zipping |
| `components.ts` | `buildComponents()` — component preview generation |
| `documentation.ts` | `createDocumentationObject()` — Figma data extraction into a documentation object with assets and SVG sprites |
| `archive.ts` | `zip()`, `zipAssets()`, `readPrevJSONFile()` — archive utilities |
| `validation.ts` | `validateHandoffRequirements()` — Node.js version check |

## Pipeline Flow

```
validateHandoffRequirements → validateFigmaAuth → figmaExtract → buildCustomFonts → buildStyles → [buildApp]
```
