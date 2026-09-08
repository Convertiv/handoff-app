# Upgrade Handoff

This document contains migration steps for each major version upgrade.

## Version 1.x.x to version 2.x.x

This guide describes how to upgrade a Handoff project from version 1.x.x to version 2.x.x.
Each feature section identifies the affected projects and the required changes.

### Before you start

1. Verify that the project builds with its current Handoff version.
2. Save the project files, package version, and lockfile in version control.
3. Install the version 2.x.x package that you plan to use.
4. Apply the migration sections that affect your project.

### Breaking changes

| Change | Affected projects |
| --- | --- |
| [Catalog items](#catalog-items) | Projects with component or pattern declarations |

<!-- Add future breaking changes as feature sections before "Verify the upgrade". Add each section to this table. -->

### Catalog items

#### Affected projects

This change affects projects that use the old component or pattern registration API.
It also affects projects that use the deprecated API from an earlier version 2.x.x prerelease.
Version 2.x.x requires `defineCatalogItem` for implementations and compositions.

#### Register catalog directories

Move component and pattern directories from `entries` to `catalog.include`.

Version 1.x.x:

```js
entries: { components: ['components'], patterns: ['patterns'], scss: 'styles/main.scss' }
```

Version 2.x.x:

```js
catalog: { include: ['components', 'patterns'] },
entries: { scss: 'styles/main.scss' }
```

Each path can name one item directory or a collection of item directories. Global `entries.js` and `entries.scss` still work.

#### Convert declaration files

Use `<name>.handoff.ts`, `<name>.handoff.js`, or `<name>.handoff.cjs`.
Replace legacy filenames such as `button.json` or `button.js`.

Version 2.x.x does not support JSON item declarations, including `.handoff.json`.
JSON project config (`handoff.config.json`) remains supported.

If `runtime.workspace.declarationFormat` is `json`, change it to `ts`, `js`, or `cjs`. The default remains `ts`.

#### Replace declaration helpers

| Removed API | Replacement |
| --- | --- |
| `defineReactComponent(Component, config)` | `defineCatalogItem({ ...config, implementation: Component })` from `handoff-app/react` |
| `defineHandlebarsComponent(config)` | `defineCatalogItem({ ...config, implementation: './Button.hbs' })` from `handoff-app/handlebars` |
| `defineCsfComponent(config)` | `defineCatalogItem({ ...config, implementation: fromCSF('./Button.stories.tsx') })` from `handoff-app/react` |
| `defineComponent(config)` | `defineCatalogItem({ ...config, implementation: { renderer: 'react', file: './Button.tsx' } })` from `handoff-app` |
| `definePattern({ components })` | `defineCatalogItem({ composition })` from `handoff-app/pattern` |

Remove the old `renderer`, `entries.component`, `entries.template`, and `entries.story` fields.
The implementation supplies the renderer and source file.
Keep the supporting `entries.js`, `entries.scss`, `entries.schema`, and `entries.templates` paths that your item uses.
Rename the metadata fields:

| Old field | Version 2.x.x field |
| --- | --- |
| `title` | `name` |
| `should_do` | `shouldDo` |
| `should_not_do` | `shouldNotDo` |

##### React

```ts
import { defineCatalogItem, type Preview } from 'handoff-app/react';
import Button from './Button';

const item = defineCatalogItem({
  name: 'Button',
  implementation: Button,
  entries: { scss: './button.scss' },
});
export default item;
export const Primary = { args: { children: 'Save' } } satisfies Preview<typeof item>;
```

Imported components retain their prop types. A file path also works: `implementation: './Button.tsx'`.
Keep implementation files inside the item directory to publish them.

##### Handlebars and CommonJS

```js
const { defineCatalogItem } = require('handoff-app/handlebars');

exports.default = defineCatalogItem({
  name: 'Badge',
  implementation: './Badge.hbs',
});
exports.Primary = { args: { children: 'New' } };
```

Use this form in `.handoff.js` or `.handoff.cjs`. JavaScript declarations can also use `import` and `export`.

##### CSF

```ts
import { defineCatalogItem, fromCSF } from 'handoff-app/react';

export default defineCatalogItem({
  name: 'Button',
  implementation: fromCSF('./Button.stories.tsx'),
});
```

CSF is a React source format. The story file supplies the previews.
The filename does not select CSF automatically.
The equivalent explicit source from the package root is:

```ts
import { defineCatalogItem } from 'handoff-app';

export default defineCatalogItem({
  implementation: { renderer: 'react', format: 'csf', file: './Button.stories.tsx' },
});
```

##### Compositions

```ts
import { defineCatalogItem } from 'handoff-app/pattern';

export default defineCatalogItem({
  name: 'Toolbar',
  composition: [{ ref: 'button', preview: 'Primary', args: { children: 'Save' } }],
});
```

Rename `components` to `composition`.
Rename each member's `id` to `ref`.
Keep item IDs stable.

#### Export previews

Remove the inline `previews` map.
Export each preview beside the default catalog item.
Rename preview `title` to `name`.
Rename `values` to `args`:

```ts
export const Primary = { name: 'Primary action', args: { children: 'Save' } };
```

If a preview key is a valid export name, preserve its spelling and capitalization.
If a key is not a valid export name, rename it.
Update composition references to each renamed preview.

Previews appear in source export order.

For CommonJS declarations, use `exports.default` for the item.
Use a named export such as `exports.Primary` for each preview.

#### Replace declaration types

Replace imports of the removed types:

| Removed type | Replacement |
| --- | --- |
| `Component` | `CatalogItem` |
| `DeclarationPreview` | `CatalogPreview` or `Preview<typeof item>` |
| `PatternComponentRef` | `CompositionRef` |
| `ReactDeclarationConfig`, `HandlebarsDeclarationConfig`, `CsfDeclarationConfig` | The catalog helper's input type |
| `GenericDeclarationConfig`, `GenericPatternDeclarationConfig` | The catalog helper's input type, or `CatalogItemMeta` for shared metadata |

`RendererKind` comes from the catalog API and contains `react` and `handlebars`.
CSF uses `renderer: 'react'` with `format: 'csf'` inside `implementation`.

#### Registry projects

Checkout writes only catalog declarations.
Registry records require explicit renderer and source-format metadata where applicable.

### Verify the upgrade

After you apply the required migrations, verify the project:

1. Build the project with version 2.x.x.
2. Verify that all expected catalog items appear in the documentation.
3. Verify the preview order, arguments, and composition references.
4. Start the workspace with file watchers.
5. Edit a declaration to verify that its previews update.

If the project uses a registry, verify the published items:

1. Publish the migrated items.
2. Verify that checkout produces valid declarations.
3. Rebuild the checked-out items.
