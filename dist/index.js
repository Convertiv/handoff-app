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
exports.CoreTypes = exports.CoreTransformerUtils = exports.CoreTransformers = exports.initIntegrationObject = void 0;
const chalk_1 = __importDefault(require("chalk"));
require("dotenv/config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const handoff_core_1 = require("handoff-core");
const lodash_1 = require("lodash");
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const app_1 = __importStar(require("./app"));
const eject_1 = require("./cli/eject");
const make_1 = require("./cli/make");
const config_1 = require("./config");
const pipeline_1 = __importStar(require("./pipeline"));
const component_1 = require("./transformers/preview/component");
const builder_1 = __importStar(require("./transformers/preview/component/builder"));
const css_1 = require("./transformers/preview/component/css");
const javascript_1 = require("./transformers/preview/component/javascript");
const utils_1 = require("./utils");
const fs_1 = require("./utils/fs");
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
        this.init(config);
        global.handoff = this;
    }
    init(configOverride) {
        var _a, _b;
        const config = initConfig(configOverride !== null && configOverride !== void 0 ? configOverride : {});
        this.config = config;
        this.exportsDirectory = (_a = config.exportsOutputDirectory) !== null && _a !== void 0 ? _a : this.exportsDirectory;
        this.sitesDirectory = (_b = config.sitesOutputDirectory) !== null && _b !== void 0 ? _b : this.exportsDirectory;
        [this.integrationObject, this._configFilePaths] = (0, exports.initIntegrationObject)(this);
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
    ejectExportables() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, eject_1.ejectExportables)(this);
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
    makeExportable(type, name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, make_1.makeExportable)(this, type, name);
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
    makeIntegrationStyles() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, javascript_1.buildMainJS)(this);
            yield (0, css_1.buildMainCss)(this);
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
    validateComponents() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            yield (0, builder_1.default)(this, undefined, builder_1.ComponentSegment.Validation);
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
            const legacyDefinitions = yield this.getLegacyDefinitions();
            const useLegacyDefintions = !!legacyDefinitions;
            // Initialize the provider
            const provider = useLegacyDefintions
                ? handoff_core_1.Providers.RestApiLegacyDefinitionsProvider(apiCredentials, legacyDefinitions)
                : handoff_core_1.Providers.RestApiProvider(apiCredentials);
            this._handoffRunner = (0, handoff_core_1.Handoff)(provider, {
                options: {
                    transformer: this.integrationObject.options,
                },
            }, {
                log: (msg) => {
                    console.log(msg);
                },
                err: (msg) => {
                    console.log(chalk_1.default.red(msg));
                },
                warn: (msg) => {
                    console.log(chalk_1.default.yellow(msg));
                },
                success: (msg) => {
                    console.log(chalk_1.default.green(msg));
                },
            });
            return this._handoffRunner;
        });
    }
    /**
     * Returns configured legacy component definitions in array form.
     * @deprecated Will be removed before 1.0.0 release.
     */
    getLegacyDefinitions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sourcePath = path_1.default.resolve(this.workingPath, 'exportables');
                if (!fs_extra_1.default.existsSync(sourcePath)) {
                    return null;
                }
                const definitionPaths = (0, fs_1.findFilesByExtension)(sourcePath, '.json');
                const exportables = definitionPaths
                    .map((definitionPath) => {
                    const defBuffer = fs_extra_1.default.readFileSync(definitionPath);
                    const exportable = JSON.parse(defBuffer.toString());
                    const exportableOptions = {};
                    (0, lodash_1.merge)(exportableOptions, exportable.options);
                    exportable.options = exportableOptions;
                    return exportable;
                })
                    .filter(utils_1.filterOutNull);
                return exportables ? exportables : null;
            }
            catch (e) {
                return [];
            }
        });
    }
    /**
     * Gets the output path for the current project
     * @returns {string} The absolute path to the output directory
     */
    getOutputPath() {
        return path_1.default.resolve(this.workingPath, this.exportsDirectory, this.config.figma_project_id);
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
     * Gets the path to the changelog.json file
     * @returns {string} The absolute path to the changelog.json file
     */
    getChangelogFilePath() {
        return path_1.default.join(this.getOutputPath(), 'changelog.json');
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
const initIntegrationObject = (handoff) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var _k;
    const configFiles = [];
    const result = {
        options: {},
        entries: {
            integration: undefined, // scss
            bundle: undefined, // js
            components: {},
        },
    };
    if (!!((_a = handoff.config.entries) === null || _a === void 0 ? void 0 : _a.scss)) {
        result.entries.integration = path_1.default.resolve(handoff.workingPath, (_b = handoff.config.entries) === null || _b === void 0 ? void 0 : _b.scss);
    }
    //console.log('result.entries.integration', handoff.config.entries, path.resolve(handoff.workingPath, handoff.config.entries?.js));
    if (!!((_c = handoff.config.entries) === null || _c === void 0 ? void 0 : _c.js)) {
        result.entries.bundle = path_1.default.resolve(handoff.workingPath, (_d = handoff.config.entries) === null || _d === void 0 ? void 0 : _d.js);
    }
    else {
        console.log(chalk_1.default.red('No js entry found in config'), handoff.debug ? `Path: ${path_1.default.resolve(handoff.workingPath, (_e = handoff.config.entries) === null || _e === void 0 ? void 0 : _e.js)}` : '');
    }
    if ((_g = (_f = handoff.config.entries) === null || _f === void 0 ? void 0 : _f.components) === null || _g === void 0 ? void 0 : _g.length) {
        const componentPaths = handoff.config.entries.components.flatMap(getComponentsForPath);
        for (const componentPath of componentPaths) {
            const resolvedComponentPath = path_1.default.resolve(handoff.workingPath, componentPath);
            const componentBaseName = path_1.default.basename(resolvedComponentPath);
            const versions = getVersionsForComponent(resolvedComponentPath);
            if (!versions.length) {
                console.warn(`No versions found for component at: ${resolvedComponentPath}`);
                continue;
            }
            const latest = getLatestVersionForComponent(versions);
            for (const componentVersion of versions) {
                const resolvedComponentVersionPath = path_1.default.resolve(resolvedComponentPath, componentVersion);
                const possibleConfigFiles = [`${componentBaseName}.json`, `${componentBaseName}.js`, `${componentBaseName}.cjs`];
                const configFileName = possibleConfigFiles.find((file) => fs_extra_1.default.existsSync(path_1.default.resolve(resolvedComponentVersionPath, file)));
                if (!configFileName) {
                    console.warn(`Missing config: ${path_1.default.resolve(resolvedComponentVersionPath, possibleConfigFiles.join(' or '))}`);
                    continue;
                }
                const resolvedComponentVersionConfigPath = path_1.default.resolve(resolvedComponentVersionPath, configFileName);
                configFiles.push(resolvedComponentVersionConfigPath);
                let component;
                try {
                    if (configFileName.endsWith('.json')) {
                        const componentJson = fs_extra_1.default.readFileSync(resolvedComponentVersionConfigPath, 'utf8');
                        component = JSON.parse(componentJson);
                    }
                    else {
                        // Invalidate require cache to ensure fresh read
                        delete require.cache[require.resolve(resolvedComponentVersionConfigPath)];
                        const importedComponent = require(resolvedComponentVersionConfigPath);
                        component = importedComponent.default || importedComponent;
                    }
                }
                catch (err) {
                    console.error(`Failed to read or parse config: ${resolvedComponentVersionConfigPath}`, err);
                    continue;
                }
                // Use component basename as the id
                component.id = componentBaseName;
                // Resolve entry paths relative to component version directory
                if (component.entries) {
                    for (const entryType in component.entries) {
                        if (component.entries[entryType]) {
                            component.entries[entryType] = path_1.default.resolve(resolvedComponentVersionPath, component.entries[entryType]);
                        }
                    }
                }
                // Initialize options with safe defaults
                component.options || (component.options = {
                    transformer: { defaults: {}, replace: {} },
                });
                (_k = component.options).transformer || (_k.transformer = { defaults: {}, replace: {} });
                const transformer = component.options.transformer;
                (_h = transformer.cssRootClass) !== null && _h !== void 0 ? _h : (transformer.cssRootClass = null);
                (_j = transformer.tokenNameSegments) !== null && _j !== void 0 ? _j : (transformer.tokenNameSegments = null);
                // Normalize keys and values to lowercase
                transformer.defaults = toLowerCaseKeysAndValues(Object.assign({}, transformer.defaults));
                transformer.replace = toLowerCaseKeysAndValues(Object.assign({}, transformer.replace));
                // Save transformer config for latest version
                if (componentVersion === latest) {
                    result.options[component.id] = transformer;
                }
                // Save full component entry under its version
                result.entries.components[component.id] = Object.assign(Object.assign({}, result.entries.components[component.id]), { [componentVersion]: component });
            }
        }
    }
    return [result, Array.from(configFiles)];
};
exports.initIntegrationObject = initIntegrationObject;
/**
 * Returns a list of component directories for a given path.
 *
 * This function inspects the immediate subdirectories of the provided `searchPath`.
 * - If **any** subdirectory is **not** a valid semantic version (e.g. "header", "button"),
 *   the function assumes `searchPath` contains multiple component directories, and returns their full paths.
 * - If **all** subdirectories are valid semantic versions (e.g. "1.0.0", "2.1.3"),
 *   the function assumes `searchPath` itself is a component directory, and returns it as a single-element array.
 *
 * @param searchPath - The absolute path to check for components or versioned directories.
 * @returns An array of string paths to component directories.
 */
const getComponentsForPath = (searchPath) => {
    // Read all entries in the given path and keep only directories
    const components = fs_extra_1.default
        .readdirSync(searchPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    // If there's any non-semver-named directory, this is a directory full of components
    const containsComponents = components.some((name) => !semver_1.default.valid(name));
    if (containsComponents) {
        // Return full paths to each component directory
        return components.map((component) => path_1.default.join(searchPath, component));
    }
    // All subdirectories are semver versions – treat this as a single component directory
    return [searchPath];
};
const validateConfig = (config) => {
    // TODO: Check to see if the exported folder exists before we run start
    if (!config.figma_project_id && !process.env.HANDOFF_FIGMA_PROJECT_ID) {
        // check to see if we can get this from the env
        console.error(chalk_1.default.red('Figma project id not found in config or env. Please run `handoff-app fetch` first.'));
        throw new Error('Cannot initialize configuration');
    }
    if (!config.dev_access_token && !process.env.HANDOFF_DEV_ACCESS_TOKEN) {
        // check to see if we can get this from the env
        console.error(chalk_1.default.red('Dev access token not found in config or env. Please run `handoff-app fetch` first.'));
        throw new Error('Cannot initialize configuration');
    }
    return config;
};
const getVersionsForComponent = (componentPath) => {
    const versionDirectories = fs_extra_1.default.readdirSync(componentPath);
    const versions = [];
    // The directory name must be a semver
    if (fs_extra_1.default.lstatSync(componentPath).isDirectory()) {
        // this is a directory structure.  this should be the component name,
        // and each directory inside should be a version
        for (const versionDirectory of versionDirectories) {
            if (semver_1.default.valid(versionDirectory)) {
                versions.push(versionDirectory);
            }
            else {
                console.error(`Invalid version directory ${versionDirectory}`);
            }
        }
    }
    versions.sort(semver_1.default.rcompare);
    return versions;
};
const getLatestVersionForComponent = (versions) => versions.sort(semver_1.default.rcompare)[0];
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
