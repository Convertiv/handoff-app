import { CommandModule } from 'yargs';
import Handoff from '../../';
import { DEFAULT_BUILD_TARGET, type BuildTarget } from '../../app-builder';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

const BUILD_TARGETS: BuildTarget[] = ['static', 'registry'];

export interface BuildArgs extends SharedArgs {
  target?: BuildTarget;
  skipComponents?: boolean;
}

/**
 * `handoff-app build [--target static|registry]` — builds the documentation site for the resolved
 * target (technical design §4/§11). Bare `build` resolves to the static target; the explicit
 * `build --target static` produces identical output.
 */
const command: CommandModule<{}, BuildArgs> = {
  command: 'build',
  describe: 'Build the design system for the given target (default: static export)',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .option('target', {
        describe: 'Build target',
        choices: BUILD_TARGETS,
        default: DEFAULT_BUILD_TARGET,
      })
      .option('skip-components', {
        describe: 'Skip building components before building the app',
        type: 'boolean',
        default: false,
      });
  },
  handler: async (args: BuildArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.build(args.target ?? DEFAULT_BUILD_TARGET, args.skipComponents ?? false);
  },
};

export default command;
