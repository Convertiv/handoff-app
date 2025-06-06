import chalk from 'chalk';
import chokidar from 'chokidar';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { createServer } from 'http';
import next from 'next';
import { nextBuild } from 'next/dist/cli/next-build';
import { nextDev } from 'next/dist/cli/next-dev';
import path from 'path';
import { parse } from 'url';
import Handoff from '.';
import { buildComponents, buildIntegrationOnly, readPrevJSONFile, tokensFilePath } from './pipeline';
import { createWebSocketServer, processSharedStyles } from './transformers/preview/component';
import processComponents from './transformers/preview/component/builder';
import { DocumentationObject } from './types';
import { buildClientFiles } from './utils/preview';

const getWorkingPublicPath = (handoff: Handoff): string | null => {
  const paths = [
    path.resolve(handoff.workingPath, `public-${handoff.config.figma_project_id}`),
    path.resolve(handoff.workingPath, `public`),
  ];

  for (const path of paths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  return null;
};

const getAppPath = (handoff: Handoff): string => {
  return path.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`);
};

/**
 * Copy the public dir from the working dir to the module dir
 * @param handoff
 */
const mergePublicDir = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);
  const workingPublicPath = getWorkingPublicPath(handoff);
  if (workingPublicPath) {
    fs.copySync(workingPublicPath, path.resolve(appPath, 'public'), { overwrite: true });
  }
};

/**
 * Copy the mdx files from the working dir to the module dir
 * @param handoff
 */
const mergeMDX = async (handoff: Handoff): Promise<void> => {
  console.log(chalk.yellow('Merging MDX files...'));
  const appPath = getAppPath(handoff);
  const pages = path.resolve(handoff.workingPath, `pages`);
  if (fs.existsSync(pages)) {
    // Find all mdx files in path
    const files = fs.readdirSync(pages);
    for (const file of files) {
      if (file.endsWith('.mdx')) {
        // transform the file
        transformMdx(path.resolve(pages, file), path.resolve(appPath, 'pages', file), file.replace('.mdx', ''));
      } else if (fs.lstatSync(path.resolve(pages, file)).isDirectory()) {
        // Recursion - find all mdx files in sub directories
        const subFiles = fs.readdirSync(path.resolve(pages, file));
        for (const subFile of subFiles) {
          if (subFile.endsWith('.mdx')) {
            // transform the file
            const target = path.resolve(appPath, 'pages', file);
            if (!fs.existsSync(target)) {
              fs.mkdirSync(target, { recursive: true });
            }
            transformMdx(path.resolve(pages, file, subFile), path.resolve(appPath, 'pages', file, subFile), file);
          } else if (fs.lstatSync(path.resolve(pages, file, subFile)).isDirectory()) {
            const thirdFiles = fs.readdirSync(path.resolve(pages, file, subFile));
            for (const thirdFile of thirdFiles) {
              if (thirdFile.endsWith('.mdx')) {
                const target = path.resolve(appPath, 'pages', file, subFile);
                if (!fs.existsSync(target)) {
                  fs.mkdirSync(target, { recursive: true });
                }
                transformMdx(path.resolve(pages, file, subFile, thirdFile), path.resolve(appPath, 'pages', file, subFile, thirdFile), file);
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Remove the frontmatter from the mdx file, convert it to an import, and
 * add the metadata to the export.  Then write the file to the destination.
 * @param src
 * @param dest
 * @param id
 */
const transformMdx = (src: string, dest: string, id: string) => {
  const content = fs.readFileSync(src);
  const { data, content: body } = matter(content);
  let mdx = body;
  const title = data.title ?? '';
  const menu = data.menu ?? '';
  const description = data.description ? data.description.replace(/(\r\n|\n|\r)/gm, '') : '';
  const metaDescription = data.metaDescription ?? '';
  const metaTitle = data.metaTitle ?? '';
  const weight = data.weight ?? 0;
  const image = data.image ?? '';
  const menuTitle = data.menuTitle ?? '';
  const enabled = data.enabled ?? true;
  const wide = data.wide ? 'true' : 'false';
  //
  mdx = `
\n\n${mdx}\n\n
import {staticBuildMenu, getCurrentSection} from "@handoff/app/components/util";
import { getClientConfig } from '@handoff/config';
import { getPreview } from "@handoff/app/components/util";

export const getStaticProps = async () => {
  // get previews for components on this page
  const previews = getPreview();
  const menu = staticBuildMenu();
  const config = getClientConfig();
  return {
    props: {
      previews,
      menu,
      config,
      current: getCurrentSection(menu, "/${id}") ?? [],
      title: "${title}",
      description: "${description}",
      image: "${image}",
    },
  };
};

export const preview = (name) => {
  return previews.components[name];
};

import MarkdownLayout from "@handoff/app/components/Layout/Markdown";
export default function Layout(props) {
  return (
    <MarkdownLayout
      menu={props.menu}
      metadata={{
        description: "${description}",
        metaDescription: "${metaDescription}",
        metaTitle: "${metaTitle}",
        title: "${title}",
        weight: ${weight},
        image: "${image}",
        menuTitle: "${menuTitle}",
        enabled: ${enabled},
      }}
      wide={${wide}}
      allPreviews={props.previews}
      config={props.config}
      current={props.current}
    >
      {props.children}
    </MarkdownLayout>
  );

}`;
  fs.writeFileSync(dest, mdx, 'utf-8');
};

const performCleanup = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);

  // Clean project app dir
  if (fs.existsSync(appPath)) {
    await fs.rm(appPath, { recursive: true });
  }
};

const prepareProjectApp = async (handoff: Handoff): Promise<string> => {
  const srcPath = path.resolve(handoff.modulePath, 'src', 'app');
  const appPath = getAppPath(handoff);

  // Prepare project app dir
  await fs.promises.mkdir(appPath, { recursive: true });
  await fs.copy(srcPath, appPath, { overwrite: true });
  await mergePublicDir(handoff);
  await mergeMDX(handoff);

  // Prepare project app configuration
  const handoffProjectId = handoff.config.figma_project_id ?? '';
  const handoffAppBasePath = handoff.config.app.base_path ?? '';
  const handoffWorkingPath = path.resolve(handoff.workingPath);
  const handoffIntegrationPath = path.resolve(handoff.workingPath, handoff.config.integrationPath ?? 'integration');
  const handoffModulePath = path.resolve(handoff.modulePath);
  const handoffExportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
  const nextConfigPath = path.resolve(appPath, 'next.config.mjs');
  const handoffUseReferences = handoff.config.useVariables ?? false;
  const nextConfigContent = (await fs.readFile(nextConfigPath, 'utf-8'))
    .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
    .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
    .replace(/HANDOFF_INTEGRATION_PATH:\s+\'\'/g, `HANDOFF_INTEGRATION_PATH: '${handoffIntegrationPath}'`)
    .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
    .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
    .replace(/HANDOFF_USE_REFERENCES:\s+\'\'/g, `HANDOFF_USE_REFERENCES: '${handoffUseReferences}'`)
    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
  await fs.writeFile(nextConfigPath, nextConfigContent);

  return appPath;
};

/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  // Perform cleanup
  await performCleanup(handoff);

  // If we are building the app, ensure the integration is built first
  await buildIntegrationOnly(handoff);
  await buildComponents(handoff);

  // Build client preview styles
  await buildClientFiles(handoff)
    .then((value) => !!value && console.log(chalk.green(value)))
    .catch((error) => {
      throw new Error(error);
    });

  // Prepare app
  const appPath = await prepareProjectApp(handoff);

  // Build app
  await nextBuild(
    {
      lint: true,
      mangling: true,
      experimentalDebugMemoryUsage: false,
      experimentalAppOnly: false,
      experimentalTurbo: false,
      experimentalBuildMode: 'default',
    },
    appPath
  );

  // Ensure output root directory exists
  const outputRoot = path.resolve(handoff.workingPath, handoff.sitesDirectory);
  if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
  }

  // Clean the project output directory (if exists)
  const output = path.resolve(outputRoot, handoff.config.figma_project_id);
  if (fs.existsSync(output)) {
    fs.removeSync(output);
  }

  // Copy the build files into the project output directory
  fs.copySync(path.resolve(appPath, 'out'), output);
};

/**
 * Watch the next js application
 * @param handoff
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  const tokensJsonFilePath = tokensFilePath(handoff);

  if (!fs.existsSync(tokensJsonFilePath)) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  const documentationObject: DocumentationObject | undefined = await readPrevJSONFile(tokensJsonFilePath);
  const sharedStyles = await processSharedStyles(handoff);

  // Build client preview styles
  await buildClientFiles(handoff)
    .then((value) => !!value && console.log(chalk.green(value)))
    .catch((error) => {
      throw new Error(error);
    });

  // Initial processing of the components
  await processComponents(handoff, undefined, sharedStyles, documentationObject.components);

  const appPath = await prepareProjectApp(handoff);
  // Include any changes made within the app source during watch
  chokidar
    .watch(path.resolve(handoff.modulePath, 'src', 'app'), {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    })
    .on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          await prepareProjectApp(handoff);
          break;
      }
    });

  // // does a ts config exist?
  // let tsconfigPath = 'tsconfig.json';

  // config.typescript = {
  //   ...config.typescript,
  //   tsconfigPath,
  // };
  const dev = true;
  const hostname = 'localhost';
  const port = 3000;
  // when using middleware `hostname` and `port` must be provided below
  const app = next({
    dev,
    dir: appPath,
    hostname,
    port,
    // conf: config,
  });

  const handle = app.getRequestHandler();

  // purge out cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }
  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        // Be sure to pass `true` as the second argument to `url.parse`.
        // This tells it to parse the query portion of the URL.
        if (!req.url) throw new Error('No url');
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
      .once('error', (err: string) => {
        console.error(err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
      });
  });

  const wss = await createWebSocketServer(3001);

  const chokidarConfig = {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  };
  let debounce = false;
  if (fs.existsSync(path.resolve(handoff.workingPath, 'exportables'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'exportables'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (path.includes('json') && !debounce) {
            console.log(chalk.yellow('Exportables changed. Handoff will fetch new tokens...'));
            debounce = true;
            await handoff.fetch();
            debounce = false;
          }
          break;
      }
    });
  }
  if (fs.existsSync(path.resolve(handoff.workingPath, 'public'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'public'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (!debounce) {
            debounce = true;
            console.log(chalk.yellow('Public directory changed. Handoff will ingest the new data...'));
            await mergePublicDir(handoff);
            wss(JSON.stringify({ type: 'reload' }));
            debounce = false;
          }
          break;
      }
    });
  }

  let runtimeComponentsWatcher: chokidar.FSWatcher | null = null;
  let runtimeConfigurationWatcher: chokidar.FSWatcher | null = null;

  const persistRuntimeCache = () => {
    const destination = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'runtime.cache.json');
    fs.writeFileSync(destination, JSON.stringify(handoff.integrationObject, null, 2), 'utf-8');
  };

  const watchRuntimeComponents = (runtimeComponentPathsToWatch: Set<string>) => {
    persistRuntimeCache();

    if (runtimeComponentsWatcher) {
      runtimeComponentsWatcher.close();
    }

    if (runtimeComponentPathsToWatch.size > 0) {
      runtimeComponentsWatcher = chokidar.watch(Array.from(runtimeComponentPathsToWatch), { ignoreInitial: true });
      runtimeComponentsWatcher.on('all', async (event, file) => {
        if (handoff._configs.includes(file)) {
          return;
        }

        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!debounce) {
              debounce = true;
              file = path.dirname(path.dirname(file));
              const extension = path.extname(file);
              const segmentToUpdate =
                extension === '.scss' ? 'css' : extension === '.js' ? 'js' : extension === '.hbs' ? 'previews' : undefined;
              await processComponents(handoff, path.basename(file), sharedStyles, documentationObject.components, segmentToUpdate);
              debounce = false;
            }
            break;
        }
      });
    }
  };

  const watchRuntimeConfiguration = () => {
    if (runtimeConfigurationWatcher) {
      runtimeConfigurationWatcher.close();
    }

    if (handoff._configs.length > 0) {
      runtimeConfigurationWatcher = chokidar.watch(handoff._configs, { ignoreInitial: true });
      runtimeConfigurationWatcher.on('all', async (event, file) => {
        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!debounce) {
              debounce = true;
              file = path.dirname(path.dirname(file));
              handoff.reload();
              watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
              await processComponents(handoff, path.basename(file), sharedStyles, documentationObject.components);
              debounce = false;
            }
            break;
        }
      });
    }
  };

  const getRuntimeComponentsPathsToWatch = () => {
    const result: Set<string> = new Set<string>();

    for (const runtimeComponentId of Object.keys(handoff.integrationObject?.entries.components ?? {})) {
      for (const runtimeComponentVersion of Object.keys(handoff.integrationObject.entries.components[runtimeComponentId])) {
        const runtimeComponent = handoff.integrationObject.entries.components[runtimeComponentId][runtimeComponentVersion];
        for (const [_, runtimeComponentEntryPath] of Object.entries(runtimeComponent.entries ?? {})) {
          const normalizedComponentEntryPath = runtimeComponentEntryPath as string;
          if (fs.existsSync(normalizedComponentEntryPath)) {
            if (fs.statSync(normalizedComponentEntryPath).isFile()) {
              result.add(path.dirname(normalizedComponentEntryPath));
            } else {
              result.add(normalizedComponentEntryPath);
            }
          }
        }
      }
    }

    return result;
  };

  if (fs.existsSync(path.resolve(handoff.workingPath, 'handoff.config.json'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'handoff.config.json'), { ignoreInitial: true }).on('all', async (event, file) => {
      console.log(chalk.yellow('handoff.config.json changed. Please restart server to see changes...'));
      if (!debounce) {
        debounce = true;
        handoff.reload();
        watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
        watchRuntimeConfiguration();
        await processComponents(handoff, undefined, sharedStyles, documentationObject.components);
        debounce = false;
      }
    });
  }

  watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
  watchRuntimeConfiguration();

  if (handoff.integrationObject?.entries?.integration && fs.existsSync(handoff.integrationObject?.entries?.integration)) {
    const stat = await fs.stat(handoff.integrationObject.entries.integration);
    chokidar
      .watch(
        stat.isDirectory() ? handoff.integrationObject.entries.integration : path.dirname(handoff.integrationObject.entries.integration),
        chokidarConfig
      )
      .on('all', async (event, file) => {
        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!debounce) {
              debounce = true;
              await buildIntegrationOnly(handoff);
              await processSharedStyles(handoff);
              debounce = false;
            }
        }
      });
  }

  if (fs.existsSync(path.resolve(handoff.workingPath, 'pages'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'pages'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (path.endsWith('.mdx')) {
            mergeMDX(handoff);
          }
          console.log(chalk.yellow(`Doc page ${event}ed. Please reload browser to see changes...`), path);
          break;
      }
    });
  }
};

/**
 * Watch the next js application
 * @param handoff
 */
export const devApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  // Build client preview styles
  await buildClientFiles(handoff)
    .then((value) => !!value && console.log(chalk.green(value)))
    .catch((error) => {
      throw new Error(error);
    });

  // Prepare app
  const appPath = await prepareProjectApp(handoff);
  // Purge app cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }

  // Run
  return await nextDev({ port: 3000 }, 'cli', appPath);
};

export default buildApp;
