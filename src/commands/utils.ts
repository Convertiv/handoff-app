import { Argv } from 'yargs';
import type { TransferEntityKind } from '../registry/transfer';

/** Plural entity kinds accepted by the `publish`/`checkout` commands. */
export const REGISTRY_ENTITY_KINDS = ['components', 'patterns', 'pages', 'tokens', 'assets'] as const;
export type RegistryEntityKind = (typeof REGISTRY_ENTITY_KINDS)[number];

/** Map the plural CLI kind to the singular wire kind used by entity publish/checkout. */
export const ENTITY_WIRE_KIND: Record<'components' | 'patterns' | 'pages', TransferEntityKind> = {
  components: 'component',
  patterns: 'pattern',
  pages: 'page',
};

export const getSharedOptions = (yargs: Argv) => {
  return yargs.options({
    config: {
      alias: 'c',
      type: 'string',
      description: 'Path to config file',
    },
    force: {
      alias: 'f',
      type: 'boolean',
      description: 'Force action',
    },
    debug: {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug mode',
    },
  });
};