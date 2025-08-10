import chalk from 'chalk';
import chokidar from 'chokidar';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { createServer } from 'http';
import next from 'next';
import path from 'path';
import { parse } from 'url';
import { WebSocket } from 'ws';
import Handoff from '.';
import { getClientConfig } from './config';
import { buildComponents } from './pipeline';
import processComponents, { ComponentSegment } from './transformers/preview/component/builder';
import { ComponentListObject } from './transformers/preview/types';

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

/**
 * Creates a WebSocket server that broadcasts messages to connected clients.
 * Designed for development mode to help with hot-reloading.
 *
 * @param port - Optional port number for the WebSocket server; defaults to 3001.
 * @returns A function that accepts a message string and broadcasts it to all connected clients.
 */
const createWebSocketServer = async (port: number = 3001) => {
  const wss = new WebSocket.Server({ port });

  // Heartbeat function to mark a connection as alive.
  const heartbeat = function (this: ExtWebSocket) {
    this.isAlive = true;
  };

  // Setup a new connection
  wss.on('connection', (ws) => {
    const extWs = ws as ExtWebSocket;
    extWs.isAlive = true;
    extWs.send(JSON.stringify({ type: 'WELCOME' }));
    extWs.on('error', (error) => console.error('WebSocket error:', error));
    extWs.on('pong', heartbeat);
  });

  // Periodically ping clients to ensure they are still connected
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as ExtWebSocket;
      if (!extWs.isAlive) {
        console.log(chalk.yellow('Terminating inactive client'));
        return client.terminate();
      }
      extWs.isAlive = false;
      client.ping();
    });
  }, 30000);

  // Clean up the interval when the server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log(chalk.green(`WebSocket server started on ws://localhost:${port}`));

  // Return a function to broadcast a message to all connected clients
  return (message: string) => {
    console.log(chalk.green(`Broadcasting message to ${wss.clients.size} client(s)`));
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
};

/**
 * Gets the working public directory path for a given handoff instance
 * Checks for both project-specific and default public directories
 *
 * @param handoff - The handoff instance containing working path and figma project configuration
 * @returns The resolved path to the public directory if it exists, null otherwise
 */
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

/**
 * Gets the application path for a given handoff instance
 * @param handoff - The handoff instance containing module path and figma project configuration
 * @returns The resolved path to the application directory
 */
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
 * Publish the mdx files from the working dir to the module dir
 * @param handoff
 */
const publishMDX = async (handoff: Handoff): Promise<void> => {
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
  const title = data.title ?? '';
  const description = data.description ? data.description.replace(/(\r\n|\n|\r)/gm, '') : '';
  const metaDescription = data.metaDescription ?? '';
  const metaTitle = data.metaTitle ?? '';
  const weight = data.weight ?? 0;
  const image = data.image ?? '';
  const menuTitle = data.menuTitle ?? '';
  const enabled = data.enabled ?? true;
  const wide = data.wide ? 'true' : 'false';

  const mdxHeader = `// This file is auto-generated by transformMdx(). Do not edit manually.
// Source: ${src}
// Generated at: ${new Date().toISOString()}

`;

  const mdx = `${mdxHeader}import { getClientRuntimeConfig, getCurrentSection, staticBuildMenu } from '@handoff/app/components/util';
import fs from 'fs-extra';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import path from 'path';

export async function getStaticProps() {
  const mdxFilePath = path.join(process.env.HANDOFF_WORKING_PATH, 'pages', '${id}.mdx');
  const mdxSource = fs.readFileSync(mdxFilePath, 'utf8');

  const { data, content: body } = matter(mdxSource); // extract frontmatter and body
  const mdx = await serialize(body); // serialize only the body

  const menu = staticBuildMenu();
  const config = getClientRuntimeConfig();

  return {
    props: {
      mdx,
      menu,
      config,
      current: getCurrentSection(menu, "/${id}") ?? [],
      title: "${title}",
      description: "${description}",
      image: "${image}",
    },
  };
}

import MarkdownLayout from "@handoff/app/components/Layout/Markdown";
import { Hero } from "@handoff/app/components/Hero";

const components = { Hero };

export default function Layout(props) {
  return (
    <MarkdownLayout
      menu={props.menu}
      metadata={{
        description: "${description}",
        metaDescription: "${metaDescription}",
        metaTitle: "${metaTitle}",
        title: "${title}",
      }}
      wide={${wide}}
      config={props.config}
      current={props.current}
    >
      <MDXRemote {...props.mdx} components={components} />
    </MarkdownLayout>
  );
}`;
  fs.writeFileSync(dest.replaceAll('.mdx', '.tsx'), mdx, 'utf-8');
};

