# Transformers Module

Transforms Figma design data into component previews, documentation, and build artifacts.

## Structure

```
transformers/
├── preview/
│   ├── component/      # Component builder, CSS/JS bundling, SSR rendering, validation
│   ├── component.ts    # Component transformer entry point, shared styles processing
│   └── types.ts        # Preview/component type definitions
├── plugins/            # Build plugins (React SSR render, Angular render, Handlebars previews, CSF render with per-preview/story usage generation); each also emits the custom preview render shell
├── docgen/             # React component documentation generation
├── utils/              # Build utilities (handlebars, schema, HTML, SVG sprites, Vite logger, usage snippet helpers, render-shell.ts for the preview document, the custom preview shell and its postMessage protocol, frame-layout.ts for element frame layout and background, angular.ts for the Angular toolchain and input extraction, tsconfig-paths.ts for workspace `paths` imports, type-nodes.ts for the TypeScript-to-docgen type tree, stylesheets.ts for the files a stylesheet loads)
├── plugins.ts          # Barrel re-exports for plugins
├── vite-config.ts      # Shared Vite configuration
└── types.ts            # Transformer-level type definitions
```

## Preview frame layout

Each plugin passes its preview documents and render shell through `frameDocumentFor()` (`utils/frame-layout.ts`). A component of type `element` (the default) gets a style that centers its specimen in the frame, with a 100px minimum body height. Other types, such as `block`, keep the bare `<body>`, because a full-width block would shrink under the centering grid.

Element frames also clear their page background while the frame URL ends with `#handoff-background=transparent`. The docs app sets that fragment with `frameUrlWithBackground()`, so switching does not reload the frame.

## Client-rendered previews

A renderer whose client artifact, `component/<id>.client.js`, renders its previews in the browser
shares one contract:

- **Browser**: the client source includes `CLIENT_RENDER_RUNTIME_SOURCE` (`utils/render-shell.ts`) and
  calls `mountPreviews(componentId, mount)`. `mount(container, { hydrate })` returns a `render(args)`
  function. The runtime finds every mount point (the custom preview shell, the standalone `#root` with
  its `#__APP_PROPS__` script, and each pattern mount marked `[data-handoff-component]`), parses the
  props, and reports render errors to the docs app.
- **Build**: `emitClientPreviews()` (`plugins/client-previews.ts`) emits each preview document, its
  `-inspect` twin, and the render shell, and fills the component record.

React (`plugins/ssr-render.ts`) bundles its client with esbuild and passes server markup, which its
mount hydrates. A renderer that renders only in the browser uses `clientRenderPlugin()` instead. It
supplies a `ClientRenderer` (the client source, the properties, a usage function, and its watch
files) and adds its own Vite plugins. The preview build then bundles the client source as its entry. The client source resolves
its imports from the component file, so both use one copy of the framework. Stylesheets that the build
extracts, such as a stylesheet that a component imports, go into the client artifact, which injects them when it loads:
no document references an extracted file.

A client-only renderer passes no markup, so `hydrate` means only that the container is not the custom
preview shell. A renderer that adds a server render later passes `markup` to `emitClientPreviews()` and
hydrates when `hydrate` is true, as React does in `plugins/ssr-render.ts`.

## Framework tooling

Handoff ships nothing that belongs to one framework. A renderer loads its framework and its Vite
plugin from the workspace, lazily, only when one of its components builds. `utils/workspace-packages.ts`
holds the shared parts:

- `requireWorkspacePackages()` checks that each package exists in a supported version. One error lists
  every missing or unsupported package, with the `npm install` command that fixes them.
- `useHandoffVite()` makes a workspace Vite plugin import Handoff's Vite. The plugin is a peer of
  Vite, so it would otherwise resolve the workspace's Vite, which can be a different copy. A Node
  resolve hook redirects the plugin's `vite` imports.

`package.json` declares each plugin as an optional peer dependency, so npm never installs it into a
project that does not use the renderer, and warns about an unsupported version.

## Angular previews

`plugins/angular-render.ts` builds an Angular item with `clientRenderPlugin()`. The workspace supplies
Angular 19 or later, `@angular/build`, and `@analogjs/vite-plugin-angular`, which drives the
`@angular/build` compiler. `requireWorkspacePackages()` (`utils/workspace-packages.ts`) checks them and
their versions, and `useHandoffVite()` makes the plugin import the Vite that runs the build.

1. `utils/angular.ts` writes `.handoff/.cache/angular/<id>.tsconfig.json`. It extends the workspace
   config, lists only the component, and turns emit on, because an editor-only config often sets `noEmit`.
   `tsconfigPathsPlugin()` (`utils/tsconfig-paths.ts`) resolves the workspace `paths` imports, which Vite does not read.
2. `readAngularComponent()` reads the selector and the inputs from the compiler's resolved directive
   metadata, so aliases, required inputs, `model()` and inherited inputs follow Angular's rules. The
   TypeScript checker resolves each input type into the docgen `deepType` tree. Parsed library
   declarations are shared by every program of the workspace.
   - Properties are keyed by class property name. Each property's `name` is the public input name,
     which the usage snippet binds.
   - Preview args can use either name. When both are given, the class property name wins, in the
     client mount and in the usage snippet.
   - The program also lists the `templateUrl` and `styleUrl` files, which the plugin adds as watch
     files, so the build cache, `start`, and `publish` track them. `clientRenderPlugin()` adds the
     files that each stylesheet loads, such as Sass partials, from Vite's `preprocessCSS()` with the
     build's config (`utils/stylesheets.ts`). A change to a shared partial rebuilds every component
     that uses it.
3. The Vite build type-checks and compiles the component ahead of time, so a template error fails the
   build with its location. The client artifact uses zone.js change detection when the workspace has
   `zone.js`, and zoneless change detection otherwise. A render with the same inputs updates the
   component in place; a render that drops an input creates a new component. There is no server
   render, so the preview documents carry no markup and the component has no HTML view.
