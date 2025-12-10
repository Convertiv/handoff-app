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
const chokidar_1 = __importDefault(require("chokidar"));
const cross_spawn_1 = __importDefault(require("cross-spawn"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ws_1 = require("ws");
const config_1 = require("./config");
const pipeline_1 = require("./pipeline");
const builder_1 = __importStar(require("./transformers/preview/component/builder"));
const logger_1 = require("./utils/logger");
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
        extWs.on('error', (error) => logger_1.Logger.error('WebSocket error:', error));
        extWs.on('pong', heartbeat);
    });
    // Periodically ping clients to ensure they are still connected
    const pingInterval = setInterval(() => {
        wss.clients.forEach((client) => {
            const extWs = client;
            if (!extWs.isAlive) {
                logger_1.Logger.warn('Terminating inactive client');
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
    logger_1.Logger.success(`WebSocket server listening on ws://localhost:${port}`);
    // Return a function to broadcast a message to all connected clients
    return (message) => {
        logger_1.Logger.success(`Broadcasting message to ${wss.clients.size} client(s)`);
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
    const paths = [
        path_1.default.resolve(handoff.workingPath, `public-${handoff.getProjectId()}`),
        path_1.default.resolve(handoff.workingPath, `public`),
    ];
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
const syncPublicFiles = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const appPath = getAppPath(handoff);
    const workingPublicPath = getWorkingPublicPath(handoff);
    if (workingPublicPath) {
        yield fs_extra_1.default.copy(workingPublicPath, path_1.default.resolve(appPath, 'public'), {
            overwrite: true,
        });
    }
});
/**
 * Performs cleanup of the application directory by removing the existing app directory if it exists.
 * This is typically used before rebuilding the application to ensure a clean state.
 *
 * @param handoff - The Handoff instance containing configuration and working paths
 * @returns Promise that resolves when cleanup is complete
 */
const cleanupAppDirectory = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const appPath = getAppPath(handoff);
    // Clean project app dir
    if (fs_extra_1.default.existsSync(appPath)) {
        yield fs_extra_1.default.remove(appPath);
    }
});
/**
 * Publishes the tokens API files to the public directory.
 *
 * @param handoff - The Handoff instance
 */
const generateTokensApi = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const apiPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'public/api'));
    yield fs_extra_1.default.ensureDir(apiPath);
    const tokens = yield handoff.getDocumentationObject();
    // Early return if no tokens
    if (!tokens) {
        // Write empty tokens.json for API consistency
        yield fs_extra_1.default.writeJson(path_1.default.join(apiPath, 'tokens.json'), {}, { spaces: 2 });
        return;
    }
    yield fs_extra_1.default.writeJson(path_1.default.join(apiPath, 'tokens.json'), tokens, { spaces: 2 });
    const tokensDir = path_1.default.join(apiPath, 'tokens');
    yield fs_extra_1.default.ensureDir(tokensDir);
    // Only iterate if tokens has properties
    if (tokens && typeof tokens === 'object') {
        const promises = [];
        for (const type in tokens) {
            if (type === 'timestamp' ||
                !tokens[type] ||
                typeof tokens[type] !== 'object')
                continue;
            for (const group in tokens[type]) {
                if (tokens[type][group]) {
                    promises.push(fs_extra_1.default.writeJson(path_1.default.join(tokensDir, `${group}.json`), tokens[type][group], { spaces: 2 }));
                }
            }
        }
        yield Promise.all(promises);
    }
});
/**
 * Prepares the project application by copying source files and configuring Next.js.
 *
 * @param handoff - The Handoff instance
 * @returns The path to the prepared application directory
 */
const initializeProjectApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const srcPath = path_1.default.resolve(handoff.modulePath, 'src', 'app');
    const appPath = getAppPath(handoff);
    // Publish tokens API
    yield generateTokensApi(handoff);
    // Prepare project app dir
    yield fs_extra_1.default.ensureDir(appPath);
    yield fs_extra_1.default.copy(srcPath, appPath, { overwrite: true });
    yield syncPublicFiles(handoff);
    // Prepare project app configuration
    // Warning: Regex replacement is fragile and depends on exact formatting in next.config.mjs
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
/**
 * Persists the client config to a JSON file.
 *
 * @param handoff - The Handoff instance
 */
const persistClientConfig = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const appPath = getAppPath(handoff);
    const destination = path_1.default.resolve(appPath, 'client.config.json');
    // Ensure directory exists
    yield fs_extra_1.default.ensureDir(appPath);
    yield fs_extra_1.default.writeJson(destination, { config: (0, config_1.getClientConfig)(handoff) }, { spaces: 2 });
});
/**
 * Watches the working public directory for changes and updates the app.
 *
 * @param handoff - The Handoff instance
 * @param wss - The WebSocket broadcaster
 * @param state - The shared watcher state
 * @param chokidarConfig - Configuration for chokidar
 */
const watchPublicDirectory = (handoff, wss, state, chokidarConfig) => {
    if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'public'))) {
        chokidar_1.default
            .watch(path_1.default.resolve(handoff.workingPath, 'public'), chokidarConfig)
            .on('all', (event, path) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (!state.debounce) {
                        state.debounce = true;
                        try {
                            logger_1.Logger.warn('Public directory changed. Handoff will ingest the new data...');
                            yield syncPublicFiles(handoff);
                            wss(JSON.stringify({ type: 'reload' }));
                        }
                        catch (e) {
                            logger_1.Logger.error('Error syncing public directory:', e);
                        }
                        finally {
                            state.debounce = false;
                        }
                    }
                    break;
            }
        }));
    }
};
/**
 * Watches the application source code for changes.
 *
 * @param handoff - The Handoff instance
 */
const watchAppSource = (handoff) => {
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
                try {
                    yield initializeProjectApp(handoff);
                }
                catch (e) {
                    logger_1.Logger.error('Error initializing project app:', e);
                }
                break;
        }
    }));
};
/**
 * Watches the user's pages directory for changes.
 *
 * @param handoff - The Handoff instance
 * @param chokidarConfig - Configuration for chokidar
 */
const watchPages = (handoff, chokidarConfig) => {
    if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'pages'))) {
        chokidar_1.default
            .watch(path_1.default.resolve(handoff.workingPath, 'pages'), chokidarConfig)
            .on('all', (event, path) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    try {
                        logger_1.Logger.warn(`Doc page ${event}ed. Please reload browser to see changes...`);
                        logger_1.Logger.debug(`Path: ${path}`);
                    }
                    catch (e) {
                        logger_1.Logger.error('Error watching pages:', e);
                    }
                    break;
            }
        }));
    }
};
/**
 * Watches the SCSS entry point for changes.
 *
 * @param handoff - The Handoff instance
 * @param state - The shared watcher state
 * @param chokidarConfig - Configuration for chokidar
 */
const watchScss = (handoff, state, chokidarConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (((_b = (_a = handoff.runtimeConfig) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.scss) &&
        fs_extra_1.default.existsSync((_d = (_c = handoff.runtimeConfig) === null || _c === void 0 ? void 0 : _c.entries) === null || _d === void 0 ? void 0 : _d.scss)) {
        const stat = yield fs_extra_1.default.stat(handoff.runtimeConfig.entries.scss);
        chokidar_1.default
            .watch(stat.isDirectory()
            ? handoff.runtimeConfig.entries.scss
            : path_1.default.dirname(handoff.runtimeConfig.entries.scss), chokidarConfig)
            .on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (!state.debounce) {
                        state.debounce = true;
                        try {
                            yield handoff.getSharedStyles();
                        }
                        catch (e) {
                            logger_1.Logger.error('Error processing shared styles:', e);
                        }
                        finally {
                            state.debounce = false;
                        }
                    }
            }
        }));
    }
});
/**
 * Maps configuration entry types to component segments.
 */