/**
 * Performs cleanup of the application directory by removing the existing app directory if it exists.
 * This is typically used before rebuilding the application to ensure a clean state.
 *
 * @param handoff - The Handoff instance containing configuration and working paths
 * @returns Promise that resolves when cleanup is complete
 */
const performCleanup = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);

  // Clean project app dir
  if (fs.existsSync(appPath)) {
    await fs.rm(appPath, { recursive: true });
  }
};

const publishTokensApi = async (handoff: Handoff) => {
  const apiPath = path.resolve(path.join(handoff.workingPath, 'public/api'));

  if (!fs.existsSync(apiPath)) {
    fs.mkdirSync(apiPath, { recursive: true });
  }

  const tokens = await handoff.getDocumentationObject();

  fs.writeFileSync(path.join(apiPath, 'tokens.json'), JSON.stringify(tokens, null, 2));

  if (!fs.existsSync(path.join(apiPath, 'tokens'))) {
    fs.mkdirSync(path.join(apiPath, 'tokens'));
  }

  for (const type in tokens) {
    if (type === 'timestamp') continue;
    for (const group in tokens[type]) {
      fs.writeFileSync(path.join(apiPath, 'tokens', `${group}.json`), JSON.stringify(tokens[type][group], null, 2));
    }
  }
};

