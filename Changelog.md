# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.3] - 2023-04-19

Continuing incremental improvement over the 0.4.0 release. This release fixes
a couple of small build inconsistencies, improves debug mode when running the
build and fetch, and

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
