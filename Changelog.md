# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-23

This is the Handoff 1.0 Release. Handoff has become a mature toolchain for 
building robust design systems and design to dev pipelines. Handoff helps
development teams quickly pull data from Figma, and scaffold effective
API driven design systems with minimal overhead.

### Handoff Key 1.0.0 Features

- Automated Figma token and metadata extraction via REST API
- Design system documentation app mixing automated and custom docs
- Robust REST API for consuming tokens, components, and documentation in applications
and pipelines
- Flexible, hookable API for describing and building components agnostic to framework
and infrastructure


### Changes since 0.18.0

This release patches several small bugs and smooths several small issues in the
UX. It also removes the `dist` directory from this repo, so that compiled code
is not stored with the repo.

### Bugfixes

- When running handoff locally in dev mode (`npm run start`) the component build
  wasn't automatically firing. This was caused by removing versions but not
  adjusting the path tracking.
- Fixed an issue were custom components, lacking the figmaComponentId, were 
creating dropdowns for varying the properties based on the previews.

### DX Changes

- Components linked to Figma components (via figmaComponentId) will
  automatically display properties pulled from figma, and allow users to see
  all the variants by altering properties.
- Improvements to the custom theme handling for handoff sites. The theme css in
  the project will now be read in and can use tailwind and css structures to
  extend the theme of the app.
- Removed lorem ipsum from default pages

### UI

- The component search and filtering experience has been significantly improved
- Fixed several UI issues with dark mode.
- Fixed foundation token anchor links

### Chore

- Remove dist folder from the handoff-app repository

## [0.18.0] - 2025-12-15

We consider this to be our 1.0.0 pre release candidate. We consider all Handoff
APIs (component construction, REST api, and library) to be stable and mature.

## Major Changes

### Interactive Component Scaffolding

- **New `scaffold` Command**: Quickly generate component stubs from your Figma tokens using our new interactive CLI tool.
- **Smart Detection**: The tool automatically checks your `tokens.json` against local files to identify which Figma components are missing implementations and suggests stubs for them.
- **Improved CLI Experience**: Smoother, more modern terminal interface with clearer prompts and guidance.

### Faster Builds

- **Incremental Builds**: We've introduced a new caching system that significantly speeds up build times by only processing components that have actually changed.
- **Optimized Updates**: The build process now intelligently merges data, making updates faster and more efficient for large design systems.

### Enhanced Stability & Diagnostics

- **Clearer Logging**: We've completely overhauled application logging to provide cleaner, more consistent, and easier-to-read output in your terminal.
- **Improved App Startup**: The application initialization and file watching processes have been hardened to be more stable and reliable during development.
- **Better Error Reporting**: Removed confusing error messages to ensure that the logs you see are relevant and actionable.

### Streamlined Configuration

- **Unified Runtime Config**: We've simplified how integrations and configurations are handled, making the internal system more robust and easier to maintain.
- **Legacy Cleanup**: We've removed deprecated "exportable" component commands and configurations to reduce clutter and focus on the modern integration workflow.
- **Changelog Removal**: The internal design token changelog feature has been removed to streamline the pipeline

### Additional Improvements

**Component Discovery & Navigation**

- **Enhanced Component List**: Added new filtering, sorting, and grouping options to the component list, making it easier to find what you need in large libraries.
- **Seamless Navigation**: Added "Previous" and "Next" buttons to documentation pages for easier browsing between components.

### CLI & Developer Experience\*\*

- **Config Ejection**: You can now easily eject the default configuration into a local JS file using the updated `eject` command.
- **Documentation Engine Update**: Switched from MDX to a more robust Markdown implementation to improve stability.
- **Syntax Highlighting**: Fixed issues with code block syntax highlighting in documentation.
- **Security Updates**: Applied important security patches for Next.js and React 19 dependencies.

### UI Improvements

- **Tailwind 4**: The handoff application now runs tailwind 4 for improved customziation and modern UI features
- **Color Page**: Significant improvements to color data to show much more detail about color use
- **Component Search**: Added component search and filtering on system landing page
- **Improved Stack Navigation**: Added next previous navigation to component pages
- **More Markdown Customization**: Adding markdown content to the home page to allow customization
- **Config Ejection**:

## Specific changes

### Component API Changes

- Components can now be explicitly linked to the figma component allowing ongoing
  property, description, and metadata sync via the `figma_component_id` property.
- Components no longer use semver versioning in the component structure. You will
  have to migrate to a flat directory structure where the component files are in the
  root of the component directory
  - Instead of {component_id}/1.0.0/{data}, the structure should be {component_id}/{data}

