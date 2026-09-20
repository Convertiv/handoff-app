import fs from 'fs-extra';
import path from 'path';
import { InlineConfig, build as viteBuild } from 'vite';
import Handoff from '../../../index';
import { formatDurationMs } from '../../../utils/duration';
import { Logger } from '../../../utils/logger';
import { collectStyleImports } from '../../utils/build';
import viteBaseConfig from '../../vite-config';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';
const { pathToFileURL } = require('url');

export const MAIN_COMPONENT_CSS_FILE = 'main.css';
export const SHARED_COMPONENT_CSS_FILE = 'shared.css';

/**
 * Builds a CSS bundle using Vite
 *
 * @param options - The options object
 * @param options.entry - The entry file path for the bundle
 * @param options.outputPath - The directory where the bundle will be output
 * @param options.outputFilename - The name of the output file
 * @param options.loadPaths - Array of paths for SASS to look for imports
 * @param options.handoff - The Handoff configuration object
 */
const buildCssBundle = async ({
  entry,
  outputPath,
  outputFilename,
  loadPaths,
  handoff,
}: {
  entry: string;
  outputPath: string;
  outputFilename: string;
  loadPaths: string[];
  handoff: Handoff;
}): Promise<void> => {
  // Store the current NODE_ENV value
  const oldNodeEnv = process.env.NODE_ENV;
  try {
    let viteConfig: InlineConfig = {
      ...viteBaseConfig,
      build: {
        ...viteBaseConfig.build,
        outDir: outputPath,
        emptyOutDir: false,
        minify: false,
        rollupOptions: {
          input: {
            style: entry,
          },
          output: {
            // TODO: This was an edge case where we needed to output a different filename for the CSS file
            assetFileNames: outputFilename,
          },
        },
      },
      css: {
        preprocessorOptions: {
          scss: {
            loadPaths,
            quietDeps: true,
            // TODO: Discuss this with Domagoj
            // Maintain compatibility with older sass imports
            // importers: [
            //   {
            //     findFileUrl(url) {
            //       console.log('findFileUrl', url);
            //       if (!url.startsWith('~')) return null;
            //       return new URL(url.substring(1), pathToFileURL('node_modules'));
            //     },
            //   },
            // ],
            // Use modern API settings
            // api: 'modern-compiler',
            silenceDeprecations: ['import', 'legacy-js-api'],
          },
        },
      },
    };

    // Allow configuration to be modified through hooks
    if (handoff?.config?.hooks?.cssBuildConfig) {
      viteConfig = handoff.config.hooks.cssBuildConfig(viteConfig);
    }

    await viteBuild(viteConfig);
  } catch (e) {
    Logger.error(`Failed to build CSS for "${entry}"`);
    throw e;
  } finally {
    // Restore the original NODE_ENV value
    if (oldNodeEnv === 'development' || oldNodeEnv === 'production' || oldNodeEnv === 'test') {
      (process.env as any).NODE_ENV = oldNodeEnv;
    } else {
      delete (process.env as any).NODE_ENV;
    }
  }
};

const STYLE_SOURCE_EXTENSIONS = new Set(['.scss', '.sass', '.css']);

/**
 * The stylesheets of one item, in cascade order and deduplicated by resolved path.
 *
 * Discovered imports come first and the declared entry last, so a declared entry can override what
 * the component imports. A project that both declares and imports one file must build it once.
 */
const resolveStyleSources = async (data: TransformComponentTokensResult, handoff: Handoff): Promise<string[]> => {
  const template = data.entries?.template;
  const discovered = template ? await collectStyleImports(path.resolve(template), handoff) : [];
  const declared = data.entries?.scss ? [path.resolve(data.entries.scss)] : [];

  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const source of [...discovered, ...declared]) {
    if (!seen.has(source) && STYLE_SOURCE_EXTENSIONS.has(path.extname(source)) && fs.existsSync(source)) {
      seen.add(source);
      ordered.push(source);
    }
  }

  return ordered;
};

/**
 * A single Sass entry that `@use`s every source in order.
 *
 * `@use` emits a repeated file once and inlines a plain `.css` source, which `@import` would leave
 * as an unresolvable URL. Namespaces are explicit because two sources sharing a basename would
 * claim the same default namespace and fail the compile.
 */
const writeCombinedStyleEntry = async (sources: string[], outputPath: string, id: string): Promise<string> => {
  const entryPath = path.resolve(outputPath, `.${id}.entry.scss`);
  const rules = sources.map((source, index) => `@use '${source.split(path.sep).join('/')}' as ns${index};`);

  await fs.outputFile(entryPath, `${rules.join('\n')}\n`);

  return entryPath;
};

