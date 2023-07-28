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
exports.deserializeHandoff = exports.serializeHandoff = exports.getHandoff = exports.getConfig = exports.defaultConfig = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
exports.defaultConfig = {
    dev_access_token: null,
    figma_project_id: null,
    title: 'Convertiv Design System',
    client: 'Convertiv',
    google_tag_manager: null,
    integration: {
        name: 'bootstrap',
        version: '5.3',
    },
    favicon: '/favicon.ico',
    logo: '/logo.svg',
    theme: 'default',
    poweredBy: true,
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
    figma: {
        options: {
            shared: {
                defaults: {
                    theme: 'light',
                    state: 'default',
                    type: 'default',
                    activity: '',
                    layout: '',
                    size: '',
                },
            },
            transformer: {
                replace: {
                    size: {
                        small: 'sm',
                        medium: 'md',
                        large: 'lg',
                    },
                },
            },
        },
        definitions: [
            'components/alert',
            'components/button',
            'components/badge',
            'components/modal',
            'components/tooltip',
            'components/checkbox',
            'components/input',
            'components/radio',
            'components/select',
            'components/switch',
        ],
    },
    type_copy: 'Almost before we knew it, we had left the ground.',
    color_sort: ['primary', 'secondary', 'extra', 'system'],
    component_sort: ['primary', 'secondary', 'transparent'],
};
/**
 * Get the config, either from the root of the project or from the default config
 * @returns Promise<Config>
 */
var getConfig = function (configOverride) {
    if (global.handoff && global.handoff.config) {
        return global.handoff.config;
    }
    // Check to see if there is a config in the root of the project
    var config = {}, configPath = path_1.default.resolve(process.cwd(), 'handoff.config.json');
    if (fs_extra_1.default.existsSync(configPath)) {
        var defBuffer = fs_extra_1.default.readFileSync(configPath);
        config = JSON.parse(defBuffer.toString());
    }
    if (configOverride) {
        config = __assign(__assign({}, config), configOverride);
    }
    return __assign(__assign({}, exports.defaultConfig), config);
};
exports.getConfig = getConfig;
/**
 * Get the handoff from the global scope
 * @returns Handoff
 */
var getHandoff = function () {
    if (global.handoff) {
        return global.handoff;
    }
    // check for a serialized version
    var handoff = (0, exports.deserializeHandoff)();
    if (handoff) {
        global.handoff = handoff;
        return handoff;
    }
    throw Error('Handoff not initialized');
};
exports.getHandoff = getHandoff;
/**
 * Serialize the handoff to the working directory
 */
var serializeHandoff = function (handoff) {
    if (!fs_extra_1.default.existsSync(path_1.default.join(process.cwd(), 'exported'))) {
        fs_extra_1.default.mkdirSync(path_1.default.join(process.cwd(), 'exported'));
    }
    var statePath = path_1.default.join(process.cwd(), 'exported', 'handoff.state.json');
    fs_extra_1.default.writeFileSync(statePath, JSON.stringify(handoff));
};
exports.serializeHandoff = serializeHandoff;
/**
 * Deserialize the handoff from the working directory
 * @returns
 */
var deserializeHandoff = function () {
    var statePath = path_1.default.join(process.cwd(), 'exported', 'handoff.state.json');
    if (fs_extra_1.default.existsSync(statePath)) {
        var stateBuffer = fs_extra_1.default.readFileSync(statePath);
        var state = JSON.parse(stateBuffer.toString());
        return state;
    }
    throw Error('Handoff cannot be deserialized');
};
exports.deserializeHandoff = deserializeHandoff;
