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
  { entry, outputPath, outputFilename }: { entry: string; outputPath: string; outputFilename: string },
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
          formats: ['cjs'],
          fileName: () => outputFilename,
        },
        rollupOptions: {
          ...viteBaseConfig.build?.rollupOptions,
          output: {
            exports: 'named',
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
  const exists = fs.existsSync(path.resolve(entry));
  if (!exists) {
    Logger.error(`Entry path "${entry}" does not exist`);
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
 * Builds the main JavaScript bundle for the component preview.
 *
 * This function checks if there's a main JavaScript bundle defined in the runtime config,
 * and if the file exists, it builds the bundle and outputs it to the component's output path.
 *
 * @param handoff - The Handoff configuration object containing build settings
 * @returns A Promise that resolves when the build process is complete
 */
export const buildMainJS = async (handoff: Handoff): Promise<void> => {
  const outputPath = getComponentOutputPath(handoff);
  const runtimeConfig = initRuntimeConfig(handoff)[0];

  if (runtimeConfig && runtimeConfig.entries.js && fs.existsSync(path.resolve(runtimeConfig.entries.js))) {
    Logger.info(`Building script for global entry (${MAIN_COMPONENT_JS_FILE})…`);
    const startedAt = Date.now();
    try {
      await buildJsBundle(
        {
          entry: runtimeConfig.entries.js,
          outputPath,
          outputFilename: MAIN_COMPONENT_JS_FILE,
        },
        handoff
      );
      Logger.info(`Finished building script for global entry (${MAIN_COMPONENT_JS_FILE}) in ${formatDurationMs(Date.now() - startedAt)}`);
    } catch (e) {
      Logger.error(`Failed to build global script (${MAIN_COMPONENT_JS_FILE}):`, e);
    }
  }
};

export default buildComponentJs;
