# Handoff - Design Token Automation

<a aria-label="NPM version" href="https://www.npmjs.com/package/handoff-app">
  <img alt="" src="https://img.shields.io/npm/v/handoff-app?style=for-the-badge&labelColor=000000">
</a>
<a aria-label="License" href="https://github.com/convertiv/handoff-app/blob/main/License.md">
  <img alt="" src="https://img.shields.io/npm/l/handoff-app?style=for-the-badge&labelColor=000000">
</a>

A design token pipeline to read figma files, extract tokens as JSON, and
transform tokens into dev ready artifacts.

## Table of Contents

* [What Is Handoff?](#what-is-handoff)
* [How does it work](#how-does-it-work)
  * [Handoff is in Beta!](#handoff-is-in-beta)
* [Requirements](#requirements)
* [Get Started](#get-started)
* [Table of Contents](#table-of-contents-1)
  * [Figma](#figma)
  * [Create a project](#create-a-project)
  * [Test fetch](#test-fetch)
* [Further Reading](#further-reading)
* [Maintainers](#maintainers)
* [Contributing](#contributing)
* [License](#license)

## What Is Handoff?

Handoff is an open source toolchain for building and managing robust design systems.
Handoff enables developers to pull data from Figma, document complex components,
and deploy documentation as a static site. Handoff renders the documentation as a
JSON API and then builds a human readable interface on that JSON API. Our goal is
to make Design Systems and DS documentation a part of the production pipeline,
rather than an extra process.

Handoff is a collection tools:

* **Figma Data Extraction** - A framework for extracting standardized design
  tokens, foundations, and component metadata from Figma.
* **Build Pipeline** - A set of transformers for building SASS, CSS,
  Style Dictionary, Javascript, and render previews from your components.
* **Documentation Web App** - A static, client side, Javascript web app that
  renders live, working previews of your components, tokens and styles.

## Quickstart

Follow our full quickstart guide here - [Get Started](https://www.handoff.com/docs/quickstart)

### Fetch tokens and metadata from Figma

1. Add handoff to your project - `npm install handoff-app`
2. Add a fetch command to your scripts

```
  "scripts": {
    "fetch": "handoff-app fetch"
  }
```

3. Fetch tokens and metadata from your figma project - `npm run fetch`
4. Provide your figma project id and your developer token.  Your developer token will need read
   access to the file and file library

### Start a documentation app

1. Add handoff to your project - `npm install handoff-app`
2. Add a fetch command to your scripts

```
  "scripts": {
    "fetch": "handoff-app fetch"
  }
```

3. Navigate to localhost:3000

## How does it work?

* [Get Started](https://www.handoff.com/docs/quickstart)
* [Requirements](https://www.handoff.com/docs/overview/requirements)
* [Extraction Overview](https://www.handoff.com/docs/figma)
* [App Overview](https://www.handoff.com/docs/app)

The Figma data extraction and the Design System documentation app
are independent pieces - you can use one without the other. Handoff
is designed to quickly scaffold everything you need in a robust design system.

Handoff centralizes all of the pieces you need in your frontend builds,
allowing you to create robust documentation, and build full components
in whatever framework and structure you want. Using Vite under the hood
Handoff will compile your components to HTML to render in the App.

* [Foundation Tokens](https://www.handoff.com/docs/tokens)
* [Building Components](https://www.handoff.com/docs/components)
* [Adding Markdown Pages](https://www.handoff.com/docs/markdown)

The documentation application has a robust documented API. With it
you can construct components in whatever format you want, with
clear documentation. You can hook into the build process and adjust
the build process to suite your needs. Finally the app publishes
a JSON api to allow downstream processes to consume and reason
about components in the library

* [Component Structure](https://www.handoff.com/docs/components/api)
* [Hook API](https://www.handoff.com/docs/hooks)
* [REST API](https://www.handoff.com/docs/api)

Handoff is designed to be automated, with the pipeline from Figma to
the Documentation Web app executed from a CI/CD process. This provides
automatic, up-to-date, easily readable developer documentation.

* [CI/CD Integration](https://www.handoff.com/docs/guide/cicd)

## Requirements

* Node 20
* NPM 10
* A paid Figma account is required to publish the Figma file library, if
  you want to use the token extraction

## Further Reading

* [Configure your project](https://www.handoff.com/docs/customization)
* [Customize the content](https://www.handoff.com/docs/customization/content)
* [Integrate tokens with your project](https://www.handoff.com/docs/tokens/integration)
* [Build to Static Assets](https://www.handoff.com/docs/tokens/publishing)
* [Integrate with Github Actions CI/CD](https://www.handoff.com/docs/infrastructure/github/)
* [Integrate with Bitbucket Pipelines CI/CD](https://www.handoff.com/docs/infrastructure/bitbucket/)

## Maintainers

[@bradmering](https://github.com/bradmering)

[@DomagojGojak](https://github.com/DomagojGojak).

[@Natko](https://github.com/Natko).

## Contributing

Feel free to dive in! [Open an issue](https://github.com/Convertiv/handoff-app/issues/new) or submit PRs.

Handoff follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## License

[MIT](LICENSE) ©Convertiv
