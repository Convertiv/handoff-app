/**
 * Collects deprecated-API use during one declaration load and reports it as a single notice.
 *
 * The set is per load, not per module: `handoff.reload()` runs on every watched save, and a
 * module-level set would print once and then stay silent for the life of the dev server.
 */
export type DeprecationCollector = {
  note: (api: string, source: string) => void;
  flush: () => void;
};

const REPLACEMENTS: Record<string, string> = {
  defineReactComponent: "defineCatalogItem from 'handoff-app/react'",
  defineHandlebarsComponent: "defineCatalogItem from 'handoff-app/handlebars'",
  defineCsfComponent: "defineCatalogItem with fromCSF() from 'handoff-app/react'",
  defineComponent: "defineCatalogItem with implementation: { renderer, file } from 'handoff-app'",
  definePattern: "defineCatalogItem with composition from 'handoff-app/pattern'",
  'plain declaration object': 'a .handoff.ts declaration that calls defineCatalogItem',
  'JSON declaration': 'a .handoff.json declaration with implementation: { renderer, file }',
  'entries.components / entries.patterns': 'catalog.include',
};

const HEADING = 'Deprecated declaration APIs found. Replace them as shown:';
const REFERENCE = 'See "Catalog items" in the Handoff README for examples of each replacement.';

export const createDeprecationCollector = (
  warn: (message: string) => void,
  describe: (source: string) => string = (source) => source
): DeprecationCollector => {
  const sourcesByApi = new Map<string, Set<string>>();

  return {
    note(api: string, source: string): void {
      const sources = sourcesByApi.get(api) ?? new Set<string>();
      sources.add(describe(source));
      sourcesByApi.set(api, sources);
    },

    flush(): void {
      if (sourcesByApi.size === 0) return;

      const lines = Array.from(sourcesByApi.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([api, sources]) => {
          const replacement = REPLACEMENTS[api];
          return [`  ${api}${replacement ? ` -> ${replacement}` : ''}`, `    ${Array.from(sources).sort().join(', ')}`];
        });

      warn([HEADING, ...lines, REFERENCE].join('\n'));
    },
  };
};
