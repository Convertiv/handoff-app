# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.4] - 2023-10-02

### Bugfix

- Nextjs released 13.5.x which has a type conflict with the handoff build.  This release instructs package.json to stay with 13.4.x while the conflict is resolved.

## [0.8.3] - 2023-09-27

### Changes

- Added support for custom export path. This allows anyone using Handoff app to specity a path into which a copy of the exported tokens should be placed simply by defining `EXPORT_PATH` within the .env file.

### Improvements

- Better handling of ejected themes.

## [0.8.2] - 2023-09-21

### Changes

This release is focused on enabling Handoff users to disable any of the built in components (esentially prevent them from being exported). While this was possible in previous releases, it could cause issues when running the integration builds.

This improvements was achieved by:

- Moving component specific SCSS variables into respective files which can be included (imported) when tokens used in those files are considered to be present.
- Implementing the SCSS import tokens which enables the main SCSS integration file to use import tokens in place where the import statements for component tokens, maps and extensions would usually be placed. Import tokens get replaced with actual import statements during the integration build. Following import tokens are supported with this release:
  - `//<#HANDOFF.TOKENS.TYPES#>`
  - `//<#HANDOFF.TOKENS.SASS#>`
  - `//<#HANDOFF.TOKENS.CSS#>`
  - `//<#HANDOFF.MAPS#>`
  - `//<#HANDOFF.EXTENSIONS#>`

As a side effect, the `node-sass-glob-importer` package depenedency is no longer needed as there is no longer need for "globbing" to be used when doing imports of exported component tokens since `//<#HANDOFF.TOKENS.TYPES#>`, `//<#HANDOFF.TOKENS.SASS#>` and `//<#HANDOFF.TOKENS.CSS#>` import tokens now provide basically the same functionality.

Because of changes mentioned above, this release does require some modifications to the **already ejected integrations** in order for the project to be completely compatible with the new version of Handoff.

Here are the steps that need to be done:

#### 1. Remove glob import statements and replace them with respective import tokens

Replace glob import lines with the respective import tokens. Note that design foundation tokens are manually imported as the tokens only handle imports related to the exported components.

*Before the new release:*

```scss
@import './exported/tokens/types/*';
@import './exported/tokens/sass/*';
@import './exported/tokens/css/*';
```

*With the new release:*

```scss
@import './exported/tokens/types/typography';
@import './exported/tokens/types/effects';
@import './exported/tokens/types/colors';
//<#HANDOFF.TOKENS.TYPES#>
@import './exported/tokens/sass/typography';
@import './exported/tokens/sass/effects';
@import './exported/tokens/sass/colors';
//<#HANDOFF.TOKENS.SASS#>
@import './exported/tokens/css/typography';
@import './exported/tokens/css/effects';
@import './exported/tokens/css/colors';
//<#HANDOFF.TOKENS.CSS#>
```

#### 2. Include the (exported) component specific variables by using HANDOFF.MAPS import token

Add the `//<#HANDOFF.MAPS#>` replace token below the `@import 'variables'` statement. This will ensure that all variables related to the exported (built-in) components are correctly loaded.

*Before the new release:*

```scss
$prefix: '';
@import 'variables';
```

*With the new release:*

```scss
$prefix: '';
@import 'variables';
//<#HANDOFF.MAPS#>
```

#### 3. Replace the imports statements used to extend default Bootstrap components with HANDOFF.EXTENSIONS import token

Replace all import statements used to extend the default Bootstrap components with the new `//<#HANDOFF.EXTENSIONS#>` import token to ensure that only those files that are related to the components that are actually being exported get imported.

*Before the new release:*

```scss
@import 'extended/alert';
@import 'extended/button';
@import 'extended/checkbox';
...
```

*With the new release:*

```scss
//<#HANDOFF.EXTENSIONS#>
```

#### 4. Eject the latest version of the integration used

Due to changes made to the `variables.scss` file and most of the scss files in the `maps` directory for the the Bootstrap version 5.2 and 5.3 interations, it's recommended to do a integration eject (after updating to Handoff 0.8.2) to ensure that your project continues to work correctly. Please remember to do a backup of your current work before doing this.

### Bugfixes

