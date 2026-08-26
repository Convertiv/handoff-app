import { CommandModule } from 'yargs';
import { warnDeprecatedCommand } from '../compat/deprecations';
import { type CompatTargetArgs, resolveCompatTargets } from '../compat/push-args';
import { SharedArgs } from '../types';
import { getCheckoutOptions, runRegistryCommand, withTargetPositionals } from '../utils';

/**
 * Deprecated `pull`, the documented name for `checkout`, kept working over the canonical
 * implementation. With no argument it pulls the entity kinds the docs describe (pages plus component
 * and pattern declarations); with a kind or selective flags it narrows the same way `push` does.
 * `--dry-run` is a supported `checkout` option, so it passes straight through.
 */
export interface PullArgs extends SharedArgs, CompatTargetArgs {}

const pull: CommandModule<{}, PullArgs> = {
  command: 'pull [type] [id..]',
  describe: 'Deprecated alias for checkout',
  deprecated: true,
  builder: (yargs) =>
    withTargetPositionals(getCheckoutOptions(yargs), 'checkout').options({
      components: { type: 'array', string: true, description: 'Checkout only these component ids' },
      patterns: { type: 'array', string: true, description: 'Checkout only these pattern ids' },
      pages: { type: 'array', string: true, description: 'Checkout only these page slugs' },
    }),
  handler: (args: PullArgs) =>
    runRegistryCommand(args, (handoff) => {
      warnDeprecatedCommand('pull', 'checkout');
      return handoff.checkoutAll(resolveCompatTargets(args));
    }),
};

export default pull;