### CLI Changes

- Adds a command `handoff-app scaffold` that will look at your figma file for
  published components, and suggest components for handoff.
  - Will launch a wizard that will scaffold simple components for each Figma
    component and link them to the figma reference
- `make:page` will now only create `.md` pages
- `handoff-app build:app` can now accept a switch `--skip-components` which
  will bypass component build. This is especially useful for speeding CI/CD builds
- `eject:config` now ejexts a typed js config file instead of a JSON config
- Removes the following commands related to legacy infrastructure
  - `make:exportable`
  - `make:integrationStyles`
  - `eject:schema`
  - `eject:exportables`
  - `make:schema`

### DX Changes

- React component properties will automatically generate properties in the
  REST api and the app UI, generated from the properties and types of the component
- The handoff config will now be
- The logging has been rewritten to provide better clarity and eliminate noise
- The prompting has been rewritten to provide cleaner interactions

### Security Fixes

- Handoff is not affected by the React2Shell vulnerabilities because it uses
  no server side React components. Version 18 updates to the latest 15 release of
  NextJS and React 19 to minimize false positives in dependency reporting.

### Bug Fixes

- Hooking into the vite css configuration would break typing if your local vite didn't
  match the vite bundled with handoff.

## [0.17.1] - 2025-11-13

This patch improves docs-site component loading and resolves a state-mutation issue.

### Bug Fixes

- Improved docs-site component loading to ensure components render correctly.
- Implemented deep cloning to avoid accidental mutations of `defaultComponent`.

## [0.17.0] - 2025-08-06

## Major Highlights

### Vite Migration

The project has transitioned from Webpack to Vite as the new build tool. This significantly improves performance, simplifies configuration, and lays the groundwork for future extensibility. Legacy integration steps and commands related to Webpack have been removed.

### Modularization via `handoff-core`

Core token pipeline logic has been extracted into a new shared package: `handoff-core`.
This change makes the internal architecture of `handoff-app` cleaner and enables easier maintenance across related tools like the Figma plugin.

### SSR and Hydration Support

Initial support for Server-Side Rendering (SSR) and hydration is now available.

- SSR is enabled for static previews and production-ready rendering
- Hydration allows React components to become interactive after being statically rendered
- These features are considered stable but may still evolve in upcoming releases

### JavaScript-Based Configuration

All configuration files now support JavaScript in addition to JSON.
You can now define your config using `handoff.config.js` or `handoff.config.cjs`, and other related files (such as component config files) also support JS formats.
JSON is still supported, but JavaScript usage is encouraged for better flexibility.

## Hook-Based Extensibility

A new hook system allows developers to customize parts of the build and schema pipeline.
**Available hooks:**

- `validateComponent`
- `ssrBuildConfig`
- `clientBuildConfig`
- `getSchemaFromExports`
- `schemaToProperties`
- `jsBuildConfig`
- `cssBuildConfig`
- `htmlBuildConfig`

## Additional Features

- Component schema export support to help generate documentation tables and property lists
- Preview filtering to improve navigation in large component libraries
- New transform generates `.tsx` pages from `.mdx` for better compatibility with typed docs
- Replaced use of unofficial Next.js APIs with `cross-spawn` for build and dev processes
- More informative error handling and validation messages
- Default doc format now set to `.mdx`

## Cleanup and Refactors

- Removed deprecated integrations and plugin code
- Dropped part of unused dependencies including `axios`
- Standardized configuration logic and naming
- Improved fallback behavior for missing component CSS or schema
- Cleaned up type definitions and utility functions

## Compatibility Notes

- Now tested with React 19 and Next.js 15
- Older React and Next versions may no longer be compatible

## [0.16.0] - 2025-06-03

This release is a major reorganization of Handoff. We've preserved the core
Figma Token ETL behavior, but this release significantly rethinks and improves
the documentation application.

**This is a significant breaking change. We recommend starting from a fresh
project.** Its possible to upgrade an existing Handoff project, but its
easier to start fresh. Previous versions of handoff depended on specific
structure. We're working to remove any structure or conventions, so you can
use handoff in any project as you see fit.

Contact us if you need help upgrading a legacy project handoff@convertiv.com.

### Justification

The Handoff documentation app was initial designed to complement the token e
xtraction and document simple tokens. Over time, we added the ability to
document Figma components in the application. We supported integrations that
would allow users to describe Figma components in code.

As we built out more complex design system documentation, we quickly hit the limits
of what we could build and describe with that simple system. We needed a way
to flexibly describe components - both defined in Figma, and standalone custom
components. There are other open source products like Storybook that have some
of this functionality but we were looking for a more flexible, and robust
architecture for describing and distributing components across ecosystems.

