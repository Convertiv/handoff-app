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
exports.CoreTypes = exports.CoreTransformerUtils = exports.CoreTransformers = exports.initRuntimeConfig = void 0;
require("dotenv/config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const handoff_core_1 = require("handoff-core");
const path_1 = __importDefault(require("path"));
const app_1 = __importStar(require("./app"));
const eject_1 = require("./cli/eject");
const make_1 = require("./cli/make");
const config_1 = require("./config");
const pipeline_1 = __importStar(require("./pipeline"));
const component_1 = require("./transformers/preview/component");
const builder_1 = __importStar(require("./transformers/preview/component/builder"));
const logger_1 = require("./utils/logger");
const path_2 = require("./utils/path");
class Handoff {
    constructor(debug, force, config) {
        this.debug = false;
        this.force = false;
        this.modulePath = path_1.default.resolve(__filename, '../..');
        this.workingPath = process.cwd();
        this.exportsDirectory = 'exported';
        this.sitesDirectory = 'out';
        this._initialArgs = {};
        this._configFilePaths = [];
        this._initialArgs = { debug, force, config };
        this.construct(debug, force, config);
    }
    construct(debug, force, config) {
        this.config = null;
        this.debug = debug !== null && debug !== void 0 ? debug : false;
        this.force = force !== null && force !== void 0 ? force : false;
        logger_1.Logger.init({ debug: this.debug });
        this.init(config);
        global.handoff = this;
    }
    init(configOverride) {
        var _a, _b;
        const config = initConfig(configOverride !== null && configOverride !== void 0 ? configOverride : {});
        this.config = config;
        this.exportsDirectory = (_a = config.exportsOutputDirectory) !== null && _a !== void 0 ? _a : this.exportsDirectory;
        this.sitesDirectory = (_b = config.sitesOutputDirectory) !== null && _b !== void 0 ? _b : this.exportsDirectory;
        [this.runtimeConfig, this._configFilePaths] = (0, exports.initRuntimeConfig)(this);
        return this;
    }
    reload() {
        this.construct(this._initialArgs.debug, this._initialArgs.force, this._initialArgs.config);
        return this;
    }
    preRunner(validate) {
        if (!this.config) {
            throw Error('Handoff not initialized');
        }
        if (validate) {
            this.config = validateConfig(this.config);
        }
        return this;
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, pipeline_1.default)(this);
            return this;
        });
    }
    component(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            if (name) {
                name = name.replace('.hbs', '');
                yield (0, builder_1.default)(this, name);
            }
            else {
                yield (0, pipeline_1.buildComponents)(this);
            }
            return this;
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, app_1.default)(this);
            return this;
        });
    }
    ejectConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, eject_1.ejectConfig)(this);
            return this;
        });
    }
    ejectPages() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, eject_1.ejectPages)(this);
            return this;
        });
    }
    ejectTheme() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, eject_1.ejectTheme)(this);
            return this;
        });
    }
    makeTemplate(component, state) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, make_1.makeTemplate)(this, component, state);
            return this;
        });
    }
    makePage(name, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, make_1.makePage)(this, name, parent);
            return this;
        });
    }
    makeComponent(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, make_1.makeComponent)(this, name);
            return this;
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, app_1.watchApp)(this);
            return this;
        });
    }
    dev() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, app_1.devApp)(this);
            return this;
        });
    }
    validateComponents(skipBuild) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            if (!skipBuild) {
                yield (0, builder_1.default)(this, undefined, builder_1.ComponentSegment.Validation);
            }
            return this;
        });
    }
    /**
     * Retrieves the documentation object, using cached version if available
     * @returns {Promise<CoreTypes.IDocumentationObject | undefined>} The documentation object or undefined if not found
     */
    getDocumentationObject() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._documentationObjectCache) {
                return this._documentationObjectCache;
            }
            const documentationObject = yield this.readJsonFile(this.getTokensFilePath());
            this._documentationObjectCache = documentationObject;
            return documentationObject;
        });
    }
    /**
     * Retrieves shared styles, using cached version if available
     * @returns {Promise<string | null>} The shared styles string or null if not found
     */
    getSharedStyles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._sharedStylesCache !== undefined) {
                return this._sharedStylesCache;
            }
            const sharedStyles = yield (0, component_1.processSharedStyles)(this);
            this._sharedStylesCache = sharedStyles;
            return sharedStyles;
        });
    }
    getRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!!this._handoffRunner) {
                return this._handoffRunner;
            }
            const apiCredentials = {
                projectId: this.config.figma_project_id,
                accessToken: this.config.dev_access_token,
            };
            // Initialize the provider
            const provider = handoff_core_1.Providers.RestApiProvider(apiCredentials);
            this._handoffRunner = (0, handoff_core_1.Handoff)(provider, {
                options: {
                    transformer: this.runtimeConfig.options,
                },
            }, {
                log: (msg) => {
                    logger_1.Logger.log(msg);
                },
                err: (msg) => {
                    logger_1.Logger.error(msg);
                },
                warn: (msg) => {
                    logger_1.Logger.warn(msg);
                },
                success: (msg) => {
                    logger_1.Logger.success(msg);
                },
            });
            return this._handoffRunner;
        });
    }
    /**
     * Gets the project ID, falling back to filesystem-safe working path if figma_project_id is missing
     * @returns {string} The project ID to use for path construction
     */
    getProjectId() {
        var _a;
        if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.figma_project_id) {
            return this.config.figma_project_id;
        }
        // Fallback to filesystem-safe transformation of working path
        return (0, path_2.generateFilesystemSafeId)(this.workingPath);
    }
    /**
     * Gets the output path for the current project
     * @returns {string} The absolute path to the output directory
     */
    getOutputPath() {
        return path_1.default.resolve(this.workingPath, this.exportsDirectory, this.getProjectId());
    }
    /**
     * Gets the path to the tokens.json file
     * @returns {string} The absolute path to the tokens.json file
     */
    getTokensFilePath() {
        return path_1.default.join(this.getOutputPath(), 'tokens.json');
    }
    /**
     * Gets the path to the preview.json file
     * @returns {string} The absolute path to the preview.json file
     */
    getPreviewFilePath() {
        return path_1.default.join(this.getOutputPath(), 'preview.json');
    }
    /**
     * Gets the path to the tokens directory
     * @returns {string} The absolute path to the tokens directory
     */
    getVariablesFilePath() {
        return path_1.default.join(this.getOutputPath(), 'tokens');
    }
    /**
     * Gets the path to the icons.zip file
     * @returns {string} The absolute path to the icons.zip file
     */
    getIconsZipFilePath() {
        return path_1.default.join(this.getOutputPath(), 'icons.zip');
    }
    /**
     * Gets the path to the logos.zip file
     * @returns {string} The absolute path to the logos.zip file
     */
    getLogosZipFilePath() {
        return path_1.default.join(this.getOutputPath(), 'logos.zip');
    }
    /**
     * Gets the list of config file paths
     * @returns {string[]} Array of absolute paths to config files
     */
    getConfigFilePaths() {
        return this._configFilePaths;
    }
    /**
     * Clears all cached data
     * @returns {void}
     */
    clearCaches() {
        this._documentationObjectCache = undefined;
        this._sharedStylesCache = undefined;
    }
    /**
     * Reads and parses a JSON file
     * @param {string} path - Path to the JSON file
     * @returns {Promise<any>} The parsed JSON content or undefined if file cannot be read
     */
    readJsonFile(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield fs_extra_1.default.readJSON(path);
            }
            catch (e) {
                return undefined;
            }
        });
    }
}
const initConfig = (configOverride) => {
    let config = {};
    const possibleConfigFiles = ['handoff.config.json', 'handoff.config.js', 'handoff.config.cjs'];
    // Find the first existing config file
    const configFile = possibleConfigFiles.find((file) => fs_extra_1.default.existsSync(path_1.default.resolve(process.cwd(), file)));
    if (configFile) {
        const configPath = path_1.default.resolve(process.cwd(), configFile);
        if (configFile.endsWith('.json')) {
            const defBuffer = fs_extra_1.default.readFileSync(configPath);
            config = JSON.parse(defBuffer.toString());
        }
        else if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
            // Invalidate require cache to ensure fresh read
            delete require.cache[require.resolve(configPath)];
            const importedConfig = require(configPath);
            config = importedConfig.default || importedConfig;
        }
    }
    // Apply overrides if provided
    if (configOverride) {
        Object.keys(configOverride).forEach((key) => {
            const value = configOverride[key];
            if (value !== undefined) {
                config[key] = value;
            }
        });
    }
    const returnConfig = Object.assign(Object.assign({}, (0, config_1.defaultConfig)()), config);
    return returnConfig;
};
const initRuntimeConfig = (handoff) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var _j;
    const configFiles = [];
    const result = {
        options: {},
        entries: {
            scss: undefined,
            js: undefined,
            components: {},
        },
    };
    if (!!((_a = handoff.config.entries) === null || _a === void 0 ? void 0 : _a.scss)) {
        result.entries.scss = path_1.default.resolve(handoff.workingPath, (_b = handoff.config.entries) === null || _b === void 0 ? void 0 : _b.scss);
    }
    if (!!((_c = handoff.config.entries) === null || _c === void 0 ? void 0 : _c.js)) {
        result.entries.js = path_1.default.resolve(handoff.workingPath, (_d = handoff.config.entries) === null || _d === void 0 ? void 0 : _d.js);
    }
    if ((_f = (_e = handoff.config.entries) === null || _e === void 0 ? void 0 : _e.components) === null || _f === void 0 ? void 0 : _f.length) {
        const componentPaths = handoff.config.entries.components.flatMap(getComponentsForPath);
        for (const componentPath of componentPaths) {
            const resolvedComponentPath = path_1.default.resolve(handoff.workingPath, componentPath);
            const componentBaseName = path_1.default.basename(resolvedComponentPath);
            const possibleConfigFiles = [`${componentBaseName}.json`, `${componentBaseName}.js`, `${componentBaseName}.cjs`];
            const configFileName = possibleConfigFiles.find((file) => fs_extra_1.default.existsSync(path_1.default.resolve(resolvedComponentPath, file)));
            if (!configFileName) {
                logger_1.Logger.warn(`Missing config: ${path_1.default.resolve(resolvedComponentPath, possibleConfigFiles.join(' or '))}`);
                continue;
            }
            const resolvedComponentConfigPath = path_1.default.resolve(resolvedComponentPath, configFileName);
            configFiles.push(resolvedComponentConfigPath);
            let component;
            try {
                if (configFileName.endsWith('.json')) {
                    const componentJson = fs_extra_1.default.readFileSync(resolvedComponentConfigPath, 'utf8');
                    component = JSON.parse(componentJson);
                }
                else {
                    // Invalidate require cache to ensure fresh read
                    delete require.cache[require.resolve(resolvedComponentConfigPath)];
                    const importedComponent = require(resolvedComponentConfigPath);
                    component = importedComponent.default || importedComponent;
                }
            }
            catch (err) {
                logger_1.Logger.error(`Failed to read or parse config: ${resolvedComponentConfigPath}`, err);
                continue;
            }
            // Use component basename as the id
            component.id = componentBaseName;
            // Resolve entry paths relative to component directory
            if (component.entries) {
                for (const entryType in component.entries) {
                    if (component.entries[entryType]) {
                        component.entries[entryType] = path_1.default.resolve(resolvedComponentPath, component.entries[entryType]);
                    }
                }
            }
            // Initialize options with safe defaults
            component.options || (component.options = {
                transformer: { defaults: {}, replace: {} },
            });
            (_j = component.options).transformer || (_j.transformer = { defaults: {}, replace: {} });
            const transformer = component.options.transformer;
            (_g = transformer.cssRootClass) !== null && _g !== void 0 ? _g : (transformer.cssRootClass = null);
            (_h = transformer.tokenNameSegments) !== null && _h !== void 0 ? _h : (transformer.tokenNameSegments = null);
            // Normalize keys and values to lowercase
            transformer.defaults = toLowerCaseKeysAndValues(Object.assign({}, transformer.defaults));
            transformer.replace = toLowerCaseKeysAndValues(Object.assign({}, transformer.replace));
            // Save transformer config
            result.options[component.id] = transformer;
            // Save full component entry
            result.entries.components[component.id] = component;
        }
    }
    return [result, Array.from(configFiles)];
};
exports.initRuntimeConfig = initRuntimeConfig;
/**
 * Returns a list of component directories for a given path.
 *
 * This function determines whether the provided `searchPath` is:
 * 1. A single component directory (contains a config file named after the directory)
 * 2. A collection of component directories (subdirectories are components)
 *
 * A directory is considered a component if it contains a config file matching
 * `{dirname}.json`, `{dirname}.js`, or `{dirname}.cjs`.
 *
 * @param searchPath - The absolute path to check for components.
 * @returns An array of string paths to component directories.
 */