* Updated the preview client build to not include the main SASS integration file as a extra integration in order to prevent redundant loading of the integration which caused the client bundle size to be double the size than it really needed to be while also causing few more issues in the new release where the styles wouldn't get applied correctly.

## [0.8.1] - 2023-09-06

### Cleanup

- Updated `Token` interface so that all properties other than `property` or `value` are now moved to `metadata`.
- Updates to reflect the changes made to the `Token` interface.
- General improvements to code quality and consistency.

## [0.8.0] - 2023-08-22

This release is focused primarily on improving the way Handoff fetches data from figma. These changes are subtle, and do not bring any major use experience change. As we used Handoff with a wider variety of Figma design systems, we noticed that the schemas couldn't quite capture all of the various component structures.

In Figma, every component has a set of properties. These are used for categorizing the component and declaring use and behavior. These are things like - type, theme, state etc. Handoff's schemas allowed you to choose which of those properties would be pulled from a component, but did not allow you to rename or declare custom properties. This is because these properties often create semantic or behavioral meaning.

This release allows you to name and configure these properties, and map them to the sematic or behavioral meaning. This allows designers to name things according to internal conventions, localize prop names, and declare new custom properties to ingest.

### Changes

- Exportable (JSON file) now has a updated syntax to share variant over multiple design components based on the variant props.
  - `supportedVariantProps` now accepts an object rather than an array. This object has two properties `design` and `layout`. Users should declare the props that should be pulled as an array of each of these props. The props should be the name as it is in Figma, not the old key names Handoff used to require.
  - The previous templates for css and scss token patterns have been removed in favor of `tokenNameSegments`. This a tokenized array of strings that allow you to generate token names for each component following a pattern. 
  - In the `demo` section, under the tabs, you can now declare the default value for each property.
  - In the `demo` section, under `designTokens` you can explicitly declare all the values of a property to show on the demo page.
  - Previously you could do `State(:disabled)` which would automatically apply the "disabled" state to all design components, distinctive only by the theme (which means light theme would have one shared disabled state while dark theme would have a different one).
  - The update allows you to do this `State(:disabled/Theme)` which removes the need for us to know what the theme variant property is and to allow users to distinct over any variant property they have and desire.
  - This allows handoff to choose NOT to group/distinct by any variant property. Previously this was not possible as if there was a theme variant property present, it would be automatically used to group by it. 
- Paths for preview templates now account for all variant properties, but, if some of them are missing in the integration templates folder for the component, it will be dismissed and we will try starting from the next one (for example, if theme is not there as a folder, we will ignore it and proceed to the next variant prop and so on). This also removes the need for us to know what the theme variant property is as we don't need to filter them out based on if it's a theme variant prop or not.
- Component titles in the app now have a smarter way of automatically determining the title of the preview component. This is achieved by looking into the filters used to display the previews of the components and decide which variant property you probably want to use in the name of the component preview.

### Bugfixes

- Node Sass version has been locked at version `1.64.2`. `1.65.0` introduces a breaking change and we need to update the maps before upgrading to it.

### Documentation

- The repository readme has been rewritten to follow the standard npm readme format.

## [0.7.4] - 2023-07-31

### Changes

- Allows handoff to load files from a `public` dir in the working root so that assets can be published to the app

## [0.7.3] - 2023-07-31

This release allows custom theme files in the working directory to override the main theme

### Changes

- Added `eject:theme` which will eject the currently set theme into `theme/main.scss`
- A new config `theme` has been added to allow toggling between themes. At present only a single default theme is provided
- Improvements to cli help text

### Cleanup

- Removes unneeded template files from the root dir

## [0.7.2] - 2023-07-31

This release improves existing functionalities and issue detected within the design system app.

### Changes

- Component style maps placed in `integration/scss` are now read in at build time allowing developers to provide custom scss mappings for components.
- If a folder `theme/main.scss` is found in the working root of the project, that file will be included at build time to allow styling the app.
- Globbing is now supported in scss integrations allowing more flexible ingest of component variables
- Added `make:page` command to CLI for creating custom pages or editing existing pages
- Adds a flattening algorithm when color blending on properties that do not support blending like `color` and `border-color`
- Purge the app build cache when restarting the app to prevent cache from holding old copies of customized files.

### Bugfixes

