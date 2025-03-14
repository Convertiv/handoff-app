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
exports.initIntegrationObject = void 0;
const chalk_1 = __importDefault(require("chalk"));
require("dotenv/config");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const app_1 = __importStar(require("./app"));
const eject_1 = require("./cli/eject");
const make_1 = require("./cli/make");
const config_1 = require("./config");
const pipeline_1 = __importStar(require("./pipeline"));
const integration_1 = require("./transformers/integration");
const builder_1 = __importDefault(require("./transformers/preview/component/builder"));
const css_1 = require("./transformers/preview/component/css");
const javascript_1 = require("./transformers/preview/component/javascript");
const rename_1 = require("./transformers/preview/component/rename");
const integration_2 = require("./utils/integration");
class Handoff {
    constructor(debug, force, config) {
        this.debug = false;
        this.force = false;
        this.modulePath = path_1.default.resolve(__filename, '../..');
        this.workingPath = process.cwd();
        this.exportsDirectory = 'exported';
        this.sitesDirectory = 'out';
        this.config = null;
        this.debug = debug !== null && debug !== void 0 ? debug : false;
        this.force = force !== null && force !== void 0 ? force : false;
        this.hooks = {
            init: (config) => config,
            fetch: () => { },
            build: (documentationObject) => { },
            typeTransformer: (documentationObject, types) => types,
            integration: (documentationObject, data) => data,
            cssTransformer: (documentationObject, css) => css,
            scssTransformer: (documentationObject, scss) => scss,
            styleDictionaryTransformer: (documentationObject, styleDictionary) => styleDictionary,
            mapTransformer: (documentationObject, styleDictionary) => styleDictionary,
            webpack: (webpackConfig) => webpackConfig,
            preview: (webpackConfig, preview) => preview,
        };
        this.init(config);
        this.integrationHooks = (0, integration_1.instantiateIntegration)(this);
        global.handoff = this;
    }
    init(configOverride) {
        var _a, _b;
        const config = initConfig(configOverride !== null && configOverride !== void 0 ? configOverride : {});
        this.config = config;
        this.config = this.hooks.init(this.config);
        this.exportsDirectory = (_a = config.exportsOutputDirectory) !== null && _a !== void 0 ? _a : this.exportsDirectory;
        this.sitesDirectory = (_b = config.sitesOutputDirectory) !== null && _b !== void 0 ? _b : this.exportsDirectory;
        this.integrationObject = (0, exports.initIntegrationObject)(this);
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
            if (this.config) {
                this.preRunner();
                yield (0, pipeline_1.default)(this);
                this.hooks.fetch();
            }
            return this;
        });
    }
    recipe() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            if (this.config) {
                yield (0, pipeline_1.buildRecipe)(this);
            }
            return this;
        });
    }
    component(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            if (this.config) {
                if (name) {
                    name = name.replace('.hbs', '');
                    yield (0, builder_1.default)(this, name);
                }
                else {
                    yield (0, pipeline_1.buildComponents)(this);
                }
            }
            return this;
        });
    }
    renameComponent(oldName, target) {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            if (this.config) {
                (0, rename_1.renameComponent)(this, oldName, target);
            }
            return this;
        });
    }
    integration() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            if (this.config) {
                yield (0, pipeline_1.buildIntegrationOnly)(this);
                yield (0, pipeline_1.buildComponents)(this);
            }
            return this;
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner(true);
            if (this.config) {
                yield (0, app_1.default)(this);
            }
            return this;
        });
    }
    ejectConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            this.preRunner();
            if (this.config) {
                yield (0, eject_1.ejectConfig)(this);
            }
            return this;
        });
    }
    ejectIntegration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, eject_1.makeIntegration)(this);
            }
            return this;
        });
    }
    ejectExportables() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, eject_1.ejectExportables)(this);
            }
            return this;
        });
    }
    ejectPages() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, eject_1.ejectPages)(this);
            }
            return this;
        });
    }
    ejectTheme() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, eject_1.ejectTheme)(this);
            }
            return this;
        });
    }
    makeExportable(type, name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, make_1.makeExportable)(this, type, name);
            }
            return this;
        });
    }
    makeTemplate(component, state) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, make_1.makeTemplate)(this, component, state);
            }
            return this;
        });
    }
    makePage(name, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, make_1.makePage)(this, name, parent);
            }
            return this;
        });
    }
    makeComponent(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, make_1.makeComponent)(this, name);
            }
            return this;
        });
    }
    makeIntegration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, eject_1.makeIntegration)(this);
            }
            return this;
        });
    }
    makeIntegrationStyles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                yield (0, javascript_1.buildMainJS)(this);
                yield (0, css_1.buildMainCss)(this);
            }
            return this;
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                this.preRunner(true);
                yield (0, app_1.watchApp)(this);
            }
            return this;
        });
    }
    dev() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                this.preRunner(true);
                yield (0, app_1.devApp)(this);
            }
            return this;
        });
    }
    postInit(callback) {
        this.hooks.init = callback;
    }
    postTypeTransformer(callback) {
        this.hooks.typeTransformer = callback;
    }
    postCssTransformer(callback) {
        this.hooks.cssTransformer = callback;
    }
    postScssTransformer(callback) {
        this.hooks.scssTransformer = callback;
    }
    postPreview(callback) {
        this.hooks.preview = callback;
    }
    postBuild(callback) {
        this.hooks.build = callback;
    }
    postIntegration(callback) {
        this.hooks.integration = callback;
    }
    modifyWebpackConfig(callback) {
        this.hooks.webpack = callback;
    }
}
const initConfig = (configOverride) => {
    let config = {};
    let configPath = path_1.default.resolve(process.cwd(), 'handoff.config.json');
    if (fs_extra_1.default.existsSync(configPath)) {
        const defBuffer = fs_extra_1.default.readFileSync(configPath);
        config = JSON.parse(defBuffer.toString());
    }
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
    var _a, _b;
    const integrationPath = path_1.default.join(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration');
    if (!fs_extra_1.default.existsSync(integrationPath)) {
        return null;
    }
    const integrationConfigPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, (_b = handoff.config.integrationPath) !== null && _b !== void 0 ? _b : 'integration', 'integration.config.json'));
    if (!fs_extra_1.default.existsSync(integrationConfigPath)) {
        return null;
    }
    const buffer = fs_extra_1.default.readFileSync(integrationConfigPath);
    const integration = JSON.parse(buffer.toString());
    return (0, integration_2.prepareIntegrationObject)(integration, integrationPath);
};
exports.initIntegrationObject = initIntegrationObject;
const validateConfig = (config) => {
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
exports.default = Handoff;
