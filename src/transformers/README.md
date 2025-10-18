# Transformers Module

The Transformers module is responsible for processing and transforming component data into various output formats for the Handoff application. It provides Vite plugins for generating component previews using both Handlebars templates and React server-side rendering.

## Overview

This module handles the transformation of component tokens into interactive previews, manages schema processing from TypeScript files, and provides utilities for HTML manipulation and build configuration. It supports both traditional template-based rendering and modern React SSR approaches.

## Architecture

```
src/transformers/
├── plugins.ts                    # Main entry point (re-exports)
├── types.ts                      # TypeScript interfaces and types
├── docgen/
│   └── index.ts                  # React docgen typescript integration
├── plugins/
│   ├── index.ts                 # Plugin exports
│   ├── handlebars-previews.ts   # Handlebars previews plugin
│   └── ssr-render.ts           # SSR rendering plugin
└── utils/
    ├── index.ts                 # Utility exports
    ├── schema.ts               # Schema processing utilities
    ├── html.ts                 # HTML manipulation utilities
    ├── build.ts                # Build configuration utilities
    ├── module.ts               # Module evaluation utilities
    ├── handlebars.ts           # Handlebars helper utilities
    └── schema-loader.ts        # Schema loading utilities
```

## Available Plugins

### `handlebarsPreviewsPlugin`
Generates HTML previews using Handlebars templates. This plugin:
- Compiles Handlebars templates with component data
- Registers custom helpers for field binding and inspection
- Generates both normal and inspect-mode previews
- Supports component variations and instances

### `ssrRenderPlugin`
Creates React-based previews using server-side rendering. This plugin:
- Renders React components to static HTML
- Generates client-side hydration code
- Handles schema loading from TypeScript files
- Supports both separate schema files and component-embedded schemas

## Schema Processing

The module supports multiple approaches for extracting component schemas:

1. **Separate Schema Files**: Dedicated `.ts`/`.tsx` files exporting schema objects
2. **Component-Embedded Schemas**: Schemas exported from component files
3. **React Docgen Integration**: Automatic prop extraction using react-docgen-typescript
4. **Custom Schema Hooks**: User-defined schema processing via configuration hooks

## Configuration Hooks

Both plugins support extensive customization through configuration hooks:

```typescript
// Custom schema processing
handoff.config.hooks.schemaToProperties = (schema) => { /* custom logic */ };

// Custom SSR build configuration
handoff.config.hooks.ssrBuildConfig = (config) => { /* custom config */ };

// Custom client build configuration
handoff.config.hooks.clientBuildConfig = (config) => { /* custom config */ };

// Custom schema extraction
handoff.config.hooks.getSchemaFromExports = (exports) => { /* custom logic */ };
```

The schema processing follows a hierarchical approach:
1. Check for separate schema file (`data.entries.schema`)
2. Look for embedded schema in component exports
3. Fall back to react-docgen-typescript analysis
4. Apply custom schema processing hooks if configured