- Fixes a bug with a missing `border-style` property when fetching from figma
- Resolves issues where scss files in custom integration were not read.

## [0.7.1] - 2023-07-21

This release improves existing functionalities and issue detected within the design system app.

### Changes

- Added button to download AWS Style Dictionary tokens for exportables and foundations being colors, effects and typography. [CONVHAND-283]
- Introduced `DocumentationWithTokensProps` interface to reduce redundancy in the codebase. [CONVHAND-283]
- Added `make:template` command to CLI for creating custom templates

### Bugfixes

- Ensures design system app didn't check the project path for defined exportables. [CONVHAND-285]
- Ensures that individual design system app pages read locally defined exportables
- Corrects bug in capitalization of autogenerated exportable
- Fixes a typing bug in the app that would throw a build error when running without dependencies

## [0.7.0] - 2023-07-14

This release introduces support for AWS Style Dictionaries - https://amzn.github.io/style-dictionary/#/. Style dictionary is a widely used token format that can be compiled down to a number of application formats using the AWS Style Dictionary CLI tool.

You will find the new style dictionary output in the exported artifact at `./exported/tokens/sd`.

### Changes

- Added support for Style Dictionary export.
- `ValueProperty` is now `Token` and it can now carry additional metadata (added `isSupportedCssProperty` metadata property).
- All transformers now return data as the same `TransformerOutput` interface type. All other interfaces such as `CssTransformerOutput` and `ScssTransformerOutput` have been removed entirely.
- Updated function and variable names to be more concise and provide more information about what they do.
- Restructured the documentation app to use CSS variables in preparation for user theming. Following styles can be changed:
  - Global typography, header, side nav and anchor nav. Custom user theme examples coming in the next release.
- General quality of life improvements.

### Bugfix

- Updated readme to correct quickstart guide for CLI
- Fixes a bug where the integration is ejected but not read, even when the integration is set to custom.
- Remove defunct default icons from top of assets page

## [0.6.1] - 2023-06-28

### Bugfixes

- Resolves an issue with level two paths in the app not rendering right
- Resolves an issue if the project env is set to production but the app start mode is run

## [0.6.0] - 2023-06-28

0.6.0 introduces two major new tools that will make it much easier to integrate Handoff with existing projects and data pipelines. This release also reorganizes the Handoff code to make the pipeline significantly more robust, easier to extend, and easier to use in existing projects. Our goal with this release is to establish a stable Typescript API as we approach a 1.0 release.

### Features

#### Handoff CLI

Handoff now comes with a CLI toolchain that allows you to run Handoff commands in any context. This CLI replaces the installer from previous versions to scaffold up projects in a directory.

- Can be installed globally as a node binary `npm i -g handoff-app`
- Run in any directory using `handoff-app <command>`
- Will detect in the current working root and use that config if present
- Has sane default configs that will work for normal projects
- All configurations are sparse, so you can override a single config file and the rest of the config will inherit the defaults
- Allows users to make config or eject the default config into the current working root
- Can be run interactively to configure a project or non-interactively with `env` variables
- Run `handoff-app --help` for a full list of commands
- See https://github.com/Convertiv/handoff-app/blob/main/docs/cli.md for documentation

#### Handoff Typescript API

Handoff now exposes a full typescript API published as commonjs modules. This API will allow you to use Handoff in your Node 16+ javascript or typescript projects. With just a few lines of code you can have Handoff run programmatically.

This API supersedes and replaces the plugin architecture introduced in 0.5.0. The API call structure is maintained, but now the API can be used directly in existing Node applications and can be used with typescript.

Here's a simple example that will fetch the data down. This example expects a DEV_ACCESS_TOKEN and a FIGMA_PROJECT_ID env variable, or those to be provided in `process.env`. If not supplied, they will be prompted for when the pipeline is run.

```js
import Handoff from 'handoff-app';
const handoff = new Handoff({
  title: 'Handoff Bootstrap',
  integration: {
    name: 'bootstrap',
    version: '5.3',
  },
});
await handoff.fetch();
```

- Fully typed API + full access to all the pipeline functions for transforming the tokens
- Methods to support fetching tokens, building the documentation app, building the integration, and running the app locally for testing
- A hook system allowing javascript functions to be passed as callbacks to be executed at points in the pipeline

