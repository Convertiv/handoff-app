import { Arguments } from 'yargs';

export interface SharedArgs extends Arguments {
  /** Explicit config file, replacing the usual `handoff.config.*` lookup. */
  config?: string;
  force?: boolean;
  debug?: boolean;
}