"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const config_1 = require("./config");
const pipeline_1 = require("./pipeline");
const component_1 = require("./transformers/preview/component");
const builder_1 = __importStar(require("./transformers/preview/component/builder"));
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
  const config = getClientRuntimeConfig();
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
const publishTokensApi = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const apiPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'public/api'));
    if (!fs_extra_1.default.existsSync(apiPath)) {
        fs_extra_1.default.mkdirSync(apiPath, { recursive: true });
    }
    const tokens = yield handoff.getDocumentationObject();
    fs_extra_1.default.writeFileSync(path_1.default.join(apiPath, 'tokens.json'), JSON.stringify(tokens, null, 2));
    if (!fs_extra_1.default.existsSync(path_1.default.join(apiPath, 'tokens'))) {
        fs_extra_1.default.mkdirSync(path_1.default.join(apiPath, 'tokens'));
    }
    for (const type in tokens) {
        if (type === 'timestamp')
            continue;
        for (const group in tokens[type]) {
            fs_extra_1.default.writeFileSync(path_1.default.join(apiPath, 'tokens', `${group}.json`), JSON.stringify(tokens[type][group], null, 2));
        }
    }
});
const prepareProjectApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const srcPath = path_1.default.resolve(handoff.modulePath, 'src', 'app');
    const appPath = getAppPath(handoff);
    // Publish tokens API
    publishTokensApi(handoff);
    // Prepare project app dir
    yield fs_extra_1.default.promises.mkdir(appPath, { recursive: true });
    yield fs_extra_1.default.copy(srcPath, appPath, { overwrite: true });
    yield mergePublicDir(handoff);
    yield mergeMDX(handoff);
    // Prepare project app configuration
    const handoffProjectId = (_a = handoff.config.figma_project_id) !== null && _a !== void 0 ? _a : '';
    const handoffAppBasePath = (_b = handoff.config.app.base_path) !== null && _b !== void 0 ? _b : '';
    const handoffWorkingPath = path_1.default.resolve(handoff.workingPath);
    const handoffModulePath = path_1.default.resolve(handoff.modulePath);
    const handoffExportPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
    const nextConfigPath = path_1.default.resolve(appPath, 'next.config.mjs');
    const handoffUseReferences = (_c = handoff.config.useVariables) !== null && _c !== void 0 ? _c : false;
    const nextConfigContent = (yield fs_extra_1.default.readFile(nextConfigPath, 'utf-8'))
        .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
        .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
        .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
        .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
        .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
        .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
        .replace(/HANDOFF_USE_REFERENCES:\s+\'\'/g, `HANDOFF_USE_REFERENCES: '${handoffUseReferences}'`)
        .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
    yield fs_extra_1.default.writeFile(nextConfigPath, nextConfigContent);
    return appPath;
});
const persistRuntimeCache = (handoff) => {
    const destination = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'runtime.cache.json');
    fs_extra_1.default.writeFileSync(destination, JSON.stringify(Object.assign({ config: (0, config_1.getClientConfig)(handoff) }, handoff.integrationObject), null, 2), 'utf-8');
};
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
    // Build components
    yield (0, pipeline_1.buildComponents)(handoff);
    // Prepare app
    const appPath = yield prepareProjectApp(handoff);
    persistRuntimeCache(handoff);
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
    var _d, _e, _f, _g;
    const tokensJsonFilePath = handoff.getTokensFilePath();
    if (!fs_extra_1.default.existsSync(tokensJsonFilePath)) {
        throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
    }
    // Initial processing of the components
    yield (0, builder_1.default)(handoff);
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
    const entryTypeToSegment = (type) => {
        return {
            js: builder_1.ComponentSegment.JavaScript,
            scss: builder_1.ComponentSegment.Style,
            templates: builder_1.ComponentSegment.Previews,
        }[type];
    };
    const watchRuntimeComponents = (runtimeComponentPathsToWatch) => {
        persistRuntimeCache(handoff);
        if (runtimeComponentsWatcher) {
            runtimeComponentsWatcher.close();
        }
        if (runtimeComponentPathsToWatch.size > 0) {
            const pathsToWatch = Array.from(runtimeComponentPathsToWatch.keys());
            runtimeComponentsWatcher = chokidar_1.default.watch(pathsToWatch, { ignoreInitial: true });
            runtimeComponentsWatcher.on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
                if (handoff.getConfigFilePaths().includes(file)) {
                    return;
                }
                switch (event) {
                    case 'add':
                    case 'change':
                    case 'unlink':
                        if (!debounce) {
                            debounce = true;
                            let segmentToUpdate = undefined;
                            const matchingPath = runtimeComponentPathsToWatch.get(file);
                            if (matchingPath) {
                                const entryType = runtimeComponentPathsToWatch.get(matchingPath);
                                segmentToUpdate = entryTypeToSegment(entryType);
                            }
                            const componentDir = path_1.default.basename(path_1.default.dirname(path_1.default.dirname(file)));
                            yield (0, builder_1.default)(handoff, componentDir, segmentToUpdate);
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
        if (handoff.getConfigFilePaths().length > 0) {
            runtimeConfigurationWatcher = chokidar_1.default.watch(handoff.getConfigFilePaths(), { ignoreInitial: true });
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
                            yield (0, builder_1.default)(handoff, path_1.default.basename(file));
                            debounce = false;
                        }
                        break;
                }
            }));
        }
    };
    const getRuntimeComponentsPathsToWatch = () => {
        var _a, _b, _c;
        const result = new Map();
        for (const runtimeComponentId of Object.keys((_b = (_a = handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries.components) !== null && _b !== void 0 ? _b : {})) {
            for (const runtimeComponentVersion of Object.keys(handoff.integrationObject.entries.components[runtimeComponentId])) {
                const runtimeComponent = handoff.integrationObject.entries.components[runtimeComponentId][runtimeComponentVersion];
                for (const [runtimeComponentEntryType, runtimeComponentEntryPath] of Object.entries((_c = runtimeComponent.entries) !== null && _c !== void 0 ? _c : {})) {
                    const normalizedComponentEntryPath = runtimeComponentEntryPath;
                    if (fs_extra_1.default.existsSync(normalizedComponentEntryPath)) {
                        const entryType = runtimeComponentEntryType;
                        if (fs_extra_1.default.statSync(normalizedComponentEntryPath).isFile()) {
                            result.set(path_1.default.dirname(normalizedComponentEntryPath), entryType);
                        }
                        else {
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
    if (((_e = (_d = handoff.integrationObject) === null || _d === void 0 ? void 0 : _d.entries) === null || _e === void 0 ? void 0 : _e.integration) && fs_extra_1.default.existsSync((_g = (_f = handoff.integrationObject) === null || _f === void 0 ? void 0 : _f.entries) === null || _g === void 0 ? void 0 : _g.integration)) {
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
                        yield handoff.getSharedStyles();
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