```js
// This hook will execute after the integration step and allow you to extract
// data from the pipeline and write it to a file
handoff.postIntegration((documentationObject: DocumentationObject, data: HookReturn[]) => {
  const colors = documentationObject.design.color.map((color) => {
    return {
      name: color.name,
      value: color.value,
    };
  });
  data.push({
    filename: 'colors.json',
    data: JSON.stringify(colors, null, 2),
  });
  return data;
});
```

- API matches the methods of the CLI so you can script in code what you can do with the CLI
- See https://github.com/Convertiv/handoff-app/blob/main/docs/api.md for documentation

### Improvements

- The handoff code base was refactored to eliminate the monorepo architecture and consolidate on a more coherent package architecture. This refactoring eliminated a number of weak points and improves reliability.
  - Sharing code between the data pipeline and the Nextjs documentation app is safer
  - The hook architecture introduced in 0.5 was fragile and less secure than we wanted. This reorganization makes a much more robust API, with full access to the typings
  - The previous structure merged configurations in a way that could fail easily. The new architecture reads and merges the various Handoff configurations in a much more robust manor.
  - Previously handoff required a folder architecture, with the proper files, and could fail if those files were moved. Now Handoff can be run in an empty directory, and can accommodate configs being added and removed during operation.
- Upgrade Nextjs from 12 to 13 providing cleaner, faster application builds
- Tailwind integration hook has been added to the pipeline

### Bugfixes

- Fixes several style issues in the Bootstrap 5.3 release
- Corrects a missing caret in Bootstrap 5.2 and 5.3 selects

## [0.5.3] - 2023-06-16

This release adds Bootstrap 5.3 support with dark mode disabled by default.

### Changes

- Added Bootstrap 5.3 integration
- Bootstrap 5.3 is now the default integration
- Updated color preview in the Next.js app to work with color values such as linear-gradient(...) and rgba(...)

### Bugfixes

- Resolved a value normalization error in the Next.js app when normalizing value with multiple color layers

##### How to switch integrations

To use an integration change `client-config.js` to desired integration and version. For example:

```
integration: {
  name: 'bootstrap',
  version: '5.3',
},
```

Currently supported integrations:

- Bootstrap 5.2
- Bootstrap 5.3

## [0.5.2] - 2023-06-14

### Changes

- Tokens, changelog and previews are now read form the file system using the `fs.readFileSync` instead of the `import` statement.
- Updated the Next.js app pages to utilize `getStaticProps` for fetching of the configuration and the exported tokens.
- Removed `componentExists` utility method as it's no longer used
- Removed `mapComponentSize` utility method as it's no longer used

### Bugfixes

- By changing the way in which the configuration, tokens, changelog and previews are read and passed into the pages a bug has been resolved that would occur while running the `fetch` command while the `dev` command was already running which would cause the app from stop responding correctly and would require app restart.

## [0.5.1] - 2023-06-01

### Changes

- Minor release to increment the installer default version
- Adding documentation to exportables folder

## [0.5.0] - 2023-06-01

0.5.0 brings two major improvements

- Exportable schemas for Figma components
  - Allows Handoff to connect to any component set in Figma
  - Defines semantic meaning for components
  - Automatically generates well formed tokens based on object type
- Javascript plugins for each integration
  - Hooks into the Figma extraction and transformation
  - Allows Handoff projects to customize the artifacts
  - Created to support Tailwind theme.js and Wordpress theme.json artifacts

Also in 0.5.0 is improved bootstrap 5.2 support, a simple tailwind color
integration, and a cluster of bugfixes.

### Major Features

#### Exportable schemas

Exportable schemas allows Handoff to connect to any component sets in Figma and
generate tokens. In simple json, developers can define the structure of a Figma
component and what tokens to extract from each element. This allows Handoff to
adapt to the component set of any Figma file, and define semantic meaning for the
Figma component. This will enable many features going forward, including -

- Figma Linting
- Component Change Detection and Changelog
- Automatic Figma Schema Detection

Exportables are stored in `./exportables`. In 0.5.0 we only support exportable
components, so put component definitions in `./exportables/components`.
An exportable consists of 3 components -

- Metadata - describe the component (id, group)
- Options - control how the component is rendered in Handoff (tokens, preview)
- Parts - define the semantic structure of the Figma component