const mapEntryTypeToSegment = (type) => {
    return {
        js: builder_1.ComponentSegment.JavaScript,
        scss: builder_1.ComponentSegment.Style,
        template: builder_1.ComponentSegment.Previews,
        templates: builder_1.ComponentSegment.Previews,
    }[type];
};
/**
 * Gets the paths of runtime components to watch.
 *
 * @param handoff - The Handoff instance
 * @returns A Map of paths to watch and their entry types
 */
const getRuntimeComponentsPathsToWatch = (handoff) => {
    var _a, _b, _c;
    const result = new Map();
    for (const runtimeComponentId of Object.keys((_b = (_a = handoff.runtimeConfig) === null || _a === void 0 ? void 0 : _a.entries.components) !== null && _b !== void 0 ? _b : {})) {
        for (const runtimeComponentVersion of Object.keys(handoff.runtimeConfig.entries.components[runtimeComponentId])) {
            const runtimeComponent = handoff.runtimeConfig.entries.components[runtimeComponentId][runtimeComponentVersion];
            for (const [runtimeComponentEntryType, runtimeComponentEntryPath,] of Object.entries((_c = runtimeComponent.entries) !== null && _c !== void 0 ? _c : {})) {
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
/**
 * Watches runtime components for changes.
 *
 * @param handoff - The Handoff instance
 * @param state - The shared watcher state
 * @param runtimeComponentPathsToWatch - Map of paths to watch
 */
const watchRuntimeComponents = (handoff, state, runtimeComponentPathsToWatch) => {
    if (state.runtimeComponentsWatcher) {
        state.runtimeComponentsWatcher.close();
    }
    if (runtimeComponentPathsToWatch.size > 0) {
        const pathsToWatch = Array.from(runtimeComponentPathsToWatch.keys());
        state.runtimeComponentsWatcher = chokidar_1.default.watch(pathsToWatch, {
            ignoreInitial: true,
        });
        state.runtimeComponentsWatcher.on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
            if (handoff.getConfigFilePaths().includes(file)) {
                return;
            }
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (!state.debounce) {
                        state.debounce = true;
                        try {
                            const entryType = runtimeComponentPathsToWatch.get(file);
                            const segmentToUpdate = entryType
                                ? mapEntryTypeToSegment(entryType)
                                : undefined;
                            const componentDir = path_1.default.basename(path_1.default.dirname(path_1.default.dirname(file)));
                            yield (0, builder_1.default)(handoff, componentDir, segmentToUpdate);
                        }
                        catch (e) {
                            logger_1.Logger.error('Error processing component:', e);
                        }
                        finally {
                            state.debounce = false;
                        }
                    }
                    break;
            }
        }));
    }
};
/**
 * Watches the runtime configuration for changes.
 *
 * @param handoff - The Handoff instance
 * @param state - The shared watcher state
 */