This release does a number major things -

- Introduces a new component architecture, allowing users to describe components
  using handlebars, css, and JSON
  - These components are built, compiled, and validated on each handoff build. The
    build system is designed to be highly configurable.
  - Each component has a set of typed properties allowing users to pass pass in
    data to the component, and visualize variations
  - Components can be annotated with metadata to allow users to provide robust
    usage guidelines.
  - Each component is semver versioned
  -
- Publishes a robust API at /api/components.json that allows remote systems to
  query the
  - Each component is published at /api/component/{name}.json. This allows systems
    to fetch just the relevant component.
- Completely redesigns and rearchitects the application.
  - Redesigned using shadCn tailwind components
  - Reorganized the information architecture to default to best practice in
    organizing foundations, systems and guidelines.
  - This architecture and design can be customized

See the demo site at demo.handoff.com and the demo code at h
https://github.com/Convertiv/handoff-demo to have a sample of how this should be
structured

## Component Structure

In this version components should be stored at `{integrationPath}/components`.
Each integration should be in a folder with a unique name. This name will be
used as the id for the component.

Within each component folder, there should be at least one folder, named
with a semver name. The structure of this should look like

- {integrationPath}
  - components
    - component1
      - 1.0.0
        - component1.json - Describes the component in a JSON format documented below
        - component1.hbs - A handlebar template to describe the markup of the component
        - component1.scss - An optional style sheet to include with the project
        - component1.js - An optional js file to include with the project

### Minimum Component JSON

This is a sample json component to show how you can structure the component
documenation. Most of this is metadata used to construct robust documentation
for users.

The two important semantic sections are `previews` and `properties`. Properties
defines a list of properties the component accepts. They are defined using the
OpenAPI json specification.

Once you define a list of properties, you can then define a list of previews.
Each preview defines values for the properties. Handoff will then render a set
of html previews of your component. This way you can render variations
simply.

```JSON
{
  "title": "Accordion",
  "image": "https://placehold.co/1360x900",
  "description": "Collapsible sections for toggling sections of content on and off.",
  "figma": "https://www.figma.com/design/0gKWw8gYChpItKWzh8o23N/SS%26C-Design-System?node-id=301-598&t=qoaWE7Tx8sH4njGu-4",
  "type": "block",
  "group": "Accordion",
  "categories": ["Components"],
  "tags": ["accordion"],
  "should_do": ["Show a list of items in an accordion format.", "Allow users to expand and collapse each item individually."],
  "should_not_do": ["Use this component for a large number of items."],
  "changelog": [
    {
      "version": "1.0.0",
      "date": "2021-01-01",
      "changes": ["Initial version."]
    }
  ],
  "previews": {
    "generic": {
      "title": "Generic",
      "values": {
        "id": "accordion",
        "items": [
          {
            "id": "accordion-item-1",
            "title": "Accordion Item 1",
            "paragraph": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
            "image": {
              "url": "https://placehold.co/1360x900",
              "alt": "Image alt text"
            }
          },
          }
        ]
      }
    }
  },
  "properties": {
    "id": {
      "name": "ID",
      "description": "Unique identifier for the accordion.",
      "type": "text",
      "default": "accordion",
      "rules": {
        "required": true,
        "content": {
          "min": 5,
          "max": 25
        },
        "pattern": "^[a-z0-9-]+$"
      }
    },
    "items": {
      "name": "Items",
      "description": "Accordion items",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "name": "ID",
            "description": "Unique identifier for the accordion item.",
            "type": "text",
            "default": "accordion-item-1",
            "rules": {
              "required": true,
              "content": {
                "min": 5,
                "max": 25
              },
              "pattern": "^[a-z0-9-]+$"
            }
          },
          "title": {
            "name": "Title",
            "description": "Title of the accordion item.",
            "type": "text",
            "default": "Accordion Item 1",
            "rules": {
              "required": true,
              "content": {
                "min": 5,
                "max": 25
              }
            }
          },
          "paragraph": {
            "name": "Paragraph",
            "description": "Paragraph of the accordion item.",
            "type": "text",
            "default": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.",
            "rules": {
              "required": true,
              "content": {
                "min": 5,
                "max": 100
              }
            }
          },
          "image": {
            "name": "Image",
            "description": "Image of the accordion item.",
            "type": "image",
            "default": {
              "url": "https://placehold.co/1360x900",
              "alt": "Image alt text"
            },
            "rules": {
              "required": true,
              "dimensions": {
                "min": {
                  "width": 1360,
                  "height": 900
                },
                "max": {
                  "width": 1360,
                  "height": 900
                }
              }
            }
          }
        }
      },
      "rules": {
        "required": true,
        "min": 1,
        "max": 10
      }
    }
  }
}
```