##### How to use exportables

Using exportables will allow quick tokenization of new components. For example,
here is an annotated exportable for badges, a component not currently supported
by handoff. https://www.handoff.com/docs/customization/exportables/#badgejson
If you add this file to `exportables/components` and add `components/badge`
to the `figma.definitions` in your config.js, Handoff will start looking for a
Badges component set, and generate tokens, css, scss, and types for you.

With no other changes, handoff will create a set of badge token files for you.
For example, it will render something like this for css variables -
https://gist.github.com/bradmering/020429c30f11d95bfb2577ea57809878. You can see
that creates a comprehensive list of all the tokens you would need to render
badges in a css frontend framework.

If you want badges to work in the Handoff component preview as well, you would
need to add a badge template to `integration/templates/badge/default.html`.
That file would look like this for Bootstrap 5.2 -
https://www.handoff.com/docs/customization/exportables/#adding-a-template-to-preview-the-new-exportable.

You would also want to map these tokens to the framework. This is how you might
do that in Bootstrap 5.2, adding this file to `integration/sass/extended/badge.scss`
https://www.handoff.com/docs/customization/exportables/#mapping-the-new-exportable-to-scss

#### Integration Plugin

Handoff allows users to integrate with particular frontend frameworks. We call
these integrations. We currently support bootstrap 5.2 out of the box.

0.5.0 now allows these integrations to hook into the data extraction pipeline
and modify the output, and optionally write files to the exported directory.
This will allow developers to tailor the Figma data pipeline to their needs.

##### How to use the Integration Plugin

To use this feature, create a `plugin.js` in the `integration` folder of your
project. This plugin will have access to any of the core node.js libraries
you need. Export a sandbox module like this -

```
sandbox.exports = {
  postCssTransformer: (documentationObject, css) => {
    // Modify the css variables prior to save
    return css;
  },
}
```

In this example, the plugin has the full documentation object available,
allowing it to query the object and then modify the css variables as needed.

Here's a simple plugin example that will read the tokens and write a simple
json file with an array of colors in it. -
https://www.handoff.com/docs/customization/plugins/#simple-example

Here is a comprehensive plugin.js showing all the options in 0.5.0 -
https://www.handoff.com/docs/customization/plugins/#full-example

#### Bootstrap 5.2 Mapping Improvements

In 0.5.0 the Bootstrap 5.2 integration was rewritten to simplify and rationalize
the way that tokens are being used. Since Bootstrap 5.2 is the first end to end
Handoff integration, these improvements will form the template for other
integrations.

#### Simple Tailwind 3.3 Integration

This release has a simple version of a Tailwind integration. It only supports
colors and typography right now. Its in this release to start testing with
simple tailwind projects.

To test it out, change the integration in the `config.js` to this -

```
integration: {
    name: 'tailwind',
    version: '3.3',
  },
}
```

### Bugfixes

- The new exportable schema has normalized the token output, fixing several small
  inconsistencies in the way tokens were created.
- Fixes a warning caused by loading the config into the next app outside of the
  static properties

## [0.4.3] - 2023-04-19

Continuing incremental improvement over the 0.4.0 release. This release fixes
a couple of small build inconsistencies, improves debug mode when running the
build and fetch, and creates a fast run mode.

### Improvements

- Errors in the webpack execution will now cause the fetch script to halt and
  bubble up into the error handling.
- Running build/fetch with `-- --debug` will now send the error trace from the
  webpack when building a preview. This is especially useful when there is an error
  either in the template or scss maps.
- Running build/fetch with `-- --fast` will execute the script but if there is
  already a built temp directory, it will use the built dir rather than recreating
  it. This speeds up runtime significantly. If this option is supplied but the
  temp dir does not yet exist, it will be created.

### Bugfixes

- The transformer stand alone pipelines weren't working. This release fixes that
  so executing `npm run transform:preview` or
  `node node_modules/handoff-app/scripts/fetch.js preview` will properly execute
  just a single portion of the pipeline rather than the whole pipeline.
- The default component guidelines were not rendering the `<ul>` wrapper for the
  subsequent lists.
- The bootstrap 5.2 scss mapping had an error that caused the carrot and icon
  on error and disabled state select boxes to display incorrectly.

