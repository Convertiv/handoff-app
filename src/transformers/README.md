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
├── utils/              # Build utilities (handlebars, schema, HTML, SVG sprites, Vite logger, usage snippet helpers, render-shell.ts for the custom preview shell and its postMessage protocol, frame-layout.ts for element frame layout and background)
├── plugins.ts          # Barrel re-exports for plugins
├── vite-config.ts      # Shared Vite configuration
└── types.ts            # Transformer-level type definitions
```

## Preview frame layout

Each plugin passes its preview documents and render shell through `frameDocumentFor()` (`utils/frame-layout.ts`). A component of type `element` (the default) gets a style that centers its specimen in the frame, with a 100px minimum body height. Other types (`block`, `navigation`, `utility`) keep the bare `<body>`, because a full-width block would shrink under the centering grid.

Element frames also clear their page background while the frame URL ends with `#handoff-background=transparent`. The docs app sets that fragment with `frameUrlWithBackground()`, so switching does not reload the frame.