const prepareProjectApp = async (handoff: Handoff): Promise<string> => {
  const srcPath = path.resolve(handoff.modulePath, 'src', 'app');
  const appPath = getAppPath(handoff);

  // Publish tokens API
  publishTokensApi(handoff);

  // Prepare project app dir
  await fs.promises.mkdir(appPath, { recursive: true });
  await fs.copy(srcPath, appPath, { overwrite: true });
  await mergePublicDir(handoff);
  await publishMDX(handoff);

  // Prepare project app configuration
  const handoffProjectId = handoff.config.figma_project_id ?? '';
  const handoffAppBasePath = handoff.config.app.base_path ?? '';
  const handoffWorkingPath = path.resolve(handoff.workingPath);
  const handoffModulePath = path.resolve(handoff.modulePath);
  const handoffExportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
  const nextConfigPath = path.resolve(appPath, 'next.config.mjs');
  const handoffUseReferences = handoff.config.useVariables ?? false;
  const handoffWebsocketPort = handoff.config.app.ports?.websocket ?? 3001;
  const nextConfigContent = (await fs.readFile(nextConfigPath, 'utf-8'))
    .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
    .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
    .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
    .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
    .replace(/HANDOFF_WEBSOCKET_PORT:\s+\'\'/g, `HANDOFF_WEBSOCKET_PORT: '${handoffWebsocketPort}'`)
    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
  await fs.writeFile(nextConfigPath, nextConfigContent);

  return appPath;
};

const persistRuntimeCache = (handoff: Handoff) => {
  const destination = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'runtime.cache.json');
  fs.writeFileSync(destination, JSON.stringify({ config: getClientConfig(handoff), ...handoff.integrationObject }, null, 2), 'utf-8');
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

  // Build components
  await buildComponents(handoff);

  // Prepare app
  const appPath = await prepareProjectApp(handoff);

  persistRuntimeCache(handoff);

  // Build app
  const buildResult = spawn.sync('npx', ['next', 'build'], {
    cwd: appPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  if (buildResult.status !== 0) {
    let errorMsg = `Next.js build failed with exit code ${buildResult.status}`;
    if (buildResult.error) {
      errorMsg += `\nSpawn error: ${buildResult.error.message}`;
    }
    throw new Error(errorMsg);
  }

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
  const tokensJsonFilePath = handoff.getTokensFilePath();

  if (!fs.existsSync(tokensJsonFilePath)) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  // Initial processing of the components
  await processComponents(handoff);

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
  const port = handoff.config.app.ports?.app ?? 3000;
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

  const wss = await createWebSocketServer(handoff.config.app.ports?.websocket ?? 3001);

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

  const entryTypeToSegment = (type: keyof ComponentListObject['entries']): ComponentSegment | undefined => {
    return {
      js: ComponentSegment.JavaScript,
      scss: ComponentSegment.Style,
      templates: ComponentSegment.Previews,
    }[type];
  };

  const watchRuntimeComponents = (runtimeComponentPathsToWatch: Map<string, keyof ComponentListObject['entries']>) => {
    persistRuntimeCache(handoff);

    if (runtimeComponentsWatcher) {
      runtimeComponentsWatcher.close();
    }

    if (runtimeComponentPathsToWatch.size > 0) {
      const pathsToWatch = Array.from(runtimeComponentPathsToWatch.keys());
      runtimeComponentsWatcher = chokidar.watch(pathsToWatch, { ignoreInitial: true });
      runtimeComponentsWatcher.on('all', async (event, file) => {
        if (handoff.getConfigFilePaths().includes(file)) {
          return;
        }

        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!debounce) {
              debounce = true;
              let segmentToUpdate: ComponentSegment = undefined;
              const matchingPath = runtimeComponentPathsToWatch.get(file);

              if (matchingPath) {
                const entryType = runtimeComponentPathsToWatch.get(matchingPath);
                segmentToUpdate = entryTypeToSegment(entryType);
              }

              const componentDir = path.basename(path.dirname(path.dirname(file)));
              await processComponents(handoff, componentDir, segmentToUpdate);
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

    if (handoff.getConfigFilePaths().length > 0) {
      runtimeConfigurationWatcher = chokidar.watch(handoff.getConfigFilePaths(), { ignoreInitial: true });
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
              await processComponents(handoff, path.basename(file));
              debounce = false;
            }
            break;
        }
      });
    }
  };

  const getRuntimeComponentsPathsToWatch = () => {
    const result: Map<string, keyof ComponentListObject['entries']> = new Map();

    for (const runtimeComponentId of Object.keys(handoff.integrationObject?.entries.components ?? {})) {
      for (const runtimeComponentVersion of Object.keys(handoff.integrationObject.entries.components[runtimeComponentId])) {
        const runtimeComponent = handoff.integrationObject.entries.components[runtimeComponentId][runtimeComponentVersion];
        for (const [runtimeComponentEntryType, runtimeComponentEntryPath] of Object.entries(runtimeComponent.entries ?? {})) {
          const normalizedComponentEntryPath = runtimeComponentEntryPath as string;
          if (fs.existsSync(normalizedComponentEntryPath)) {
            const entryType = runtimeComponentEntryType as keyof ComponentListObject['entries'];
            if (fs.statSync(normalizedComponentEntryPath).isFile()) {
              result.set(path.dirname(normalizedComponentEntryPath), entryType);
            } else {
              result.set(normalizedComponentEntryPath, entryType);
            }
          }
        }
      }
    }

    return result;
  };

  /*
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
    */

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
              await handoff.getSharedStyles();
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
            publishMDX(handoff);
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

  // Prepare app
  const appPath = await prepareProjectApp(handoff);

  // Purge app cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }

  persistRuntimeCache(handoff);

  // Run
  const devResult = spawn.sync('npx', ['next', 'dev', '--port', String(handoff.config.app.ports?.app ?? 3000)], {
    cwd: appPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  if (devResult.status !== 0) {
    let errorMsg = `Next.js dev failed with exit code ${devResult.status}`;
    if (devResult.error) {
      errorMsg += `\nSpawn error: ${devResult.error.message}`;
    }
    throw new Error(errorMsg);
  }
};

export default buildApp;
