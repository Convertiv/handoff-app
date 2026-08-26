import { Arguments } from 'yargs';

export interface SharedArgs extends Arguments {
  /** Explicit config file, replacing the usual `handoff.config.*` lookup. */
  config?: string;
  force?: boolean;
  debug?: boolean;
  /**
   * Report what would happen instead of doing it: publish uploads nothing and needs no registry URL
   * or token, and checkout writes no workspace file. A publish dry run still runs the build, so build
   * output on disk is refreshed; pair it with `skipBuild` to leave that alone too.
   */
  dryRun?: boolean;
  /** yargs `--build` / `--no-build`; `false` publishes the existing build output. */
  build?: boolean;
}
