import { defineConfig, fromEnv } from 'handoff-app';

export default defineConfig({
  app: {
    theme: "default",
    title: "{{projectName}} Design System",
    client: "{{projectName}}",
    googleTagManager: null,
    attribution: true,
    typeCopy: "Almost before we knew it, we had left the ground.",
    typeSort: [
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Heading 4",
      "Heading 5",
      "Heading 6",
      "Paragraph",
      "Subheading",
      "Blockquote",
      "Input Labels",
      "Link"
    ],
    colorSort: [
      "primary",
      "secondary",
      "extra",
      "system"
    ],
    componentSort: [
      "primary",
      "secondary",
      "transparent"
    ],
    basePath: "",
    breakpoints: {
      mobile: { size: 400, name: "Mobile" },
      tablet: { size: 800, name: "Medium" },
      desktop: { size: 1100, name: "Large" }
    }
  },

  // A path is either an item directory, or a collection directory whose subdirectories are each an
  // item.
  catalog: {
    include: ["components/button"],
  },

  // `mode` selects the runtime: "workspace" (no database) or "registry" (Postgres). The registry
  // block is read only by `build --target registry` and `db:migrate`, and secrets are referenced by
  // env var name. A named profile (`handoff.config.registry.*`, `--profile registry`) is a good home
  // for it.
  runtime: {
    mode: "workspace",
    // mcp: false,
    // registry: {
    //   databaseUrl: fromEnv("DATABASE_URL"),
    //   database: { driver: "pg" }, // 'pg' | 'neon'
    // },
  },

  // reactDocgen: { maxDepth: 7, excludeDirectories: ["dist", "build", ".next"] },

  // Optional build hooks: component validation, esbuild and Vite config overrides, Handlebars
  // helper registration. Signatures and examples are on the `Config` type.
  // hooks: {
  //   validateComponent: async (component) => ({}),
  // },
});
