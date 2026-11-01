# Transformers Module

Transforms Figma design data into component previews, documentation, and build artifacts.

## Structure

```
transformers/
├── preview/
│   ├── component/      # Component builder, CSS/JS bundling, SSR rendering, validation
│   ├── component.ts    # Component transformer entry point, shared styles processing
│   └── types.ts        # Preview/component type definitions
├── plugins/            # Build plugins (SSR render, Handlebars previews, CSF render with per-preview/story usage generation); each also emits the custom preview render shell
├── docgen/             # React component documentation generation
├── utils/              # Build utilities (handlebars, schema, HTML, SVG sprites, Vite logger, usage snippet helpers, render-shell.ts for the custom preview shell and its postMessage protocol)
├── plugins.ts          # Barrel re-exports for plugins
├── vite-config.ts      # Shared Vite configuration
└── types.ts            # Transformer-level type definitions
```
