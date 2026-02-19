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
  * [Figma](#figma)
  * [Create a project](#create-a-project)
  * [Test fetch](#test-fetch)
* [Further Reading](#further-reading)
* [Maintainers](#maintainers)
* [Contributing](#contributing)
* [License](#license)

## What Is Handoff?

Handoff is an open source tool for extracting design tokens from the Figma REST
API and building frontend developer documentation from that Figma file. By
automating the design token delivery, Handoff helps to eliminate bottlenecks
between design and development.

Handoff is a collection of 4 javascript tools:

* **Figma Token Extraction** - A framework for extracting
  standardized design foundations and components from Figma.
* **Transformation Pipeline** - A set of transformers for producing SASS, CSS,
  Style Dictionary, and preview snippets from that data.
* **Documentation Web App** - A static, client side, Javascript web app that
  renders live, working previews of your components, tokens and styles.
* **Delivery Tools** - Easy build tooling and CI/CD wrapper that allows
  automation to render and ship the various deliverables as needed.

## How does it work?

Handoff works by extracting design foundations and component data from
[well-formed Figma libraries](https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D?node-id=0%3A1\&t=iPYW37yDmNkJBt1t-0),
storing them as JSON, and then transforming them into design tokens. Those
design tokens are published as SASS and CSS variables.

Out of the box, Handoff has native SCSS and CSS maps to connect these tokens to
any site using the [Bootstrap 5](https://getbootstrap.com/) frontend
framework. If you use another framework, or custom CSS, you can easily write
map files to connect the generated tokens with your site or application.

* [Get Started](https://www.handoff.com/docs/quickstart)
* [Requirements](https://www.handoff.com/docs/overview/requirements)
* [Integrating Tokens](https://www.handoff.com/docs/tokens/integration)
* [Customization](https://www.handoff.com/docs/customization)

Once Handoff extracts design tokens and variables, it builds a statically
generated NextJS application that can be published to the web. This asset
can be hosted on a static webhost (NGINX, s3/Cloudfront, Cloudflare pages
etc).

* [Tokens Overview](https://www.handoff.com/docs/tokens)
* [Build Site](https://www.handoff.com/docs/tokens/publishing)

This pipeline from Figma to the Documentation Web app can be automated via CI/CD
to provide automatic, up-to-date, easily readable developer documentation.

* [CI/CD Integration](https://www.handoff.com/docs/guide/cicd)

## Handoff is in Beta!

Handoff is Awesome. Handoff is also really new. We're constantly building
new features, and expanding what it can do. We'd love to chat if you have
a use case that isn't quite met.

## Requirements

* A paid Figma account is required to publish the Figma file library
* Node 18.17+
* NPM 8+

## Get Started

### Figma

1. Open the [Handoff Figma starter](https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D?node-id=0%3A1\&t=iPYW37yDmNkJBt1t-0)
   and duplicate this project to your account

2. Publish components to the library

* Click on the Figma logo at the top left
* Click on `Libraries`
* Click on the current file
* Click publish changes

You'll need a developer token if you don't have one already

* Click on the Figma logo in the top left
* Go to `Help and Account`
* Click on `Account Settings`
* Scroll to `Personal Access Token`
* Enter a token name and hit enter
* Note that token for the next steps

## Create a project

The easiest way to get started is using the `create-handoff-app` command to scaffold a new project:

```bash
npx create-handoff-app
```

Or

```bash
handoff-app init
```

This interactive CLI will guide you through:

1. **Project name** - Enter a name for your project directory
2. **Project type** - Choose between:
   * **Project with sample components** - Includes example components to help you get started
   * **Blank project** - Only the essential configuration files
3. **Figma configuration** - Optionally provide your Figma project ID and developer access token

The scaffolding will:

* Create a new directory with your project name
* Generate all necessary configuration files
* Install dependencies automatically

### After scaffolding

```bash
cd my-handoff-project
npm run fetch    # Fetch design tokens from Figma
npm run start    # Start the documentation site
```

This will fetch the latest from your Figma file and boot a demo site at http://localhost:3000

### Alternative: Global installation

You can also install handoff-app globally:

```bash
npm install -g handoff-app
create-handoff-app
```

Or manually set up a project:

```bash
mkdir my-new-project && cd my-new-project
handoff-app fetch   # Will prompt for Figma credentials
handoff-app start
```

## Test Fetch

* Now go back to your Figma file and change a button color
* Republish the changes to the library. Click on the publish button from the main
  dropdown. You'll see a list of changes that have been made. Clicking publish
  will make those changes available to handoff.
* Back in your project, open a new terminal tab and type `npm run fetch`

Once that runs, your browser should update with the new colors.

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
