# Handoff CLI

The Handoff cli allows you to interact with your Figma file and Handoff app
via the command line. It allows you to run handoff in any folder with
no other configuration or setup.  

## Interacting with Figma
The CLI will allow you to fetch all data from Figma, build the documentation
app and run a local dev site. For these use the build, fetch, and serve commands
documented below.  

## Configuring a handoff project
The CLI will allow you to build the various kinds of configurations that you
will need for interacting with Figma. Handoff has sane configuration defaults
but the various kinds of configurations can be tailored or extended.

Handoff has 4 configuration files - 

`handoff.config.json` - Defines the general handoff configuration.
`pages` - Markdown files that will create or customize pages in the documentation
app
`exportables` - JSON schemas for each component in your figma file that you
want to pull into handoff.
`integration` - scss mappings and html templates for making it easy to map
handoff tokens to your frontend framework.

The CLI exposes two ways to manage the config - `make` and `eject`. 

__Eject__ commands will take the default configuration and eject them into
the current working directory. If you customize these configurations, then run 
handoff commands in that directory, these configs will be executed.
__Make__ commands will generate a boilerplate configuration in the current
working directory. This is useful for extending handoff for different components
or integrations.

## Requirements
Node 16+

## Install the CLI 

`npm install -g handoff-app`

## Run the CLI

`handoff-app --help`

## Commands and Flags

Usage: handoff-app <cmd> <opts>

Commands:
  fetch [opts] - Fetches the design tokens from the design system

  build - Using the current tokens, build various outputs
    build:app [opts] - Builds the design system static application

  start [opts] - Starts the design system in development mode

  make
    make:template <component> <state> [opts] - Creates a new template
    make:page <component> <state> [opts] - Creates a new page

  eject - Ejects the default entire configuration to the current directory
    eject:config [opts] - Ejects the default configuration to the current directory
    eject:integration [opts] - Ejects the default integration to the current directory
    eject:pages [opts] - Ejects the default pages to the current directory

Options:
  -c, --config [file]      Define the path to the config file
  -d, --debug              Show debug logs
  -h, --help               Show this help message
  -v, --version            Show the handoff version number
