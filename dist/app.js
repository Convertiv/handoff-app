"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.devApp = exports.watchApp = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const next_build_1 = require("next/dist/cli/next-build");
const next_dev_1 = require("next/dist/cli/next-dev");
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const pipeline_1 = require("./pipeline");
const component_1 = require("./transformers/preview/component");
const builder_1 = __importDefault(require("./transformers/preview/component/builder"));
const preview_1 = require("./utils/preview");
const getWorkingPublicPath = (handoff) => {
    const paths = [
        path_1.default.resolve(handoff.workingPath, `public-${handoff.config.figma_project_id}`),
        path_1.default.resolve(handoff.workingPath, `public`),
    ];
    for (const path of paths) {
        if (fs_extra_1.default.existsSync(path)) {
            return path;
        }
    }
    return null;
};
const getAppPath = (handoff) => {
    return path_1.default.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`);
};
/**
 * Copy the public dir from the working dir to the module dir
 * @param handoff
 */
const mergePublicDir = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const appPath = getAppPath(handoff);
    const workingPublicPath = getWorkingPublicPath(handoff);
    if (workingPublicPath) {
        fs_extra_1.default.copySync(workingPublicPath, path_1.default.resolve(appPath, 'public'), { overwrite: true });
    }
});
/**
 * Copy the mdx files from the working dir to the module dir
 * @param handoff
 */
const mergeMDX = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(chalk_1.default.yellow('Merging MDX files...'));
    const appPath = getAppPath(handoff);
    const pages = path_1.default.resolve(handoff.workingPath, `pages`);
    if (fs_extra_1.default.existsSync(pages)) {
        // Find all mdx files in path
        const files = fs_extra_1.default.readdirSync(pages);
        for (const file of files) {
            if (file.endsWith('.mdx')) {
                // transform the file
                transformMdx(path_1.default.resolve(pages, file), path_1.default.resolve(appPath, 'pages', file), file.replace('.mdx', ''));
            }
            else if (fs_extra_1.default.lstatSync(path_1.default.resolve(pages, file)).isDirectory()) {
                // Recursion - find all mdx files in sub directories
                const subFiles = fs_extra_1.default.readdirSync(path_1.default.resolve(pages, file));
                for (const subFile of subFiles) {
                    if (subFile.endsWith('.mdx')) {
                        // transform the file
                        const target = path_1.default.resolve(appPath, 'pages', file);
                        if (!fs_extra_1.default.existsSync(target)) {
                            fs_extra_1.default.mkdirSync(target, { recursive: true });
                        }
                        transformMdx(path_1.default.resolve(pages, file, subFile), path_1.default.resolve(appPath, 'pages', file, subFile), file);
                    }
                    else if (fs_extra_1.default.lstatSync(path_1.default.resolve(pages, file, subFile)).isDirectory()) {
                        const thirdFiles = fs_extra_1.default.readdirSync(path_1.default.resolve(pages, file, subFile));
                        for (const thirdFile of thirdFiles) {
                            if (thirdFile.endsWith('.mdx')) {
                                const target = path_1.default.resolve(appPath, 'pages', file, subFile);
                                if (!fs_extra_1.default.existsSync(target)) {
                                    fs_extra_1.default.mkdirSync(target, { recursive: true });
                                }
                                transformMdx(path_1.default.resolve(pages, file, subFile, thirdFile), path_1.default.resolve(appPath, 'pages', file, subFile, thirdFile), file);
                            }
                        }
                    }
                }
            }
        }
    }
});
/**
 * Remove the frontmatter from the mdx file, convert it to an import, and
 * add the metadata to the export.  Then write the file to the destination.
 * @param src
 * @param dest
 * @param id
 */
const transformMdx = (src, dest, id) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const content = fs_extra_1.default.readFileSync(src);
    const { data, content: body } = (0, gray_matter_1.default)(content);
    let mdx = body;
    const title = (_a = data.title) !== null && _a !== void 0 ? _a : '';
    const menu = (_b = data.menu) !== null && _b !== void 0 ? _b : '';
    const description = data.description ? data.description.replace(/(\r\n|\n|\r)/gm, '') : '';
    const metaDescription = (_c = data.metaDescription) !== null && _c !== void 0 ? _c : '';
    const metaTitle = (_d = data.metaTitle) !== null && _d !== void 0 ? _d : '';
    const weight = (_e = data.weight) !== null && _e !== void 0 ? _e : 0;
    const image = (_f = data.image) !== null && _f !== void 0 ? _f : '';
    const menuTitle = (_g = data.menuTitle) !== null && _g !== void 0 ? _g : '';
    const enabled = (_h = data.enabled) !== null && _h !== void 0 ? _h : true;
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
    fs_extra_1.default.writeFileSync(dest, mdx, 'utf-8');
};
const performCleanup = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const appPath = getAppPath(handoff);
    // Clean project app dir
    if (fs_extra_1.default.existsSync(appPath)) {
        yield fs_extra_1.default.rm(appPath, { recursive: true });
    }
});
const prepareProjectApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const srcPath = path_1.default.resolve(handoff.modulePath, 'src', 'app');
    const appPath = getAppPath(handoff);
    // Prepare project app dir
    yield fs_extra_1.default.promises.mkdir(appPath, { recursive: true });
    yield fs_extra_1.default.copy(srcPath, appPath, { overwrite: true });
    yield mergePublicDir(handoff);
    yield mergeMDX(handoff);
    // Prepare project app configuration
    const handoffProjectId = (_a = handoff.config.figma_project_id) !== null && _a !== void 0 ? _a : '';
    const handoffAppBasePath = (_b = handoff.config.app.base_path) !== null && _b !== void 0 ? _b : '';
    const handoffWorkingPath = path_1.default.resolve(handoff.workingPath);
    const handoffIntegrationPath = path_1.default.resolve(handoff.workingPath, (_c = handoff.config.integrationPath) !== null && _c !== void 0 ? _c : 'integration');
    const handoffModulePath = path_1.default.resolve(handoff.modulePath);
    const handoffExportPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
    const nextConfigPath = path_1.default.resolve(appPath, 'next.config.mjs');
    const handoffUseReferences = (_d = handoff.config.useVariables) !== null && _d !== void 0 ? _d : false;
    const nextConfigContent = (yield fs_extra_1.default.readFile(nextConfigPath, 'utf-8'))
        .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
        .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
        .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
        .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
        .replace(/HANDOFF_INTEGRATION_PATH:\s+\'\'/g, `HANDOFF_INTEGRATION_PATH: '${handoffIntegrationPath}'`)
        .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
        .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
        .replace(/HANDOFF_USE_REFERENCES:\s+\'\'/g, `HANDOFF_USE_REFERENCES: '${handoffUseReferences}'`)
        .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
    yield fs_extra_1.default.writeFile(nextConfigPath, nextConfigContent);
    return appPath;
});
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
        throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
    }
    // Perform cleanup
    yield performCleanup(handoff);
    // If we are building the app, ensure the integration is built first
    yield (0, pipeline_1.buildIntegrationOnly)(handoff);
    yield (0, pipeline_1.buildComponents)(handoff);
    // Build client preview styles
    yield (0, preview_1.buildClientFiles)(handoff)
        .then((value) => !!value && console.log(chalk_1.default.green(value)))
        .catch((error) => {
        throw new Error(error);
    });
    // Prepare app
    const appPath = yield prepareProjectApp(handoff);
    // Build app
    yield (0, next_build_1.nextBuild)({
        lint: true,
        mangling: true,
        experimentalDebugMemoryUsage: false,
        experimentalAppOnly: false,
        experimentalTurbo: false,
        experimentalBuildMode: 'default',
    }, appPath);
    // Ensure output root directory exists
    const outputRoot = path_1.default.resolve(handoff.workingPath, handoff.sitesDirectory);
    if (!fs_extra_1.default.existsSync(outputRoot)) {
        fs_extra_1.default.mkdirSync(outputRoot, { recursive: true });
    }
    // Clean the project output directory (if exists)
    const output = path_1.default.resolve(outputRoot, handoff.config.figma_project_id);
    if (fs_extra_1.default.existsSync(output)) {
        fs_extra_1.default.removeSync(output);
    }
    // Copy the build files into the project output directory
    fs_extra_1.default.copySync(path_1.default.resolve(appPath, 'out'), output);
});
/**
 * Watch the next js application
 * @param handoff
 */
const watchApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h;
    const tokensJsonFilePath = (0, pipeline_1.tokensFilePath)(handoff);
    if (!fs_extra_1.default.existsSync(tokensJsonFilePath)) {
        throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
    }
    const documentationObject = yield (0, pipeline_1.readPrevJSONFile)(tokensJsonFilePath);
    const sharedStyles = yield (0, component_1.processSharedStyles)(handoff);
    // Build client preview styles
    yield (0, preview_1.buildClientFiles)(handoff)
        .then((value) => !!value && console.log(chalk_1.default.green(value)))
        .catch((error) => {
        throw new Error(error);
    });
    // Initial processing of the components
    yield (0, builder_1.default)(handoff, undefined, sharedStyles, documentationObject.components);
    const appPath = yield prepareProjectApp(handoff);
    // Include any changes made within the app source during watch
    chokidar_1.default
        .watch(path_1.default.resolve(handoff.modulePath, 'src', 'app'), {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
    })
        .on('all', (event, path) => __awaiter(void 0, void 0, void 0, function* () {
        switch (event) {
            case 'add':
            case 'change':
            case 'unlink':
                yield prepareProjectApp(handoff);
                break;
        }
    }));
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
    const app = (0, next_1.default)({
        dev,
        dir: appPath,
        hostname,
        port,
        // conf: config,
    });
    const handle = app.getRequestHandler();
    // purge out cache
    const moduleOutput = path_1.default.resolve(appPath, 'out');
    if (fs_extra_1.default.existsSync(moduleOutput)) {
        fs_extra_1.default.removeSync(moduleOutput);
    }
    app.prepare().then(() => {
        (0, http_1.createServer)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Be sure to pass `true` as the second argument to `url.parse`.
                // This tells it to parse the query portion of the URL.
                if (!req.url)
                    throw new Error('No url');
                const parsedUrl = (0, url_1.parse)(req.url, true);
                const { pathname, query } = parsedUrl;
                yield handle(req, res, parsedUrl);
            }
            catch (err) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        }))
            .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
            .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
    });
    const wss = yield (0, component_1.createWebSocketServer)(3001);
    const chokidarConfig = {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
    };
    let debounce = false;
    if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'exportables'))) {
        chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'exportables'), chokidarConfig).on('all', (event, path) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (path.includes('json') && !debounce) {
                        console.log(chalk_1.default.yellow('Exportables changed. Handoff will fetch new tokens...'));
                        debounce = true;
                        yield handoff.fetch();
                        debounce = false;
                    }
                    break;
            }
        }));
    }
    if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'public'))) {
        chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'public'), chokidarConfig).on('all', (event, path) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (!debounce) {
                        debounce = true;
                        console.log(chalk_1.default.yellow('Public directory changed. Handoff will ingest the new data...'));
                        yield mergePublicDir(handoff);
                        wss(JSON.stringify({ type: 'reload' }));
                        debounce = false;
                    }
                    break;
            }
        }));
    }
    let runtimeComponentsWatcher = null;
    let runtimeConfigurationWatcher = null;
    const persistRuntimeCache = () => {
        const destination = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'runtime.cache.json');
        fs_extra_1.default.writeFileSync(destination, JSON.stringify(handoff.integrationObject, null, 2), 'utf-8');
    };
    const watchRuntimeComponents = (runtimeComponentPathsToWatch) => {
        persistRuntimeCache();
        if (runtimeComponentsWatcher) {
            runtimeComponentsWatcher.close();
        }
        if (runtimeComponentPathsToWatch.size > 0) {
            runtimeComponentsWatcher = chokidar_1.default.watch(Array.from(runtimeComponentPathsToWatch), { ignoreInitial: true });
            runtimeComponentsWatcher.on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
                if (handoff._configs.includes(file)) {
                    return;
                }
                switch (event) {
                    case 'add':
                    case 'change':
                    case 'unlink':
                        if (!debounce) {
                            debounce = true;
                            file = path_1.default.dirname(path_1.default.dirname(file));
                            const extension = path_1.default.extname(file);
                            const segmentToUpdate = extension === '.scss' ? 'css' : extension === '.js' ? 'js' : extension === '.hbs' ? 'previews' : undefined;
                            yield (0, builder_1.default)(handoff, path_1.default.basename(file), sharedStyles, documentationObject.components, segmentToUpdate);
                            debounce = false;
                        }
                        break;
                }
            }));
        }
    };
    const watchRuntimeConfiguration = () => {
        if (runtimeConfigurationWatcher) {
            runtimeConfigurationWatcher.close();
        }
        if (handoff._configs.length > 0) {
            runtimeConfigurationWatcher = chokidar_1.default.watch(handoff._configs, { ignoreInitial: true });
            runtimeConfigurationWatcher.on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
                switch (event) {
                    case 'add':
                    case 'change':
                    case 'unlink':
                        if (!debounce) {
                            debounce = true;
                            file = path_1.default.dirname(path_1.default.dirname(file));
                            handoff.reload();
                            watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
                            yield (0, builder_1.default)(handoff, path_1.default.basename(file), sharedStyles, documentationObject.components);
                            debounce = false;
                        }
                        break;
                }
            }));
        }
    };
    const getRuntimeComponentsPathsToWatch = () => {
        var _a, _b, _c;
        const result = new Set();
        for (const runtimeComponentId of Object.keys((_b = (_a = handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries.components) !== null && _b !== void 0 ? _b : {})) {
            for (const runtimeComponentVersion of Object.keys(handoff.integrationObject.entries.components[runtimeComponentId])) {
                const runtimeComponent = handoff.integrationObject.entries.components[runtimeComponentId][runtimeComponentVersion];
                for (const [_, runtimeComponentEntryPath] of Object.entries((_c = runtimeComponent.entries) !== null && _c !== void 0 ? _c : {})) {
                    const normalizedComponentEntryPath = runtimeComponentEntryPath;
                    if (fs_extra_1.default.existsSync(normalizedComponentEntryPath)) {
                        if (fs_extra_1.default.statSync(normalizedComponentEntryPath).isFile()) {
                            result.add(path_1.default.dirname(normalizedComponentEntryPath));
                        }
                        else {
                            result.add(normalizedComponentEntryPath);
                        }
                    }
                }
            }
        }
        return result;
    };
    if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'handoff.config.json'))) {
        chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'handoff.config.json'), { ignoreInitial: true }).on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(chalk_1.default.yellow('handoff.config.json changed. Please restart server to see changes...'));
            if (!debounce) {
                debounce = true;
                handoff.reload();
                watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
                watchRuntimeConfiguration();
                yield (0, builder_1.default)(handoff, undefined, sharedStyles, documentationObject.components);
                debounce = false;
            }
        }));
    }
    watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
    watchRuntimeConfiguration();
    if (((_f = (_e = handoff.integrationObject) === null || _e === void 0 ? void 0 : _e.entries) === null || _f === void 0 ? void 0 : _f.integration) && fs_extra_1.default.existsSync((_h = (_g = handoff.integrationObject) === null || _g === void 0 ? void 0 : _g.entries) === null || _h === void 0 ? void 0 : _h.integration)) {
        const stat = yield fs_extra_1.default.stat(handoff.integrationObject.entries.integration);
        chokidar_1.default
            .watch(stat.isDirectory() ? handoff.integrationObject.entries.integration : path_1.default.dirname(handoff.integrationObject.entries.integration), chokidarConfig)
            .on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (!debounce) {
                        debounce = true;
                        yield (0, pipeline_1.buildIntegrationOnly)(handoff);
                        yield (0, component_1.processSharedStyles)(handoff);
                        debounce = false;
                    }
            }
        }));
    }
    if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'pages'))) {
        chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'pages'), chokidarConfig).on('all', (event, path) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (path.endsWith('.mdx')) {
                        mergeMDX(handoff);
                    }
                    console.log(chalk_1.default.yellow(`Doc page ${event}ed. Please reload browser to see changes...`), path);
                    break;
            }
        }));
    }
});
exports.watchApp = watchApp;
/**
 * Watch the next js application
 * @param handoff
 */
const devApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
        throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
    }
    // Build client preview styles
    yield (0, preview_1.buildClientFiles)(handoff)
        .then((value) => !!value && console.log(chalk_1.default.green(value)))
        .catch((error) => {
        throw new Error(error);
    });
    // Prepare app
    const appPath = yield prepareProjectApp(handoff);
    // Purge app cache
    const moduleOutput = path_1.default.resolve(appPath, 'out');
    if (fs_extra_1.default.existsSync(moduleOutput)) {
        fs_extra_1.default.removeSync(moduleOutput);
    }
    // Run
    return yield (0, next_dev_1.nextDev)({ port: 3000 }, 'cli', appPath);
});
exports.devApp = devApp;
exports.default = buildApp;