### Handlebars Templates

We anticipate allowing other templating systems in the future, but in this
version, we support handlebars with limited logic. Using Handlebars allows
us to create a simple system that will be compatible with most downstream
platforms.

There are two special feature of this handlebars file -

- `#field` This allows you wrap a field in a tag. This allows handoff to inject
  metadata around a field to make the field inline editable, and to allow us to
  open a sidebar with metadata about the property. You don't have to use this
  but its helpful.
- `style` and `script` - These tags allow us to inject automatically the built
  script and style artifacts.

```html
<head>
  {{{style}}} {{{script}}}
</head>
<body class="preview-body">
  <section class="py-lg-12 py-8">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10">
          <div class="accordion accordion-spaced" id="{{properties.id}}">
            {{#each properties.items}}
            <div class="accordion-item">
              <h3 class="accordion-header" id="{{../properties.id}}-heading-{{this.id}}">
                <button
                  class="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#{{../properties.id}}-collapse-{{this.id}}"
                  aria-expanded="true"
                  aria-controls="{{../properties.id}}-collapse-{{this.id}}"
                >
                  {{#field "items.title" }}{{this.title}}{{/field}}
                </button>
              </h3>
              <div
                id="{{../properties.id}}-collapse-{{this.id}}"
                class="accordion-collapse collapse"
                aria-labelledby="{{this.id}}"
                data-bs-parent="#{{../properties.id}}-heading-{{this.id}}"
              >
                <div class="accordion-body w-lg-90 mx-lg-auto fs-lg">
                  <p>{{#field "items.paragraph" }}{{this.paragraph}}{{/field}}</p>
                </div>
              </div>
            </div>
            {{/each}}
          </div>
        </div>
      </div>
    </div>
  </section>
</body>
```

### Bugfixes

## [0.15.2] - 2024-12-11

This release fixes a small bug when pulling foundation tokens with nested names.

### Bugfixes

- Figma's name schema delivers names as {group}/{name}. If your foundation
  (color, shadow, etc) names include a slash `Blue/100` Handoff would only grab
  the first part of that name, and construct the token excluding the remaining
  data. This patch resolves that so instead of getting `primitive-blue` you will
  now get `primitive-blue-100` as your token.

## [0.15.1] - 2024-11-27

This is a minor release to fix several small typing issues that cause problems
in the linter when running as a local NPM package.

### Bugfixes

- Fixes a typing issue in the transformers when including the handoff core package
- Fixes a typing issue when including the ReferenceObject type

## [0.15.0] - 2024-11-05

This release allows Figma foundation styles - Colors, Typography, and Effects
to create variable references in component styles in CSS, SASS, and Style
Dictionaries. It also adds shared style support in snippets to make it easier
to structure and reuse styles across multiple large components.

### Features

- Figma foundation styles - Colors, Typography, and Effects - are now linked to
  component styles in the tokens export. This allows you to use foundation styles
  as variables in component styles in CSS, SASS, and Style Dictionaries.
  - To enable, set `useVariables` to `true` in the `handoff.config.json` file.
  - You can also enable variable support via the `.env` var
    `HANDOFF_USE_VARIABLES`. You can use a boolean or string ("true"/"false")
  - When enabled, Handoff will create variable references in the component styles
    for the foundation styles wherever possible instead of using the string value.
  - For example a color foundation style `Blue` in the `Primary` color group
    with value `#FF0000` will be referenced as `var(--color-primary-blue)` in
    the component styles instead of `#FF0000`.
  - This feature is disabled by default.
- Added support for shared styles in snippets. Shared Styles exist to allow users
  to separate styles used across multiple components from the styles unique to
  each component.
  - To use a shared style in a snippet, add a `{{ sharedStyles }}` to your snippet
    HTML file. Handoff will replace this with the shared styles from the Figma
    file.
  - Created a `shared.scss` or `shared.css` file in the `integration/snippets`
    directory to define the shared styles.
  - If the shared styles are defined in a `shared.scss` file, Handoff will compile
    the shared styles to CSS and include them in the snippet.

### Changes

- The default configuration now has a `useVariables` property set to `false` to
  maintain backward compatibility.
- The default snippets.html file now includes a `{{ sharedStyles }}` token to
  support shared styles in snippets. This value will be empty if no shared styles
  exists.

## [0.14.1] - 2024-10-28

This release introduces greater flexibility for custom integrations and general improvements to CLI handling.

