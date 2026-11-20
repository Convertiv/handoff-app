# Handoff API

Register implementations and compositions with `defineCatalogItem`. See the
[catalog examples](../README.md#catalog-items) and [version 1.x.x to version 2.x.x migration guide](../UPGRADE.md#version-1xx-to-version-2xx).

Handoff exposes two APIs - A Javascript API for interacting with the pipeline
Handoff exposes a Javascript API allowing you to easily integrate Handoff into
existing Node based applications, CI/CD, and command line tools. This API also
allows you to hook into the pipeline execution and generate new build artifacts
during the execution.

## Example Project

Here's a demo project you can check out to get started fast
https://github.com/Convertiv/handoff-0-6-0/

## Get Started

1. Run `npm install --save handoff-app`
2. Add handoff to your code. Create `handoff.ts`

```js
import Handoff from 'handoff-app';

const handoff = new Handoff();
handoff.fetch();
```

3. Build your typescript `tsc`
4. Run your project `node handoff.js`

## Configuration profiles

A profile is a sidecar config file, `handoff.config.<profile>.*`, that merges
onto the base config. The CLI selects one with `--profile`, and the class takes
it as a constructor option. Handoff reads `HANDOFF_PROFILE` when neither is
given.

```js
const handoff = new Handoff({ profile: 'registry' });
```

A profile also names the saved registry login that `publish` and `checkout`
use, so one workspace can address several registries. `profileWithoutConfig`
decides what a profile may resolve to when it has no config file:
`'saved-login'` accepts a name a saved login uses, and `'any'` accepts any
valid name, which is how `login` creates a new one.

```js
const handoff = new Handoff({ profile: 'staging', profileWithoutConfig: 'saved-login' });
```

`defineConfig` types a profile as well as a base config.

```ts
import { defineConfig } from 'handoff-app';

export default defineConfig({
  runtime: { registry: { database: { driver: 'neon' } } },
});
```

## Methods

Methods of the handoff class can be called to run actions in the

### init

```js
handoff.init();
```

Init will check and build the local state, including the configuration. You
probably don't need to call this method since it is executed as part of the
class constructor

### fetch

```js
handoff.fetch();
```

Fetch reads the Figma file ID and access token from `integrations.figma`. By
default, they come from `HANDOFF_FIGMA_PROJECT_ID` and
`HANDOFF_DEV_ACCESS_TOKEN`. In a terminal, fetch asks for an empty value.
Without a terminal, it throws `HandoffConfigError`. Then it exports all of the
tokens and generated data into an `exported` directory in the local working
root.

### build

```js
handoff.build();
```

Build will take the exported artifacts and build a react documentation site from
those artifacts. The build html site will be exported to the `out` directory
in the current working root

This method will throw an error if the `exported` directory or the `tokens.json`
files do not exist

It also throws an error if a component does not build or its declaration does
not load. The other components build first, and the error message lists every
item that failed.

### integration

```js
handoff.integration();
```

The integration method will run just the preview and integration generation.
This step is done as part of the build step, but its often useful to be able
to generate only the integration code.

## Hooks

Hooks let you extend the build and preview pipeline. Configure them in
`handoff.config.js` (or `.cjs`) under the top-level `hooks` object. Hook names
use camelCase (for example `validateComponent`, `jsBuildConfig`,
`registerHandlebarsHelpers`). The Handoff CLI and Node API load this config when
the `Handoff` instance is created.

```js
// handoff.config.js
module.exports = {
  // …
  hooks: {
    registerHandlebarsHelpers: ({ handlebars, componentId }) => {
      handlebars.registerHelper('upperId', () => componentId.toUpperCase());
    },
  },
};
```

### registerHandlebarsHelpers

Called immediately after Handoff registers built-in Handlebars helpers (`field`
and `eq`) while rendering **Handlebars** component previews (static HTML per
variation). Use it to call `handlebars.registerHelper` for custom helpers used
in your `.hbs` templates.

**Arguments (single context object)**

* `handlebars` — The Handlebars runtime (same as importing `handlebars`); use
  `registerHelper`, `SafeString`, etc.
* `componentId` — The current component’s id string.
* `properties` — The component’s slot metadata map from the schema (same shape
  as used by the `field` helper).
* `injectFieldWrappers` — `true` when generating inspect-mode previews (field
  inspection markup), `false` for normal previews.

**Return**

* `void` — register helpers on `handlebars` directly.

**Notes**

* This hook runs once per preview render (each variation × normal vs inspect).
* Registering the same helper name again replaces any previous registration for
  subsequent renders in the same process.

**Example**

```js
// handoff.config.js
module.exports = {
  hooks: {
    registerHandlebarsHelpers: ({ handlebars, componentId, injectFieldWrappers }) => {
      handlebars.registerHelper('debugPreview', function () {
        return injectFieldWrappers ? '[inspect]' : '[preview]';
      });
      handlebars.registerHelper('componentLabel', () => componentId);
    },
  },
};
```

### postBuild

This function is called after the app build is complete.

**arguments**

* `tokens: DocumentationObject` This is an instance of the exported
  DocumentationObject containing all of the tokens.

**returns**
Nothing is returned from the postBuild hook

### postCssTransformer

This function is called after the css generation is complete. It allows an
application to alter the css generation in transit

**arguments**

* `tokens: DocumentationObject` This is an instance of the exported
  DocumentationObject containing all of the tokens.
* `css: CssTransformerOutput` This is an object containing all of the
  tokens for components and foundations, formatted as CSS variables

**returns**

* `css: CssTransformerOutput` This is an object containing all of the
  tokens for components and foundations, formatted as CSS variables.
  Any changes you return here will be written to the css files

### postCssTransformer

This function is called after the css generation is complete. It allows an
application to alter the css generation in transit. It will allow you to alter
the transformed output prior to being written to disk.

**arguments**

* `tokens: DocumentationObject` This is an instance of the exported
  DocumentationObject containing all of the tokens.
* `css: CssTransformerOutput` This is an object containing all of the
  tokens for components and foundations, formatted as CSS variables

**returns**

* `css: CssTransformerOutput` This is an object containing all of the
  tokens for components and foundations, formatted as CSS variables.
  Any changes you return here will be written to the css files.

### postScssTransformer

This function is called after the scss generation is complete. It allows an
application to alter the scss generation in transit. It will allow you to alter
the transformed output prior to being written to disk.

**arguments**

* `tokens: DocumentationObject` This is an instance of the exported
  DocumentationObject containing all of the tokens.
* `scss: CssTransformerOutput` This is an object containing all of the
  tokens for components and foundations, formatted as SCSS variables

**returns**

* `css: CssTransformerOutput` This is an object containing all of the
  tokens for components and foundations, formatted as SCSS variables.
  Any changes you return here will be written to the scss files.

### postTypeTransformer

Handoff generates a set of scss files that list all the possible types of
a component (type, state, activity, size, theme, etc.). This allows frontend
engineers to iterate over the types and build scss maps with the variables.

This function is called after the type generation is complete. It allows an
application to alter the type generation in transit. It will allow you to alter
the transformed output prior to being written to disk.

**arguments**

* `tokens: DocumentationObject` This is an instance of the exported
  DocumentationObject containing all of the tokens.
* `scss: CssTransformerOutput` This is an object containing all of the
  type arrays for components and foundations, formatted as SCSS variables

**returns**

* `css: CssTransformerOutput` This is an object containing all of the
  tokens for components and foundations, formatted as type variables.
  Any changes you return here will be written to the scss type files.

### modifyWebpackConfig

When the application is built, Handoff uses webpack to compile css, scss,
and javascript in the entry point to build a little live preview of the
components. This hook accepts a webpack.Configuration as the first argument
and allows you to alter and return that configuration.

**arguments**

* `webpackConfig: webpack.Configuration` This is a full webpack configuration.

**returns**

* `webpackConfig: webpack.Configuration` Return the webpack configuration that
  you have altered to fit your needs.

**Example**

```js
export const modifyWebpackConfigForTailwind = (webpackConfig: webpack.Configuration): webpack.Configuration => {
  // Enable webpack dev mode
  webpackConfig.mode = 'development';
  return webpackConfig;
};
```

### configureExportables

This hook allows you to alter the exportable list. You could do this by ejecting
the handoff configuration and modifying the list, but this hook allows you to
alter the exportable list with just a couple of lines of code rather than
exporting the whole list

**arguments**

* `exportables: string[]` The current list of exportables

**returns**

* `exportables: string[]` Return the list with whatever additions and subtractions
  you need for your application.

## Screens

Screens have two entry points. Both are versioned public API, and neither loads
the CLI. The [README](../README.md#screens) explains the files and the rules.

### `handoff-app/screens`

Use it in `index.tsx` and its imports. `collections.ts` may use only the
definitions, the helpers and the types.

**Definitions**

* `defineScreen({ title, description?, icon?, nav?, access?, fullscreen?, component })`
  Declares the screen. Default-export the result. Write every option except
  `component` as a literal. `fullscreen` is `true` or a list of path patterns,
  such as `['*/view']`, shown without the docs header.
* `defineCollection({ name, version?, schema, migrate?, mcp? })` Declares a
  collection. The document type comes from `schema`.
* `DocumentOf<typeof collection>` The document type of a collection.
* `ComponentInstance` `{ id, componentId, args }`: one placed component.

**Helpers** (they run anywhere)

* `createInstance(componentOrId, { args?, preview? }?)` A new instance. A
  `ComponentInfo` gives it the component's default args, or the args of the
  named `preview`. `args` wins over both.
* `expandPattern(pattern)` A pattern's components as new instances.
* `insertAfter(list, items, afterId?)`, `moveTo(list, id, position)` Reorder a list
  of items with ids.
* `assessComponentArgs(contract, args)`, `assessInstance(instance, component)`
  Check args against a component's current contract.
* `emptyValue(schema)`, `validateValue(schema, value)` Work with a schema.

**Hooks and components** (they run only inside the docs app)

| API | Returns or renders |
| --- | --- |
| `useCollection(c, query?)` | `{ documents, status, error, hasMore, loadMore, create, remove, refresh }` |
| `useDocument(c, id)` | `{ id, data, revision, status, error, update(fn), save, refresh, resolveConflict(keep) }` |
| `useComponents({ search?, filter? })` | `{ data: ComponentSummary[], groups, status, error }` |
| `useComponent(id)` | `{ data: ComponentInfo }` with `contract`, `argsSchema`, `defaultArgs`, `previews` |
| `loadComponent(id)` | `Promise<ComponentInfo \| null>`, for event handlers |
| `usePatterns({ search?, filter? })` | `{ data: PatternInfo[], groups }`, each with its components and args |
| `useDocsApi(path)` | Any docs read API path, such as `tokens/foundations/colors.json` |
| `useSession()` | `{ mode, user, canRead, canWrite, status }` |
| `useScreenRoute()` | `{ screenId, params, navigate(params), href(params), url(params) }`; `url` is the full URL, for a link to send |
| `useCustomPreviews(componentId)` | Saved custom previews (registry only) |
| `useAssistantContext(value)` | Sends `value` with each question asked on the screen |
| `useInstanceAssessment(items)`, `assessInstances(items)` | Issues per instance id |
| `isScreenChrome(target)` | `true` for an event in the assistant column or in a dialog, menu, list or popover open on top of the screen |
| `ScreenLayout` | `toolbar`, `left`, `assistant`; `.Panel`, `.Status`, `.Action`, `.Divider`, `.Spacer` |
| `ComponentCanvas` | `items`, `viewport`, `zoom`, `selectedId`, `onSelect`, `empty`, `onRenderError`, `mode?` (`edit` or `view`) |
| `ComponentPreview` | `id`, `previewKey?`, `thumbnail?` |
| `CustomPreview` | `componentId`, `id` |
| `ArgsForm` | `contract`, `value`, `onChange`, `fields?`, `disabled?` |
| `DocumentMenu` | `collection`, `current`, `onOpen`, `titleField?`, `create?`, `autoOpen?`, `noun?` |
| `ViewportToggle` | `value`, `onChange`, `zoom?`, `onZoomChange?`, `zoomLevels?` |
| `ui` | Curated primitives: `Button`, `Input`, `Label`, `Badge`, `Card*`, `Dialog*`, `Separator`, `Grid`, `SearchInput`, `EmptyState`, `Loading`, `AddButton`, `SortableList`, `ListRow`, `SegmentedControl`, `Icon` |

**Choose the components a screen offers**

`filter` keeps the components a screen offers. `search` then narrows them. Search
reads the id, title, description, group, categories and tags. `groups` lists the
groups of the filtered components, so a search does not change them. Narrow by
group in the screen.

Define the filter once in `collections.ts`. Pass it to `useComponents` and to
`docs.components()` in `tools.ts`, and check it in tools that place components.
The assistant can find any component through the built-in tools, so a filter in
the UI alone does not limit it. Define the filter outside render.

```ts
// collections.ts
export const offered = (component: ComponentSummary) => component.group !== 'Examples';

// index.tsx
const components = useComponents({ search, filter: offered });

// tools.ts
const component = await docs.component(componentId);
if (!component || !offered(component)) return toolError(`"${componentId}" is not offered on this screen.`);
```

`ArgsForm` shows every property. Pass `fields` to show only some, in that order.
The other properties keep their values.

### `handoff-app/screens/server`

Use it only in `tools.ts`.

* `defineScreenTools((context) => tools)` The default export of `tools.ts`.
  `context` has:
  * `collections.get(c)` A typed store: `get(id)`, `list(query)`,
    `create(data, { id? })`, `put(id, data, { revision? })`, `update(id, fn)`
    (retries when another write lands first) and `remove(id)`. Each stored
    document has `ref`, which `toolResult` takes in `changed`.
  * `docs` `component(id)`, `components({ search?, filter? })`, `pattern(id)`,
    `patterns({ search?, filter? })`, `assessArgs(component, args)`.
  * `caller` The registry user, or `null` in a workspace.
* `defineTool({ name, description, inputSchema, scope?, readOnly?, title? }, handler)`
  One tool. `handler` gets args typed from `inputSchema`.
* `toolResult(payload, { changed? })`, `toolError(message)` The two results.
* `ScreenDataError` What a store throws: `not_found`, `conflict`, `invalid`,
  `forbidden`, `too_large`. A tool returns its message to the agent.
