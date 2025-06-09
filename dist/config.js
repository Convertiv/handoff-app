"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientConfig = exports.defaultConfig = void 0;
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
                mobile: { size: 400, name: 'Mobile' },
                tablet: { size: 800, name: 'Medium' },
                desktop: { size: 1100, name: 'Large' },
            },
            ports: {
                app: Number(process.env.HANDOFF_APP_PORT) || 3000,
                websocket: Number(process.env.HANDOFF_WEBSOCKET_PORT) || 3001
            }
        },
    });
};
exports.defaultConfig = defaultConfig;
/**
 * Retrieves the client configuration from the provided handoff configuration.
 *
 * @param handoff - The handoff object containing the configuration details.
 * @returns The client configuration object.
 */
const getClientConfig = (handoff) => {
    const config = handoff.config;
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
