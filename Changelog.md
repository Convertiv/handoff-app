# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2023-04-16

This release fixes two small bugs, one that throws an error on builds because
of a missing type declaration in the config.

### Updates

#### New Color Support

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

#### 

#### Upgrade Notes

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