## [0.4.2] - 2023-04-16

When 0.4.0 was released, we found a structural problem with the way
integrations were published into projects. 0.4.1 resolved a couple of issues,
but a couple of significant new pieces of code were required to fully resolve
the issue.

The resolution is fixing paths so that they work properly when running the
handoff source as well as running handoff in a project.

### Bugfixes

- Build and Start scripts were restructured to handle sparsely merging sass and
  templates into the source directory.
- The integration transformer was restructured to support correct path
- The webpack config has been altered to support paths in projects
- The bootstrap templates were updated to use this updated path structure

### Improvements

- The figma exporter built library built code is now published to the repo to
  make it easier to test pre release code
- A default config is now part of the project so that projects that can inherit
  a config rather than having to keep their config up to date.
- The installer now has the proper script paths in the package

## [0.4.1] - 2023-04-16

### Bugfixes

- Fixes a typing error in the project config
- Fixes an issue where the path of the integrations are relative to the project
- Fixes an issue where local integrations aren't properly merged on watch
- Updates the installed template to match the latest desired state

## [0.4.0] - 2023-04-16

This release introduces two major new features - framework integrations
and much better color support. The color support is straightforward - Handoff
now supports much broader color options from Figma including gradients (linear
and radial), as well as layered colors, alpha channels and blend modes.

Framework integrations is Handoff's new plugin architecture for integrating
tokens with popular web and application frameworks. Previous versions of Handoff
were tightly coupled with Boostrap 5.2 as a proof of concept.

To integrate tokens into applications, the tokens need to be mapped to the
the files you'll need. In web applications, this means mapping css and sass
variables to existing variables, or extending classes with the tokens.

When fetch is run, any files added to the `integration` folder will be merged
with the selected integration. The sass files will be published to
`/exported/{integration}-tokens`

Integrations also move the templates into integrations so each framework
integration can define the markup for each component, type, and state. This
allows handoff to include default markup for common frontend frameworks.

### Frontend Integration Support

- Creates integrations plugin architecture
- Extracts Bootstrap 5.2 from the sass and templates into an integration template
- Sets Bootstrap 5.2 as the default integration
- Adds an integration configuration to allow projects to define which integration
  it will use
- The `exported/variables` file was renamed to `exported/tokens`
- A new directory is exported to `exported/{integration}-tokens` containing the
  maps and extended sass integration files.
- The installer now creates a `/integration` folder that will be merged with
  the configured integration sass and templates.
- A zip file called tokens.zip is exported to the public directory containing
  all of the exported artifacts - json, integration, sass, and css tokens

### Configuration changes

- `integration` is an object that contains two properties `name` and
  `version`. If you set `integration.name` to `custom` and `version` to `null`
  the project will expect a fully defined integration in the `/integration` dir.
- `figma` is an object that allows customization of how components are fetched.
  - `figma.components` contains a list of the components
  - Each component can be defined. For example `figma.components.button` will
    define how buttons are fetched from figma.
  - The `search` property determines the library component and name of the frame
    to look in for the component. Setting `figma.components.button.search` to
    `Unicorn` will try to find a button structure in a library object called
    `Unicorn`.
  - The `size` property of each component will define a size map allowing projects
    to map figma sizes to token names.

### New Color Support

- **Gradient Color Support** Linear and Radial gradients are now imported from
  figma. The tokens JSON structure has changed to make it better support complex
  color objects.
  - `hex`, `type`, and `rgb` properties were dropped from the ColorObject
  - `value` contains the CSS set of color values, either as hex, rgb, rgba, or
    gradients
  - `blend` contains a set of blend modes as CSS values that map against the
    colors
- **Blend Modes and Color Layers** Tokens are now exported for blend modes and
  color layers. Handoff can pull multiple layers out of the color styles, and
  will build the proper blend mode CSS for use in the project.

### Upgrade Notes

- Create a folder `/integration` in the root of the project to hold integration
  configuration.
- Any template customizations should be moved into the `/integration/templates`
  directory.
- Any sass customizations to the existing project structure should be be moved
  to `/integration/sass` and modified to match the new structure.

### Other Features

- Each component and foundation now has buttons for downloading the tokens for
  that component.
- The dashboard now has a button for downloading all tokens as a zip file.

