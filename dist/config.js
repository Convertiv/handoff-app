"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveHandoffState = exports.getClientConfig = exports.defaultConfig = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var defaultConfig = function () {
    var _a, _b;
    return ({
        dev_access_token: (_a = process.env.DEV_ACCESS_TOKEN) !== null && _a !== void 0 ? _a : null,
        figma_project_id: (_b = process.env.FIGMA_PROJECT_ID) !== null && _b !== void 0 ? _b : null,
        integration: {
            name: 'bootstrap',
            version: '5.3',
        },
        app: {
            theme: 'default',
            title: 'Convertiv Design System',
            client: 'Convertiv',
            google_tag_manager: null,
            attribution: true,
            type_copy: 'Almost before we knew it, we had left the ground.',
            type_sort: ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Heading 5', 'Heading 6', 'Paragraph', 'Subheading', 'Blockquote', 'Input Labels', 'Link'],
            color_sort: ['primary', 'secondary', 'extra', 'system'],
            component_sort: ['primary', 'secondary', 'transparent'],
            base_path: '',
        },
        figma: {
            options: {
                shared: {
                    defaults: {
                        'Theme': 'light',
                        'State': 'default',
                        'Type': 'default',
                        'Activity': '',
                        'Layout': '',
                        'Size': '',
                    },
                },
                transformer: {
                    replace: {
                        'State': {
                            'default': '',
                        },
                        'Size': {
                            'small': 'sm',
                            'medium': 'md',
                            'large': 'lg',
                        },
                    },
                },
            },
            definitions: [
                'components/alert',
                'components/button',
                'components/modal',
                'components/tooltip',
                'components/checkbox',
                'components/input',
                'components/radio',
                'components/select',
                'components/switch',
            ],
        },
    });
};
exports.defaultConfig = defaultConfig;
/**
 * Get the configuration formatted for the client, either from the root of the project or from the default config.
 * @returns Promise<Config>
 */
var getClientConfig = function (configOverride) {
    // Check to see if there is a config in the root of the project
    var config = {};
    var configPath = path_1.default.resolve(process.cwd(), 'handoff.config.json');
    if (fs_extra_1.default.existsSync(configPath)) {
        var defBuffer = fs_extra_1.default.readFileSync(configPath);
        config = JSON.parse(defBuffer.toString());
    }
    if (configOverride) {
        config = __assign(__assign({}, config), configOverride);
    }
    var _a = __assign(__assign({}, (0, exports.defaultConfig)()), config), app = _a.app, figma = _a.figma, assets_zip_links = _a.assets_zip_links;
    return {
        app: app,
        figma: figma,
        assets_zip_links: assets_zip_links !== null && assets_zip_links !== void 0 ? assets_zip_links : { icons: null, logos: null },
    };
};
exports.getClientConfig = getClientConfig;
/**
 * Serializes and saves the current handoff state to the working directory
 * @param handoff Handoff
 */
var saveHandoffState = function (handoff) {
    var outputPath = path_1.default.resolve(handoff.workingPath, handoff.outputDirectory, handoff.config.figma_project_id);
    if (!fs_extra_1.default.existsSync(outputPath)) {
        fs_extra_1.default.mkdirSync(path_1.default.resolve(outputPath), { recursive: true });
    }
    var statePath = path_1.default.resolve(outputPath, 'handoff.state.json');
    handoff.config = sanitizeConfigiration(handoff.config);
    fs_extra_1.default.writeFileSync(statePath, JSON.stringify(handoff));
};
exports.saveHandoffState = saveHandoffState;
var sanitizeConfigiration = function (config) {
    delete config.figma_project_id;
    delete config.dev_access_token;
    return config;
};
