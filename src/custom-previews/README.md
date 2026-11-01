# Custom Previews Module

A custom preview is a component rendered with args that a reader or an agent saved in the registry.
It holds the component id and the complete args, and no link to a built preview. Every read checks
the args against the component's current contract (its `properties`). A republished component
therefore never breaks a saved preview; it only reports issues.

Pure code, with no database or Node imports. The docs app editor, the registry service in
`src/app/lib/custom-previews`, and the MCP tools use it.

## Files

| File | Purpose |
|------|---------|
| `types.ts` | `CustomPreview`, `CustomPreviewIssue`, `CustomPreviewStatus`, `CustomPreviewAssessment`, and the size limits |
| `contract.ts` | `toArgsSchema()` turns a component's `properties` into JSON Schema for agents; `contractFingerprint()` hashes the contract so a read can tell it changed since the save |
| `assess.ts` | `assessArgs()` checks args against the current contract and fills new required props from their defaults at render time; `parseArgs`/`parseTitle`/`parseDescription` validate request input |
| `sandbox.ts` | The frame sandbox and CSP that every render shell runs under |
| `shell.ts` | The render shell contract that build, publish and the registry share: the shell and client bundle file suffixes, the props script id, and `scriptSafeJson()` |
| `index.ts` | Barrel re-exports |

## Related

- Storage: `src/registry/custom-previews` (rows) and the `component_custom_previews` table.
- Rendering: `src/transformers/utils/render-shell.ts` emits `component/<id>.render.html`. It renders a
  component with any JSON args in the browser. The registry injects saved args into it and never builds.
- Isolation: any member can save args, and a component can run script from them. So the shell always
  runs at an opaque origin. The docs app frames it with `sandbox="allow-scripts"`, and both routes that
  serve it send `Content-Security-Policy: sandbox allow-scripts`. The shell reports its height with
  `postMessage`, because the parent cannot measure a cross-origin document.
