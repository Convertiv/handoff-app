# Commands Module

Yargs command definitions for the handoff-app CLI. Each subdirectory maps to a CLI command.

## Structure

```
commands/
├── build/        # build:app, build:components
├── dev/          # dev (bare Next.js dev server)
├── eject/        # eject:config, eject:pages, eject:theme
├── fetch/        # fetch (Figma data pipeline)
├── init/         # init (project initialization)
├── make/         # make:template, make:page, make:component
├── scaffold/     # scaffold (interactive component scaffolding)
├── start/        # start (dev server with watchers)
├── validate/     # validate:components
├── index.ts      # Aggregates all commands
├── types.ts      # SharedArgs interface
└── utils.ts      # getSharedOptions() for common CLI flags
```

Each command file exports a `CommandModule` that Yargs registers at startup.
