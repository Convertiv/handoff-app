import { CommandModule } from 'yargs';
import { DEFAULT_BUILD_TARGET, HandoffBuildError, type BuildPackage, type BuildTarget } from '../../app-builder';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

const BUILD_TARGETS: BuildTarget[] = ['static', 'registry'];
const BUILD_PACKAGES: BuildPackage[] = ['standalone', 'vercel'];

export interface BuildArgs extends SharedArgs {
  target?: BuildTarget;
  package?: BuildPackage;
  skipComponents?: boolean;
}

/**
 * `handoff-app build [--target static|registry] [--package standalone|vercel]` — builds the
 * documentation site for the resolved target and packages it for the resolved deliverable.
 * `--target` selects *what* is built; the optional, additive `--package` selects *how* it is
 * packaged. Bare `build` resolves to the static target with the `out/<projectId>` export;
 * `--package` never implies a `--target`.
 */
const command: CommandModule<{}, BuildArgs> = {
  command: 'build',
  describe: 'Build the design system for the given target (default: static export)',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .option('target', {
        describe: 'Build target (what is built)',
        choices: BUILD_TARGETS,
        default: DEFAULT_BUILD_TARGET,
      })
      .option('package', {
        describe: 'Packaging format (how it is delivered). Omit for the default per-target deliverable.',
        choices: BUILD_PACKAGES,
      })
      .option('skip-components', {
        describe: 'Skip building components before building the app',
        type: 'boolean',
        default: false,
      });
  },
  handler: async (args: BuildArgs) => {
    const handoff = createHandoff(args);
    try {
      await handoff.build(args.target ?? DEFAULT_BUILD_TARGET, args.skipComponents ?? false, args.package);
    } catch (error) {
      // Expected business/flow failures (invalid combinations, unsupported runtime modes) print as a
      // single actionable line; unexpected errors re-throw so their stack trace is preserved.
      if (error instanceof HandoffBuildError) {
        Logger.error(error.message);
        process.exitCode = 1;
        return;
      }
      throw error;
    }
  },
};

export default command;
