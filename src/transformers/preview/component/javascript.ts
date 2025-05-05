import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { InlineConfig, build as viteBuild } from 'vite';
import Handoff, { initIntegrationObject } from '../../../index';
import viteBaseConfig from '../../config';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';

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
  } catch (e) {
    console.error(chalk.red(`Error building ${outputFilename}`), e);
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
  const entry = data.entries?.js;
  if (!entry) return data;

  const outputPath = getComponentOutputPath(handoff);

  try {
    const js = await fs.readFile(path.resolve(entry), 'utf8');
    await buildJsBundle(
      {
        entry,
        outputPath,
        outputFilename: `${id}.js`,
      },
      handoff
    );

    data.js = js;
    const compiled = await fs.readFile(path.resolve(outputPath, `${id}.js`), 'utf8');
    data['jsCompiled'] = compiled;
  } catch (e) {
    console.error(`[Component JS Build Error] ${id}:`, e);
  }

  return data;
};

/**
 * Builds the main JavaScript bundle for the component preview.
 *
 * This function checks if there's a main JavaScript bundle defined in the integration,
 * and if the file exists, it builds the bundle and outputs it to the component's output path.
 *
 * @param handoff - The Handoff configuration object containing integration settings
 * @returns A Promise that resolves when the build process is complete
 * @throws May throw an error if the build process fails
 */
export const buildMainJS = async (handoff: Handoff): Promise<void> => {
  const outputPath = getComponentOutputPath(handoff);
  const integration = initIntegrationObject(handoff)[0];

  if (integration && integration.entries.bundle && fs.existsSync(path.resolve(integration.entries.bundle))) {
    await buildJsBundle(
      {
        entry: integration.entries.bundle,
        outputPath,
        outputFilename: 'main.js',
      },
      handoff
    );
  }
};

export default buildComponentJs;
