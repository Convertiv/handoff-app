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
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const ws_1 = require("ws");
const config_1 = require("./config");
const pipeline_1 = require("./pipeline");
const builder_1 = __importStar(require("./transformers/preview/component/builder"));
/**
 * Creates a WebSocket server that broadcasts messages to connected clients.
 * Designed for development mode to help with hot-reloading.
 *
 * @param port - Optional port number for the WebSocket server; defaults to 3001.
 * @returns A function that accepts a message string and broadcasts it to all connected clients.
 */
const createWebSocketServer = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (port = 3001) {
    const wss = new ws_1.WebSocket.Server({ port });
    // Heartbeat function to mark a connection as alive.
    const heartbeat = function () {
        this.isAlive = true;
    };
    // Setup a new connection
    wss.on('connection', (ws) => {
        const extWs = ws;
        extWs.isAlive = true;
        extWs.send(JSON.stringify({ type: 'WELCOME' }));
        extWs.on('error', (error) => console.error('WebSocket error:', error));
        extWs.on('pong', heartbeat);
    });
    // Periodically ping clients to ensure they are still connected
    const pingInterval = setInterval(() => {
        wss.clients.forEach((client) => {
            const extWs = client;
            if (!extWs.isAlive) {
                console.log(chalk_1.default.yellow('Terminating inactive client'));
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
    console.log(chalk_1.default.green(`WebSocket server started on ws://localhost:${port}`));
    // Return a function to broadcast a message to all connected clients
    return (message) => {
        console.log(chalk_1.default.green(`Broadcasting message to ${wss.clients.size} client(s)`));
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        });
    };
});
/**
 * Gets the working public directory path for a given handoff instance
 * Checks for both project-specific and default public directories
 *
 * @param handoff - The handoff instance containing working path and figma project configuration
 * @returns The resolved path to the public directory if it exists, null otherwise
 */
const getWorkingPublicPath = (handoff) => {
    const paths = [path_1.default.resolve(handoff.workingPath, `public-${handoff.getProjectId()}`), path_1.default.resolve(handoff.workingPath, `public`)];
    for (const path of paths) {
        if (fs_extra_1.default.existsSync(path)) {
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
const getAppPath = (handoff) => {
    return path_1.default.resolve(handoff.modulePath, '.handoff', `${handoff.getProjectId()}`);
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
 * Performs cleanup of the application directory by removing the existing app directory if it exists.
 * This is typically used before rebuilding the application to ensure a clean state.
 *
 * @param handoff - The Handoff instance containing configuration and working paths
 * @returns Promise that resolves when cleanup is complete
 */
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
    // Early return if no tokens
    if (!tokens) {
        // Write empty tokens.json for API consistency
        fs_extra_1.default.writeFileSync(path_1.default.join(apiPath, 'tokens.json'), JSON.stringify({}, null, 2));
        return;
    }
    fs_extra_1.default.writeFileSync(path_1.default.join(apiPath, 'tokens.json'), JSON.stringify(tokens, null, 2));
    if (!fs_extra_1.default.existsSync(path_1.default.join(apiPath, 'tokens'))) {
        fs_extra_1.default.mkdirSync(path_1.default.join(apiPath, 'tokens'), { recursive: true });
    }
    // Only iterate if tokens has properties
    if (tokens && typeof tokens === 'object') {
        for (const type in tokens) {
            if (type === 'timestamp' || !tokens[type] || typeof tokens[type] !== 'object')
                continue;
            for (const group in tokens[type]) {
                if (tokens[type][group]) {
                    fs_extra_1.default.writeFileSync(path_1.default.join(apiPath, 'tokens', `${group}.json`), JSON.stringify(tokens[type][group], null, 2));
                }
            }
        }
    }
});
const prepareProjectApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const srcPath = path_1.default.resolve(handoff.modulePath, 'src', 'app');
    const appPath = getAppPath(handoff);
    // Publish tokens API
    publishTokensApi(handoff);
    // Prepare project app dir
    yield fs_extra_1.default.promises.mkdir(appPath, { recursive: true });
    yield fs_extra_1.default.copy(srcPath, appPath, { overwrite: true });
    yield mergePublicDir(handoff);
    // Prepare project app configuration
    const handoffProjectId = handoff.getProjectId();
    const handoffAppBasePath = (_a = handoff.config.app.base_path) !== null && _a !== void 0 ? _a : '';
    const handoffWorkingPath = path_1.default.resolve(handoff.workingPath);
    const handoffModulePath = path_1.default.resolve(handoff.modulePath);
    const handoffExportPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId());
    const nextConfigPath = path_1.default.resolve(appPath, 'next.config.mjs');
    const handoffUseReferences = (_b = handoff.config.useVariables) !== null && _b !== void 0 ? _b : false;
    const handoffWebsocketPort = (_d = (_c = handoff.config.app.ports) === null || _c === void 0 ? void 0 : _c.websocket) !== null && _d !== void 0 ? _d : 3001;
    const nextConfigContent = (yield fs_extra_1.default.readFile(nextConfigPath, 'utf-8'))
        .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
        .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
        .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
        .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
        .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
        .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
        .replace(/HANDOFF_WEBSOCKET_PORT:\s+\'\'/g, `HANDOFF_WEBSOCKET_PORT: '${handoffWebsocketPort}'`)
        .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
    yield fs_extra_1.default.writeFile(nextConfigPath, nextConfigContent);
    return appPath;
});
const persistRuntimeCache = (handoff) => {
    const appPath = getAppPath(handoff);
    const destination = path_1.default.resolve(appPath, 'runtime.cache.json');
    // Ensure directory exists
    if (!fs_extra_1.default.existsSync(appPath)) {
        fs_extra_1.default.mkdirSync(appPath, { recursive: true });
    }
    fs_extra_1.default.writeFileSync(destination, JSON.stringify(Object.assign({ config: (0, config_1.getClientConfig)(handoff) }, handoff.runtimeConfig), null, 2), 'utf-8');
};
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    // Perform cleanup
    yield performCleanup(handoff);
    // Build components
    yield (0, pipeline_1.buildComponents)(handoff);
    // Prepare app
    const appPath = yield prepareProjectApp(handoff);
    persistRuntimeCache(handoff);
    // Build app
    const buildResult = cross_spawn_1.default.sync('npx', ['next', 'build'], {
        cwd: appPath,
        stdio: 'inherit',
        env: Object.assign(Object.assign({}, process.env), { NODE_ENV: 'production' }),
    });
    if (buildResult.status !== 0) {
        let errorMsg = `Next.js build failed with exit code ${buildResult.status}`;
        if (buildResult.error) {
            errorMsg += `\nSpawn error: ${buildResult.error.message}`;
        }
        throw new Error(errorMsg);
    }
    // Ensure output root directory exists
    const outputRoot = path_1.default.resolve(handoff.workingPath, handoff.sitesDirectory);
    if (!fs_extra_1.default.existsSync(outputRoot)) {
        fs_extra_1.default.mkdirSync(outputRoot, { recursive: true });
    }
    // Clean the project output directory (if exists)
    const output = path_1.default.resolve(outputRoot, handoff.getProjectId());
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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // Initial processing of the components
    yield (0, builder_1.default)(handoff);
    const appPath = yield prepareProjectApp(handoff);
    // Include any changes made within the app source during watch
    chokidar_1.default
        .watch(path_1.default.resolve(handoff.modulePath, 'src', 'app'), {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
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
    const port = (_b = (_a = handoff.config.app.ports) === null || _a === void 0 ? void 0 : _a.app) !== null && _b !== void 0 ? _b : 3000;
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
    const wss = yield createWebSocketServer((_d = (_c = handoff.config.app.ports) === null || _c === void 0 ? void 0 : _c.websocket) !== null && _d !== void 0 ? _d : 3001);
    const chokidarConfig = {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
    };
    let debounce = false;
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
            template: builder_1.ComponentSegment.Previews,
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
                            const entryType = runtimeComponentPathsToWatch.get(file);
                            const segmentToUpdate = entryType ? entryTypeToSegment(entryType) : undefined;
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
        for (const runtimeComponentId of Object.keys((_b = (_a = handoff.runtimeConfig) === null || _a === void 0 ? void 0 : _a.entries.components) !== null && _b !== void 0 ? _b : {})) {
            for (const runtimeComponentVersion of Object.keys(handoff.runtimeConfig.entries.components[runtimeComponentId])) {
                const runtimeComponent = handoff.runtimeConfig.entries.components[runtimeComponentId][runtimeComponentVersion];
                for (const [runtimeComponentEntryType, runtimeComponentEntryPath] of Object.entries((_c = runtimeComponent.entries) !== null && _c !== void 0 ? _c : {})) {
                    const normalizedComponentEntryPath = runtimeComponentEntryPath;
                    if (fs_extra_1.default.existsSync(normalizedComponentEntryPath)) {
                        const entryType = runtimeComponentEntryType;
                        if (fs_extra_1.default.statSync(normalizedComponentEntryPath).isFile()) {
                            result.set(path_1.default.resolve(normalizedComponentEntryPath), entryType);
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
    watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
    watchRuntimeConfiguration();
    if (((_f = (_e = handoff.runtimeConfig) === null || _e === void 0 ? void 0 : _e.entries) === null || _f === void 0 ? void 0 : _f.scss) && fs_extra_1.default.existsSync((_h = (_g = handoff.runtimeConfig) === null || _g === void 0 ? void 0 : _g.entries) === null || _h === void 0 ? void 0 : _h.scss)) {
        const stat = yield fs_extra_1.default.stat(handoff.runtimeConfig.entries.scss);
        chokidar_1.default
            .watch(stat.isDirectory() ? handoff.runtimeConfig.entries.scss : path_1.default.dirname(handoff.runtimeConfig.entries.scss), chokidarConfig)
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
    var _a, _b;
    // Prepare app
    const appPath = yield prepareProjectApp(handoff);
    // Purge app cache
    const moduleOutput = path_1.default.resolve(appPath, 'out');
    if (fs_extra_1.default.existsSync(moduleOutput)) {
        fs_extra_1.default.removeSync(moduleOutput);
    }
    persistRuntimeCache(handoff);
    // Run
    const devResult = cross_spawn_1.default.sync('npx', ['next', 'dev', '--port', String((_b = (_a = handoff.config.app.ports) === null || _a === void 0 ? void 0 : _a.app) !== null && _b !== void 0 ? _b : 3000)], {
        cwd: appPath,
        stdio: 'inherit',
        env: Object.assign(Object.assign({}, process.env), { NODE_ENV: 'development' }),
    });
    if (devResult.status !== 0) {
        let errorMsg = `Next.js dev failed with exit code ${devResult.status}`;
        if (devResult.error) {
            errorMsg += `\nSpawn error: ${devResult.error.message}`;
        }
        throw new Error(errorMsg);
    }
});
exports.devApp = devApp;
exports.default = buildApp;