const getComponentsForPath = (searchPath) => {
    const dirName = path_1.default.basename(searchPath);
    const possibleConfigFiles = [`${dirName}.json`, `${dirName}.js`, `${dirName}.cjs`];
    // Check if searchPath itself is a component directory (has a config file named after the directory)
    const hasOwnConfig = possibleConfigFiles.some((file) => fs_extra_1.default.existsSync(path_1.default.resolve(searchPath, file)));
    if (hasOwnConfig) {
        // This directory is a single component
        return [searchPath];
    }
    // Otherwise, treat each subdirectory as a potential component
    const subdirectories = fs_extra_1.default
        .readdirSync(searchPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    if (subdirectories.length > 0) {
        // Return full paths to each subdirectory as potential component directories
        return subdirectories.map((subdir) => path_1.default.join(searchPath, subdir));
    }
    // Fallback: no config file and no subdirectories, return the path anyway
    // (will fail gracefully with "missing config" warning later)
    return [searchPath];
};
const validateConfig = (config) => {
    // TODO: Check to see if the exported folder exists before we run start
    if (!config.figma_project_id && !process.env.HANDOFF_FIGMA_PROJECT_ID) {
        // check to see if we can get this from the env
        logger_1.Logger.error('Figma Project ID missing. Please set HANDOFF_FIGMA_PROJECT_ID or run "handoff-app fetch".');
        throw new Error('Cannot initialize configuration');
    }
    if (!config.dev_access_token && !process.env.HANDOFF_DEV_ACCESS_TOKEN) {
        // check to see if we can get this from the env
        logger_1.Logger.error('Figma Access Token missing. Please set HANDOFF_DEV_ACCESS_TOKEN or run "handoff-app fetch".');
        throw new Error('Cannot initialize configuration');
    }
    return config;
};
const toLowerCaseKeysAndValues = (obj) => {
    const loweredObj = {};
    for (const key in obj) {
        const lowerKey = key.toLowerCase();
        const value = obj[key];
        if (typeof value === 'string') {
            loweredObj[lowerKey] = value.toLowerCase();
        }
        else if (typeof value === 'object' && value !== null) {
            loweredObj[lowerKey] = toLowerCaseKeysAndValues(value);
        }
        else {
            loweredObj[lowerKey] = value; // For non-string values
        }
    }
    return loweredObj;
};
// Export transformers and types from handoff-core
var handoff_core_2 = require("handoff-core");
Object.defineProperty(exports, "CoreTransformers", { enumerable: true, get: function () { return handoff_core_2.Transformers; } });
Object.defineProperty(exports, "CoreTransformerUtils", { enumerable: true, get: function () { return handoff_core_2.TransformerUtils; } });
Object.defineProperty(exports, "CoreTypes", { enumerable: true, get: function () { return handoff_core_2.Types; } });
exports.default = Handoff;
