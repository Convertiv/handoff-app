/**
 * Deprecation notices for the documented-but-superseded CLI surface.
 *
 * Messaging only: no publish, checkout or config behavior lives in this directory. Notices go through
 * {@link Logger.warn} so `HANDOFF_LOG_LEVEL=error` silences them in CI, where the operator has
 * already accepted the older form.
 *
 * Call these from inside `runRegistryCommand`'s callback, never before it. `Logger` reads
 * `HANDOFF_LOG_LEVEL` when the `Handoff` instance is constructed, so a notice emitted earlier prints
 * at the default level and ignores the configured one.
 */

import { Logger } from '../../utils/logger';

/** Announce that a command is on its way out and name the canonical form to move to. */
export const warnDeprecatedCommand = (invoked: string, canonical: string): void => {
  Logger.warn(`\`handoff-app ${invoked}\` is deprecated and will be removed in a future release; use \`handoff-app ${canonical}\` instead.`);
};

/**
 * A documented option we cannot honor, and why. Declared rather than left to `.strict()` so a command
 * copied from the docs runs and explains itself instead of failing with "Unknown argument".
 */
interface UnsupportedOption {
  /** yargs option key, camelCased as yargs delivers it. */
  key: string;
  /** How the option is written on the command line, for the warning text. */
  flag: string;
  /** yargs value type; only `-m, --message` carries a value. */
  type?: 'boolean' | 'string';
  /** Short flag, where the docs give one. */
  alias?: string;
  reason: string;
}

/** Options documented for `push` itself. */
export const UNSUPPORTED_PUSH_OPTIONS: readonly UnsupportedOption[] = [
  {
    key: 'metadataOnly',
    flag: '--metadata-only',
    reason: 'a publish replaces an entity\'s files and artifacts as one package, so a metadata-only upload would delete them',
  },
  { key: 'message', flag: '-m, --message', type: 'string', alias: 'm', reason: 'there is no change history to annotate' },
];

/** Options documented for `push:tokens`. */
export const UNSUPPORTED_PUSH_TOKENS_OPTIONS: readonly UnsupportedOption[] = [
  { key: 'skipFigma', flag: '--skip-figma', reason: 'rebuilding tokens without a Figma request is not implemented yet' },
  { key: 'skipDtcg', flag: '--skip-dtcg', reason: 'there is no DTCG dist step in this pipeline' },
];

/** `push:all` steps documented for subsystems we do not have. */
export const UNSUPPORTED_PUSH_ALL_OPTIONS: readonly UnsupportedOption[] = [
  { key: 'skipBuild', flag: '--skip-build', reason: 'use --no-build, which applies to the whole run' },
  ...['config', 'theme', 'navigation', 'dtcg', 'icons', 'logos', 'fonts', 'figma-fills', 'image-slots', 'design-md'].map((step) => ({
    key: `skip${step.replace(/(^|-)([a-z])/g, (_match, _dash, letter: string) => letter.toUpperCase())}`,
    flag: `--skip-${step}`,
    reason: 'this implementation has no such publish step',
  })),
  { key: 'message', flag: '-m, --message', type: 'string', alias: 'm', reason: 'there is no change history to annotate' },
];

/** Declare unsupported options as hidden yargs booleans so `.strict()` accepts them. */
export const hiddenOptions = (options: readonly UnsupportedOption[]) =>
  Object.fromEntries(
    options.map((option) => [
      option.key,
      { type: option.type ?? 'boolean', hidden: true, describe: option.reason, ...(option.alias ? { alias: option.alias } : {}) },
    ])
  );

/** Warn about every unsupported option present on the command line, then carry on. */
export const warnUnsupportedOptions = (args: Record<string, unknown>, options: readonly UnsupportedOption[]): void => {
  for (const option of options) {
    if (args[option.key] !== undefined && args[option.key] !== false) {
      Logger.warn(`${option.flag} is ignored: ${option.reason}.`);
    }
  }
};
