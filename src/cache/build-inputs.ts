import type { InlineConfig, Plugin } from 'vite';

/**
 * The files that the builds of one component read, so the build cache can tell when an imported
 * file changes. A failed build can stop before it reads the file that broke it, so its list is
 * incomplete and must not be cached.
 */
export interface BuildInputs {
  files: Set<string>;
  failed: boolean;
}

export const createBuildInputs = (): BuildInputs => ({ files: new Set(), failed: false });

/**
 * Records every file that a Vite build loaded, Sass partials included. The Vite CSS plugin registers
 * partials with `addWatchFile`, and Rollup keeps this list in every build, not only in watch mode.
 */
const collectBuildInputs = (inputs: BuildInputs): Plugin => ({
  name: 'handoff:collect-build-inputs',
  buildEnd() {
    for (const file of this.getWatchFiles()) inputs.files.add(file);
  },
});

/** Call after the consumer hooks, so that a hook that replaces `plugins` cannot drop the collector. */
export const withBuildInputs = (config: InlineConfig, inputs?: BuildInputs): InlineConfig =>
  inputs ? { ...config, plugins: [...(config.plugins ?? []), collectBuildInputs(inputs)] } : config;
