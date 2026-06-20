import fs from 'fs-extra';
import path from 'path';
import { InlineConfig, build as viteBuild } from 'vite';
import { initRuntimeConfig } from '../../../config';
import Handoff from '../../../index';
import { formatDurationMs } from '../../../utils/duration';
import { Logger } from '../../../utils/logger';
import viteBaseConfig from '../../vite-config';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';

export const MAIN_COMPONENT_JS_FILE = 'main.js';

/**
 * Builds a JavaScript bundle using Vite
 *
 * @param options - The options object
 * @param options.entry - The entry file path for the bundle
 * @param options.outputPath - The directory where the bundle will be output
 * @param options.outputFilename - The name of the output file
 */
const buildJsBundle = async (
  {
    entry,
    outputPath,
    outputFilename,
    format = 'cjs',
  }: { entry: string; outputPath: string; outputFilename: string; format?: 'cjs' | 'iife' },
  handoff: Handoff
) => {
  const absEntryPath = path.resolve(entry);

  // Store the current NODE_ENV value before vite build
  // This is necessary because viteBuild forcibly sets NODE_ENV to 'production'
  // which can cause issues with subsequent Next.js operations that rely on
  // the original NODE_ENV value
  const oldNodeEnv = process.env.NODE_ENV;

  try {
    let viteConfig: InlineConfig = {
      ...viteBaseConfig,
      build: {
        ...viteBaseConfig.build,
        lib: {
          entry: absEntryPath,
          name: path.basename(outputFilename, '.js'),
          formats: [format],
          fileName: () => outputFilename,
        },
        rollupOptions: {
          ...viteBaseConfig.build?.rollupOptions,
          output: {
            // The global IIFE bundle is frequently side-effect-only; `auto` lets a bundle with no
            // exports emit cleanly while `named` preserves the existing component-JS (cjs) behavior.
            exports: format === 'iife' ? 'auto' : 'named',
          },
        },
        outDir: outputPath,
      },
    };

    if (handoff?.config?.hooks?.jsBuildConfig) {
      viteConfig = handoff.config.hooks.jsBuildConfig(viteConfig);
    }

    await viteBuild(viteConfig);
  } finally {
    // Restore the original NODE_ENV value after vite build completes
    // This prevents interference with Next.js app building/running processes
    // that depend on the correct NODE_ENV value
    if (oldNodeEnv === 'development' || oldNodeEnv === 'production' || oldNodeEnv === 'test') {
      (process.env as any).NODE_ENV = oldNodeEnv;
    } else {
      delete (process.env as any).NODE_ENV;
    }
  }
};

/**
 * Builds the JavaScript file for a single component if it exists.
 * Reads the component JavaScript file, bundles it using the buildJsBundle utility,
 * and adds both the original and compiled JavaScript to the transform result.
 *
 * @param data - The component transformation result containing the component data
 * @param handoff - The Handoff configuration object
 * @returns The updated component transformation result with JavaScript data
 */
export const buildComponentJs = async (data: TransformComponentTokensResult, handoff: Handoff): Promise<TransformComponentTokensResult> => {
  const id = data.id;
  const outputPath = getComponentOutputPath(handoff);
  const builtJsPath = path.resolve(outputPath, `${id}.js`);
  const entry = data.entries?.js;

  if (!entry) {
    // Keep generated output aligned with the current component declaration.
    await fs.remove(builtJsPath);
    delete data.js;
    delete data['jsCompiled'];
    return data;
  }

  try {
    // Remove the previous artifact before rebuilding so a no-output build
    // cannot accidentally preserve stale compiled JS.
    await fs.remove(builtJsPath);

    const js = await fs.readFile(path.resolve(entry), 'utf8');
    try {
      await buildJsBundle(
        {
          entry,
          outputPath,
          outputFilename: `${id}.js`,
        },
        handoff
      );
    } catch (e) {
      Logger.error(`Failed to bundle JS for component "${id}" (${id}.js):`, e);
      return data;
    }

    data.js = js;
    if (await fs.pathExists(builtJsPath)) {
      const compiled = await fs.readFile(builtJsPath, 'utf8');
      data['jsCompiled'] = compiled;
    } else {
      delete data['jsCompiled'];
    }
  } catch (e) {
    Logger.error(`JS build failed for component "${id}":`, e);
  }

  return data;
};

/**
 * Builds the global preview script artifact (`component/main.js`) from the configured workspace JS
 * entry (shared/global artifact model, technical design §7).
 *
 * The artifact is optional: when no global JS entry is configured, or the configured entry no longer
 * exists, or the build fails/produces no output, any stale `main.js` is removed so a failed rebuild
 * never leaves global JS that appears current. Generated HTML references `main.js` only when this
 * function leaves a fresh artifact on disk, so an omitted artifact yields no dangling reference.
 *
 * Output uses the browser-compatible IIFE format so the artifact can load as a classic script ahead
 * of dependent component scripts while preserving intentional top-level side effects.
 *
 * @param handoff - The Handoff configuration object containing build settings
 * @returns A Promise that resolves when the build process is complete
 */
export const buildMainJS = async (handoff: Handoff): Promise<void> => {
  const outputPath = getComponentOutputPath(handoff);
  const mainJsPath = path.resolve(outputPath, MAIN_COMPONENT_JS_FILE);
  const runtimeConfig = initRuntimeConfig(handoff)[0];
  const entry = runtimeConfig?.entries?.js;

  // No usable global JS entry: drop any stale artifact and emit nothing to reference.
  if (!entry || !fs.existsSync(path.resolve(entry))) {
    if (entry) {
      Logger.warn(`Global JS entry "${entry}" was not found; removing stale ${MAIN_COMPONENT_JS_FILE}.`);
    }
    await fs.remove(mainJsPath);
    return;
  }

  Logger.info(`Building script for global entry (${MAIN_COMPONENT_JS_FILE})…`);
  const startedAt = Date.now();

  // Remove the previous artifact before rebuilding so a failed or empty build cannot silently
  // preserve stale global JS that would still be referenced as current.
  await fs.remove(mainJsPath);

  try {
    await buildJsBundle(
      {
        entry,
        outputPath,
        outputFilename: MAIN_COMPONENT_JS_FILE,
        format: 'iife',
      },
      handoff
    );

    if (await fs.pathExists(mainJsPath)) {
      Logger.info(`Finished building script for global entry (${MAIN_COMPONENT_JS_FILE}) in ${formatDurationMs(Date.now() - startedAt)}`);
    } else {
      Logger.error(`Global script build produced no ${MAIN_COMPONENT_JS_FILE} from "${entry}".`);
    }
  } catch (e) {
    Logger.error(`Failed to build global script (${MAIN_COMPONENT_JS_FILE}) from "${entry}":`, e);
    // Ensure a partial/failed build leaves no stale or broken artifact behind.
    await fs.remove(mainJsPath);
  }
};

export default buildComponentJs;