const buildComponentCss = async (data: TransformComponentTokensResult, handoff: Handoff) => {
  const id = data.id;
  Logger.debug(`buildComponentCss`, id);
  const outputPath = getComponentOutputPath(handoff);
  const builtCssPath = path.resolve(outputPath, `${id}.css`);
  const sources = await resolveStyleSources(data, handoff);

  if (sources.length === 0) {
    // Keep generated output aligned with the current component declaration.
    await fs.remove(builtCssPath);
    delete data['css'];
    delete data['sass'];
    delete data['sharedStyles'];
    return data;
  }

  // A single source compiles directly, so its relative asset URLs and documented Sass stay as authored.
  const combinedEntry = sources.length > 1 ? await writeCombinedStyleEntry(sources, outputPath, id) : undefined;
  const entry = combinedEntry ?? sources[0];

  try {
    // Remove the previous artifact before rebuilding so "no emitted CSS"
    // doesn't silently preserve stale output from an earlier build.
    await fs.remove(builtCssPath);

    // Read the original source
    const primarySource = data.entries?.scss ? path.resolve(data.entries.scss) : sources[0];
    if (path.extname(primarySource) === '.scss') {
      data['sass'] = await fs.readFile(primarySource, 'utf8');
    }

    // Setup SASS load paths
    const loadPaths = [
      path.resolve(handoff.workingPath),
      path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId()),
      path.resolve(handoff.workingPath, 'node_modules'),
    ];

    if (handoff.runtimeConfig?.entries?.scss) {
      loadPaths.unshift(path.dirname(handoff.runtimeConfig.entries.scss));
    }

    await buildCssBundle({
      entry,
      outputPath,
      outputFilename: `${id}.css`,
      loadPaths,
      handoff,
    });

    // Read the built CSS
    if (fs.existsSync(builtCssPath)) {
      const builtCss = await fs.readFile(builtCssPath, 'utf8');
      data['css'] = builtCss;

      // Handle shared styles — if the component SCSS uses the split marker,
      // extract shared styles from the portion above it
      const splitCSS = builtCss.split('/* COMPONENT STYLES*/');
      if (splitCSS && splitCSS.length > 1) {
        data['css'] = splitCSS[1];
        data['sharedStyles'] = splitCSS[0];
        await fs.writeFile(path.resolve(outputPath, SHARED_COMPONENT_CSS_FILE), data['sharedStyles']);
      }
    } else {
      delete data['css'];
      delete data['sharedStyles'];
    }
  } catch (e) {
    Logger.error(`Failed to build CSS for "${id}"`);
    throw e;
  } finally {
    if (combinedEntry) {
      await fs.remove(combinedEntry);
    }
  }

  return data;
};

/**
 * Build the main CSS file using Vite
 */
export const buildMainCss = async (handoff: Handoff): Promise<void> => {
  const outputPath = getComponentOutputPath(handoff);
  const mainCssPath = path.resolve(outputPath, MAIN_COMPONENT_CSS_FILE);
  const scssEntry = handoff.runtimeConfig?.entries?.scss;

  if (scssEntry && fs.existsSync(scssEntry)) {
    const stat = await fs.stat(scssEntry);
    const entryPath = stat.isDirectory() ? path.resolve(scssEntry, 'main.scss') : scssEntry;

    if (entryPath === scssEntry || fs.existsSync(entryPath)) {
      Logger.info(`Building styles for global entry (${MAIN_COMPONENT_CSS_FILE})…`);
      const startedAt = Date.now();
      // Drop the previous artifact so a failed/empty rebuild cannot preserve stale global CSS that
      // would still be referenced as current.
      await fs.remove(mainCssPath);
      try {
        const loadPaths = [
          path.dirname(scssEntry),
          path.resolve(handoff.workingPath),
          path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId()),
          path.resolve(handoff.workingPath, 'node_modules'),
        ];

        await buildCssBundle({
          entry: entryPath,
          outputPath,
          outputFilename: MAIN_COMPONENT_CSS_FILE,
          loadPaths,
          handoff,
        });
        Logger.info(`Finished building styles for global entry (${MAIN_COMPONENT_CSS_FILE}) in ${formatDurationMs(Date.now() - startedAt)}`);
      } catch {
        // buildCssBundle already logs failure for the entry path; ensure no stale artifact remains.
        await fs.remove(mainCssPath);
      }
    }
    return;
  }

  // No usable global SCSS entry: drop any stale artifact so it is not referenced as current.
  await fs.remove(mainCssPath);
};

export default buildComponentCss;
