# Transformers Module

Transforms Figma design data into component previews, documentation, and build artifacts.

## Structure

```
transformers/
├── preview/
│   ├── component/      # Component builder, CSS/JS bundling, SSR rendering, validation
│   ├── component.ts    # Component transformer entry point, shared styles processing
│   └── types.ts        # Preview/component type definitions
├── plugins/            # Build plugins (SSR render, HTML template)
├── docgen/             # React component documentation generation
├── utils/              # Build utilities (handlebars, schema, HTML, SVG sprites, Vite logger)
├── config.ts           # Shared Vite configuration
└── types.ts            # Transformer-level type definitions
```