### Security Update

- Webpack was updated to 5.79.0 to address a security issue
- node-sass was removed from the figma-exporter library since it is no longer
  needed by the system.

## [0.3.1] - 2023-04-03

This release fixes two small bugs, one that throws an error on builds because
of a missing type declaration in the config.

### Bugfixes

- Builds against 0.3.0 are failing because of a missing type. Effects is missing
  from the return type of the DocumentObjects. This adds that type to fix.
- RGBA Colors are listed on the foundations as percent instead of 255 values.
  This changes the display values, without changing the generated tokens.

## [0.3.0] - 2023-03-31

This release creates base foundation tokens in the /exported directory. This
is a major step forward allowing projects to use color, typography and effects as
named tokens in projects in addition to component tokens.

### Changes

- Adds foundation token css and scss files so projects can reference colors,
  typography and effects.
  - Tokens are exported to the /exported folder
  - Foundation token files follow the form - {type of foundation}.scss contains
    the css vars and {type of foundation}\_vars.scss contains the scss variables
  - Color tokens are either hex for solid colors or rgba for alpha channel colors
  - Two color map arrays are provided $color-groups and $color-names
  - Color tokens are in the form $color-{group}-{name}: {hex/rgba};
  - Typography tokens support
    - font-family
    - font-size
    - font-weight
    - line-height
    - letter-spacing
    - paragraph-spacing
  - One Typography map is provided $type-sizes
  - Typography tokens are in the form $typography-{size}-{property}: {value}
  - Effects are are currently limited to drop and inner shadows
  - Effects include a map of effect names $effects
  - Effects are in the form $effect-{name}: {shadow definition}

### Bugfixes

- Adds the proper sidebar menu icon for effects

## [0.2.1] - 2023-03-28

This release fixes a small typo in the installer. The version in the installed
package version was set to ^0.1.0 rather than ^0.2.0. This release fixes that.

### Changes

- Changes template for installer to match latest version

## [0.2.0] - 2023-03-23

### Changes

- Significant improvements to the markdown pages.
  - Adds syntax highlighting for markdown pages and blocks.
  - Just wrap your code in single ticks or create blocks with three ticks.
  - Currently support highlighting for CSS/SCSS, HTML, Javascript/Typescript,
    Yaml and Bash. Use ` ```{type}` to define the syntax. For example ` ```js`.
  - Adds anchor links to markdown h{n} tags to allow deep linking to headers.
- Adds line numbering to all code blocks.
- Improves the installation experience with better help text.
- Provides Node 16+ version checking on installation to make it clear.

### Bug

- Improves handling of missing components in Figma. If its not found:
  - An alert is shown in the fetch output.
  - The component page is hidden in the menu and the components list.
  - A 404 page is shown if the missing component is accessed directly.
- Fixes a grouping issue where opacity was in an undefined group on the buttons
  page.
- Fixes a problem with blur radius and spread values on shadow tokens

## [0.1.5] - 2023-03-10

### Bug

- CONVHAND-196 Installer is missing a package json script

### Changes

- CONVHAND-194 Iconography link on Branded Assets page is incorrect & broken
- CONVHAND-195 Style Guide - has typo & still has a "TODO" mentioned in copy

## [0.1.4] - 2023-03-09

### Bugfixes

- Fixes a build issue with types on NextJS build
- Adds a npm script to run the installer for the figma exporter without dev deps

## [0.1.3] - 2023-03-09

### Changes

- Improving changelog for previous changes

### Bugfixes

- Fixes a bug where the installer was deploying with outdated css for custom
  previews

## [0.1.2] - 2023-03-09

### Bugfixes

- Fixing installer package json version b2d58c5

## [0.1.1] - 2023-03-09

### Bugfixes

- Fixes script naming for installed sites

## [0.1.0] - 2023-03-09

### Changes

- Creates the initial public version of Handoff
- High level initial feature list
  - Builds pipeline from Figma to generate tokens from well structured file
  - Exports design foundations (colors, typography, icons, logos)
  - Component design tokens (buttons, alerts, modal, tooltips, inputs, radios, checkboxes, radio, switches)
  - Transformers for sass variables, css variables, previews and custom fonts
  - Static web application that can be published to any web host

```

```
