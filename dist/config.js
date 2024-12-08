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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientConfig = exports.defaultConfig = void 0;
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const defaultConfig = () => {
    var _a, _b, _c, _d, _e;
    return ({
        dev_access_token: (_a = process.env.HANDOFF_DEV_ACCESS_TOKEN) !== null && _a !== void 0 ? _a : null,
        figma_project_id: (_b = process.env.HANDOFF_FIGMA_PROJECT_ID) !== null && _b !== void 0 ? _b : null,
        exportsOutputDirectory: (_c = process.env.HANDOFF_OUTPUT_DIR) !== null && _c !== void 0 ? _c : 'exported',
        sitesOutputDirectory: (_d = process.env.HANDOFF_SITES_DIR) !== null && _d !== void 0 ? _d : 'out',
        useVariables: (_e = Boolean(process.env.HANDOFF_USE_VARIABLES)) !== null && _e !== void 0 ? _e : false,
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
            breakpoints: {
                sm: { size: 576, name: 'Small' },
                md: { size: 768, name: 'Medium' },
                lg: { size: 992, name: 'Large' },
                xl: { size: 1200, name: 'Extra Large' },
            },
        },
    });
};
exports.defaultConfig = defaultConfig;
/**
 * Get the configuration formatted for the client, either from the root of the project or from the default config.
 * @returns Promise<Config>
 */
const getClientConfig = (configOverride) => {
    // Check to see if there is a config in the root of the project
    let config = {};
    let configPath = path_1.default.resolve(process.cwd(), 'handoff.config.json');
    if (fs.existsSync(configPath)) {
        const defBuffer = fs.readFileSync(configPath);
        config = JSON.parse(defBuffer.toString());
    }
    if (configOverride) {
        config = Object.assign(Object.assign({}, config), configOverride);
    }
    const { app, exportsOutputDirectory, sitesOutputDirectory, assets_zip_links = { icons: null, logos: null }, useVariables, } = Object.assign(Object.assign({}, (0, exports.defaultConfig)()), config);
    return {
        app,
        exportsOutputDirectory,
        sitesOutputDirectory,
        assets_zip_links,
        useVariables,
    };
};
exports.getClientConfig = getClientConfig;