const watchRuntimeConfiguration = (handoff, state) => {
    if (state.runtimeConfigurationWatcher) {
        state.runtimeConfigurationWatcher.close();
    }
    if (handoff.getConfigFilePaths().length > 0) {
        state.runtimeConfigurationWatcher = chokidar_1.default.watch(handoff.getConfigFilePaths(), { ignoreInitial: true });
        state.runtimeConfigurationWatcher.on('all', (event, file) => __awaiter(void 0, void 0, void 0, function* () {
            switch (event) {
                case 'add':
                case 'change':
                case 'unlink':
                    if (!state.debounce) {
                        state.debounce = true;
                        try {
                            file = path_1.default.dirname(path_1.default.dirname(file));
                            // Reload the Handoff instance to pick up configuration changes
                            handoff.reload();
                            // After reloading, persist the updated client configuration
                            yield persistClientConfig(handoff);
                            // Restart the runtime components watcher to track potentially updated/added/removed components
                            watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
                            // Process components based on the updated configuration and file path
                            yield (0, builder_1.default)(handoff, path_1.default.basename(file));
                        }
                        catch (e) {
                            logger_1.Logger.error('Error reloading runtime configuration:', e);
                        }
                        finally {
                            state.debounce = false;
                        }
                    }
                    break;
            }
        }));
    }
};
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    // Perform cleanup
    yield cleanupAppDirectory(handoff);
    // Build components
    yield (0, pipeline_1.buildComponents)(handoff);
    // Prepare app
    const appPath = yield initializeProjectApp(handoff);
    yield persistClientConfig(handoff);
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
    yield fs_extra_1.default.ensureDir(outputRoot);
    // Clean the project output directory (if exists)
    const output = path_1.default.resolve(outputRoot, handoff.getProjectId());
    if (fs_extra_1.default.existsSync(output)) {
        yield fs_extra_1.default.remove(output);
    }
    // Copy the build files into the project output directory
    yield fs_extra_1.default.copy(path_1.default.resolve(appPath, 'out'), output);
});
/**
 * Watch the next js application.
 * Starts a custom dev server with Handoff-specific watchers and hot-reloading.
 *
 * @param handoff
 */
const watchApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // Initial processing of the components with caching enabled
    // This will skip rebuilding components whose source files haven't changed
    yield (0, builder_1.default)(handoff, undefined, undefined, { useCache: true });
    const appPath = yield initializeProjectApp(handoff);
    // Persist client configuration
    yield persistClientConfig(handoff);
    // Watch app source
    watchAppSource(handoff);
    // // does a ts config exist?
    // let tsconfigPath = 'tsconfig.json';
    // config.typescript = {
    //   ...config.typescript,
    //   tsconfigPath,
    // };
    const dev = true;
    const hostname = 'localhost';
    const port = (_b = (_a = handoff.config.app.ports) === null || _a === void 0 ? void 0 : _a.app) !== null && _b !== void 0 ? _b : 3000;
    // purge out cache
    const moduleOutput = path_1.default.resolve(appPath, 'out');
    if (fs_extra_1.default.existsSync(moduleOutput)) {
        yield fs_extra_1.default.remove(moduleOutput);
    }
    const nextProcess = (0, cross_spawn_1.default)('npx', ['next', 'dev', moduleOutput, '--port', String(port)], {
        cwd: appPath,
        stdio: 'inherit',
        env: Object.assign(Object.assign({}, process.env), { NODE_ENV: 'development' }),
    });
    console.log(`Ready on http://${hostname}:${port}`);
    nextProcess.on('error', (error) => {
        console.error(`Next.js dev process error: ${error}`);
        process.exit(1);
    });
    nextProcess.on('close', (code) => {
        console.log(`Next.js dev process closed with code ${code}`);
        process.exit(code);
    });
    const wss = yield createWebSocketServer((_d = (_c = handoff.config.app.ports) === null || _c === void 0 ? void 0 : _c.websocket) !== null && _d !== void 0 ? _d : 3001);
    const chokidarConfig = {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
    };
    const state = {
        debounce: false,
        runtimeComponentsWatcher: null,
        runtimeConfigurationWatcher: null,
    };
    watchPublicDirectory(handoff, wss, state, chokidarConfig);
    watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
    watchRuntimeConfiguration(handoff, state);
    yield watchScss(handoff, state, chokidarConfig);
    watchPages(handoff, chokidarConfig);
});
exports.watchApp = watchApp;
/**
 * Watch the next js application using the standard Next.js dev server.
 * This is useful for debugging the Next.js app itself without the Handoff overlay.
 *
 * @param handoff
 */
const devApp = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Prepare app
    const appPath = yield initializeProjectApp(handoff);
    // Purge app cache
    const moduleOutput = path_1.default.resolve(appPath, 'out');
    if (fs_extra_1.default.existsSync(moduleOutput)) {
        yield fs_extra_1.default.remove(moduleOutput);
    }
    // Persist client configuration
    yield persistClientConfig(handoff);
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