### Changes

- Added support for custom integration paths with the `-i <path-to-integration>` CLI argument.
  - Can be used with commands like `fetch`, `start`, `build:app`, etc.
  - Defaults to the `integration` directory if the argument isn't specified, ensuring backward compatibility.

### Improvements

- Enhanced CLI command management:
  - Switched to `yargs` for improved CLI parsing.
  - Each command now has a dedicated handler file for better modularity.
- Improved the docs app build process:
  - Introduced a cleanup procedure that ensures only files present in the working directory are included in the final build.

## [0.14.0] - 2024-09-26

This release enables creation of complex documentation pages, with storybook
compatible formats. It has two main features - MDX support for adding react
components to your documentation pages, and Snippet Previews - a system for
using Handoff's existing html build process to create complex component
previews.

### Features

- **MDX Support** Support for MDX files in Handoff Documentation App
  - [MDX Files](https://mdxjs.com/) Markdown files with react components
  - Any react component can be imported
  - Handoff exposes a number of custom react components that you can use in
    MDX pages to build
- **Snippet Previews** Create html snippets that will render as a preview with
  html, js, css and sass code below the preview
  - Place a file ending with `.html` in the `/integration/snippets` file or
    run the `make:snippet [name]` cli command
  - Handoff will detect the file and make it available to the `SnippetPreview`
    component
  - If Handoff detects a snippet file ending in js or scss, with the same name
    as the html file, Handoff will automatically use webpack and node-sass to
    build those files and make the compiled code available to html template.
  - If Handoff detects a css file with the same name, it will use that file
    for styling the preview
    - The `html` file is a Mustache template. At present there are two variables
      that can be used in these files
    - `{{{style}}}` a compressed inline style of either the compiled sass code
      or the raw css code provided.
    - `{{{script}}}` a compressed inline script of the output of the js compilation
  - In your MDX files you can display the snippets using `SnippetPreview`. This
    component accepts 2 - 3 properties, plus a react fragment as the children.
    - `title` accepts a string as the `h2` title. Set to false or exclude if you
      don't want it
    - `id` is the name of your snippet `{name}.html` The snippet will load dynamical
    - `height` accepts a string to set the height of the preview. If you leave it
      off, Handoff will set the height of the preview automatically from the contents
      of the snippet.

```jsx
<SnippetPreview title="A Testimonial Component" id="testimonial" height="725px">
  <p>Render a testimonial inline with other content.</p>
</SnippetPreview>
```

### Additional CLI Commands

- `build:snippets <name>` will either rebuild all the snippets for you, or if an
  optional name is passed, will rebuild a single snippet
- `rename:snippet <source> <destination>` will rename a snippet and its js and scss
  files

### Bugfixes

- Fixes a bug introduced in 0.13.0 where the integration preprocess would try to
  execute handlebars insertion even on non text files
- Fixes a bug in the foundation page templates where the markdown would be included
  outside of the section wrapper
- Fixes a bug in the `start` command where every doc page would be flagged as
  changed on watch.

## [0.13.2] - 2024-09-18

This release addresses several developer experience issues

### Bugfixes

- When an integration compiles SASS code, the token injection was injecting components that had no instances in Figma. This causes integrations to fail if the designer had published a component, but not annotated them in Figma with the plugin. This release checks to see if the component has any instances in the Figma export and skips injection for components that are not yet annotated in Figma
- When running `eject:integration` or `make:integration` the default integration is exported, but it is not built. This causes a weird developer experience if you try to `build:app` without `build:integration` first. This patch adds the `build:integration` logic to execute after `eject` or `make` as well as before `build:app` to ensure that if an integration exists, the integration is built before building or serving the app
- If an an `build:app` fails while building the integration preview sass code the error messages were not clear, and didn't explain that you could use `--debug` to make them more clear. The error message has been improved and now alerts users to the `--debug` flag to help them debug their integration.
- When ejecting an integration with the `--force` flag, the force now triggers an overwrite rather than failing.

## [0.13.1] - 2024-09-17

This release fixes a couple of small path issues that affect running 0.13.0 from the global path.

### Bugfixes

- Fix a path issue in the ComponentDesignTokens component that causes an error when run from the global namespace
- Prevents typescript compile errors with the react-scroll `<Link>` component

## [0.13.0] - 2024-09-08

### Changes

- **Integration System Overhaul**
  - **Local Integrations Only:** From this release onward, only local (ejected) integrations are supported. Handoff will automatically use the locally found integration.
    - Create a new local integration using `handoff-app make:integration` (or `eject:integration` which is still supported as an alias).
    - Since there is no need to specify integration information, integration options in `handoff.config.json` such as name and version are no longer recognized, making the integration section of `handoff.config.json` obsolete.
  - **Introduction of `integration.config.json`:**
    - This new file replaces the old `figma.options` section in `handoff.config.json` as well as all transformer related options within the legacy schemas as this file now contains all integration-specific details, including those options previously managed manually across different places.
    - This change leaves the `figma.options` section in `handoff.config.json` no longer supported and also means that all transformer options have been removed from legacy schemas (exportables), rendering this section no longer supported as well.
  - **Documentation App Configuration Changes:**
    - View of the component pages is now managed from within the integration(s), more specifically within the newly introduced `view.config.json` files, located in the respective component’s directory within the integration’s templates folder.
    - As a result the `demo` options section in all legacy schemas has now been removed and is no longer supported by Handoff.

- **Legacy Schema Updates**
  - **Local Schema Requirement:** Legacy schemas (exportables) are now only supported if ejected. The `use_legacy_definitions` option in `handoff.config.json` is no longer supported.
  - **Automatic Schema Consumption:** Handoff now automatically consumes all locally found schemas. The `figma.definitions` section in `handoff.config.json` is deprecated.

### Upgrading from Earlier Releases

- **For Projects with Local Integrations:**
  1. Temporarily rename your current local integration directory.
  2. Create a new local integration using `handoff-app make:integration`.
  3. Transfer the contents from your old integration (excluding `integration.config.json`) to the new directory (merge).
  4. Update options in `integration.config.json` if needed.
  5. Remove the old integration directory.
- **For Projects Without Local Integrations:**
  1. Create a new local integration using `handoff-app make:integration`. This will use a Bootstrap 5.3 template.
  2. If previously using Bootstrap 5.2, update the integration contents accordingly. [Bootstrap 5.2 template](https://github.com/Convertiv/handoff-app/tree/v0.12.2/config/integrations/bootstrap/5.2).
  3. Update `integration.config.json` options if necessary.
- **For Projects with Legacy Schemas:**
  1. Eject legacy schemas using `handoff-app eject:exportables`.
  2. If schemas are already ejected:
  - Verify that transformer options are in `integration.config.json`.
  - Verify that demo options are in `view.config.json` files of respective components.
  - Temporarily rename the directory containing legacy schemas.
  - Re-eject schemas and move custom schemas into the new exportables.
  - Optionally, update custom schemas to remove obsolete options.
- **For Projects with `handoff.config.json`:**
  1. Merge options from `figma.options` to the `integration.config.json` file as necessary.
  2. Optionally remove deprecated sections: `figma.options`, `figma.definitions`, `figma`, `integration`, and `use_legacy_definitions`.

## [0.12.2] - 2024-08-21

### Changes

- Integration bundle used for the docs app is no longer being built during `fetch` and `build:integration` steps.

## [0.12.1] - 2024-06-18

### Changes

- Added support for the `cssRootClass` property in the Handoff Figma plugin metadata.

### Improvements

- Enhanced handling of unnamed parts, resolving visibility issues in the documentation previews.

## [0.12.0] - 2024-06-11

### Changes

- All environment variables now contain the `HANDOFF_` prefix.
  - After updating to version 0.12.0, all environment variables need to be updated to reflect the new variable names:
    - `FIGMA_BASE_URL` -> `HANDOFF_FIGMA_BASE_URL`
    - `DEV_ACCESS_TOKEN` -> `HANDOFF_DEV_ACCESS_TOKEN`
    - `FIGMA_PROJECT_ID` -> `HANDOFF_FIGMA_PROJECT_ID`
    - `OUTPUT_DIR` -> `HANDOFF_OUTPUT_DIR`
    - `SITES_DIR` -> `HANDOFF_SITES_DIR`
    - `USE_HANDOFF_PLUGIN` -> `HANDOFF_USE_HANDOFF_PLUGIN`
    - `CREATE_ASSETS_ZIP_FILES` -> `HANDOFF_CREATE_ASSETS_ZIP_FILES`
- The default integration is no longer pre-defined.
  - Bootstrap 5.3 is no longer set as the default integration.
  - To continue using the Bootstrap 5.3 integration in your project, ensure the configuration is ejected (`handoff-app eject:config`) and update it by setting the `integration` property to `{name: 'bootstrap', version: '5.3'}`.
- All default options specified in the configuration that are used by the exporter and transformer have been removed.
  - To continue using the defaults present before the 0.12.0 release, ensure the configuration is ejected (`handoff-app eject:config`) and update the `figma.options` property to the [previous default value](https://github.com/Convertiv/handoff-app/blob/2a396145e7366732ae6a0e15cdf2226641d40a12/src/config.ts#L36-L59).
- The logo placeholder copy showing spacing and orientation has been removed allowing users to add custom content via Markdown.

### Improvements

- Handoff now appends to existing `.env` files instead of overriding them if the file already exists.
- Introduced normalization of numeric values in `.css` and `.scss` files, along with correct indentations. This ensures that the generated files are valid for any local linting tools your project might use.
- Configuration ejected by the `handoff-app eject:integration` command is now the same as the one ejected by the `handoff-app eject:config` command.
- Handoff no longer uses the `iframe-resizer` package.
- Resolved potential security issues by updating to newer versions of the `axios` and `next` packages.

## [0.11.0] - 2024-05-23

### Bugfixes

- Issue that was causing the `handoff-app start` command to malfunction has been fixed.
- The `Reference error: name is not defined` issue that occurred when a component specified in the schema was missing from the Figma file has been resolved. The `name` reference has been replaced with a correct identifier.
- Icon sizes have been corrected.

### Changes

- **Integration with Handoff Figma Plugin**: This release now seamlessly integrates with the Handoff Figma Plugin by default.
  - As a result, the local schema will not be used by default.
  - If you prefer to continue using local schemas, set `USE_HANDOFF_PLUGIN="FALSE"` in your `.env` file.
- Internal module working directory has been relocated from `./src` to `./.handoff`

## [0.10.0] - 2024-01-16

### Improvements

- Docs App:
  - Updated docs app to present components without associated content and assets more elegantly.
  - Improved the component pages by showing only the "Tokens" tab when no previews are detected; the "Overview" tab is hidden in such cases.
- Configuration Handling:
  - Eliminated the need for `handoff.state.json` file.
  - All required parameters are now passed to the docs app through environment variables (`process.env`), defined in the project's respective `next.config.js` file.
  - Replaced `getConfig` with the more secure `getClientConfig` function.
  - New function returns only configurations that can be safely exposed on the client side.

### Changes

- Handoff Figma Plugin Support:
  - Introduced initial support for the Handoff Figma Plugin.
  - Currently an opt-in feature as development is ongoing.
  - Can be enabled by setting `USE_HANDOFF_PLUGIN="TRUE"` in your `.env` file.
  - This functionality allows Handoff to extract metadata directly from the Figma file. Local JSON definitions are completely ignored in this case.
  - Will become the default behavior in the 1.0.0 release!
- Deprecation Notice:
  - Deprecated local exportable component JSON definitions.
  - Still usable, but will be completely removed and ignored before the 1.0.0 release.
  - Components, parts, and related definitions should be defined with the Handoff Figma Plugin prior to the 1.0.0 release.

## [0.9.3] - 2023-11-23

### Improvements

- It's now possible to declare conditions for exportable component parts. Condition dictates should the part be built based on provided condition (e.g. does a specific variant property have a certain value etc.).
- Handoff will now process all component sets found within the frame in which the component set that matches the search is found. Previously it was limited to process only one (first) extra component set while others were ignored.

### Changes

- Component preview title will no longer default to the value of the first variant property if no distinctive value is found. Empty value is now used instead.

### Bugfixes

- Update of the app source will now update the watched app without having to restart the watch process (issue introduced in version 0.9.0).

## [0.9.2] - 2023-11-21

### Improvements

- Handoff now supports both **personal access** and **OAuth2 bearer** tokens. If Handoff detects that a access token used starts with "Bearer " it will use the `Authorization` header to send the token as part of any Figma API request. In any other case, `X-Figma-Token` header will be used.

## [0.9.1] - 2023-11-14

### Changes

- Footer component has been brought back into the app and is now visible on all pages.
- Introduced token maps export feature which exports generated tokens alongside their respective values in form in JSON files (key/value object). Tokens for individual components/foundations are exported into the `tokens/maps` directory of the designated export directory as individual files while the `tokens-map` file, which contains all available tokens, gets exported into the designated export directory root.

### Improvements

- Added additional logging into the app's `next.config.js` file alongside improved path resolving for custom themes.

### Maintenance

- Updated the `.npmignore` file to reflect latest `.gitignore` changes made in the last release.

## [0.9.0] - 2023-11-10

This release focuses heavily on better support for environments on which multiple projects are being exported and built. All of the changes introduced in this release should provide better experience when working on such environments as well as resolve some of the issues which would occur when different projects would use same working directories.

### Changes

- Handoff exports and builds are now updated to support export and build of multiple projects. Each respective output is now located in the subdirectory that matches the exported project id (e.g. /exports/{figmaProjectId}). This change prevents issues where one project would override handoff output of another project in environments where multiple Figma projects are being handled.
- Due to the change in the output directory structure, Bootstrap integration has been updated with a @exported alias which is set to point to export directory of the current project for which the integration is being built.
- Alongside existing support for customized app assets via the `public` directory, it’s now also possible to create a `public-{figmaProjectId}` directory which gets used only when the project with the respective Figma project id is being built. If the `public` directory is used, assets located in that directory will be applied to all projects.
- Handoff state file now always includes the Figma project id.
- Initial anonymization of the config file that gets loaded into the app to prevent secrets from being exposed on the client side.
- Improvements to path resolving for custom app theme(s).
- Restructure and improvements of the configuration:
  - `poweredBy` option is now called `attribution` and has been moved into `app` config key.
  - `next_base_path` option is now called `base_path` and has been moved into the `app` config key.
  - Following options have also been moved into the `app` config key: `theme`, `title`, `client`, `google_tag_manager`, `type_copy`, `type_sort`, `color_sort`, `component_sort`
  - `logo` and `favicon` options have been removed (it’s still possible to use custom assets but their name must match the default names).
- Misc.

### Bugfixes

- Resolved the wrong favicon path issue when app base path was set/used.

### Migrate to a New Version

- Due to the restructure of the configuration, any local configuration (if exists) needs to be updated to match the new structure. Recommended way is to create a backup of the current local configuration(s) and to re-eject of the handoff configuration. Use the backup of the local configuration to update the up-to-date configuration ejected earlier. This process will ensure all the configuration options are defined correctly.
- Since the export and app output directory structures have been updated, any custom script that relies on the old output path(s) should be updated to support new structure that includes the project id subdirectory.

## [0.8.8] - 2023-10-19

### Bugfixes

- Fixed the issue build client file issue introduced in the 0.8.7 version.

### Other

- Replaced the wrong date for the 0.8.7 release in the changelog with the correct one.

## [0.8.7] - 2023-10-19

### Improvements

- Improved the way in which the handoff state is being utilized to prevent concurrency issues from occurring.
- Improved path resolving across the project to prevent issues with wrong export directory being used from occurring.
- Added more options to easily adjust some of the build process steps.
- General quality improvements.

## [0.8.6] - 2023-10-12

### Bugfixes

- Introduced cleanup prior to copying the integration files to the destination directory. This resolves the issue where deleted integration source files would still be present in the destination directory after running the integration build command.
- Resolved a issue introduced in one of the prior releases where the design token name (variable) rendered in the tooltip of the design token value wasn't being displayed correctly.

## [0.8.5] - 2023-10-05

Miscellaneous improvements to ejecting of integrations, integration handling and building of previews to make it easier for the exported integration to be included in a bootstrap project.

## [0.8.4] - 2023-10-02

Handoff users reported a bug in `handoff-app build:app` last week. The bug didn't manifest in regression testing. This error was traced to typings in a dependency of `next`.

### Bugfix

- Nextjs released 13.5.x which has conflict with the handoff build. This release instructs package.json to stay with 13.4.x while the conflict is resolved.

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

_Before the new release:_

```scss
@import './exported/tokens/types/*';
@import './exported/tokens/sass/*';
@import './exported/tokens/css/*';
```

_With the new release:_

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

_Before the new release:_

```scss
$prefix: '';
@import 'variables';
```

_With the new release:_

```scss
$prefix: '';
@import 'variables';
//<#HANDOFF.MAPS#>
```

#### 3. Replace the imports statements used to extend default Bootstrap components with HANDOFF.EXTENSIONS import token

Replace all import statements used to extend the default Bootstrap components with the new `//<#HANDOFF.EXTENSIONS#>` import token to ensure that only those files that are related to the components that are actually being exported get imported.

_Before the new release:_

```scss
@import 'extended/alert';
@import 'extended/button';
@import 'extended/checkbox';
...
```

_With the new release:_

```scss
//<#HANDOFF.EXTENSIONS#>
```

#### 4. Eject the latest version of the integration used

Due to changes made to the `variables.scss` file and most of the scss files in the `maps` directory for the the Bootstrap version 5.2 and 5.3 interations, it's recommended to do a integration eject (after updating to Handoff 0.8.2) to ensure that your project continues to work correctly. Please remember to do a backup of your current work before doing this.

### Bugfixes

- Updated the preview client build to not include the main SASS integration file as a extra integration in order to prevent redundant loading of the integration which caused the client bundle size to be double the size than it really needed to be while also causing few more issues in the new release where the styles wouldn't get applied correctly.

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
