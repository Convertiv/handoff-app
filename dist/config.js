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
exports.getClientConfig = exports.defaultConfig = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var defaultConfig = function () {
    var _a, _b, _c, _d, _e;
    return ({
        dev_access_token: (_a = process.env.HANDOFF_DEV_ACCESS_TOKEN) !== null && _a !== void 0 ? _a : null,
        figma_project_id: (_b = process.env.HANDOFF_FIGMA_PROJECT_ID) !== null && _b !== void 0 ? _b : null,
        exportsOutputDirectory: (_c = process.env.HANDOFF_OUTPUT_DIR) !== null && _c !== void 0 ? _c : 'exported',
        sitesOutputDirectory: (_d = process.env.HANDOFF_SITES_DIR) !== null && _d !== void 0 ? _d : 'out',
        app: {
            theme: 'default',
            title: 'Convertiv Design System',
            client: 'Convertiv',
            google_tag_manager: null,
            attribution: true,
            type_copy: 'Almost before we knew it, we had left the ground.',
            type_sort: [
                'Heading 1',
                'Heading 2',
                'Heading 3',
                'Heading 4',
                'Heading 5',
                'Heading 6',
                'Paragraph',
                'Subheading',
                'Blockquote',
                'Input Labels',
                'Link',
            ],
            color_sort: ['primary', 'secondary', 'extra', 'system'],
            component_sort: ['primary', 'secondary', 'transparent'],
            base_path: '',
        },
        figma: {
            options: {},
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
        use_legacy_definitions: ((_e = process.env.HANDOFF_USE_FIGMA_PLUGIN) !== null && _e !== void 0 ? _e : '').toLowerCase() === 'false',
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
    var _a = __assign(__assign({}, (0, exports.defaultConfig)()), config), app = _a.app, figma = _a.figma, integration = _a.integration, exportsOutputDirectory = _a.exportsOutputDirectory, sitesOutputDirectory = _a.sitesOutputDirectory, assets_zip_links = _a.assets_zip_links, use_legacy_definitions = _a.use_legacy_definitions;
    return {
        app: app,
        figma: figma,
        integration: integration,
        exportsOutputDirectory: exportsOutputDirectory,
        sitesOutputDirectory: sitesOutputDirectory,
        assets_zip_links: assets_zip_links !== null && assets_zip_links !== void 0 ? assets_zip_links : { icons: null, logos: null },
        use_legacy_definitions: use_legacy_definitions,
    };
};
exports.getClientConfig = getClientConfig;
