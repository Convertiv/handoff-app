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
import fs from 'fs-extra';
import path from 'path';
export var defaultConfig = {
    dev_access_token: null,
    figma_project_id: null,
    title: 'Convertiv Design System',
    client: 'Convertiv',
    buildApp: true,
    google_tag_manager: null,
    integration: {
        name: 'bootstrap',
        version: '5.2',
    },
    favicon: '/favicon.ico',
    logo: '/logo.svg',
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
export var getConfig = function () {
    if (global.handoff && global.handoff.config) {
        return global.handoff.config;
    }
    // Check to see if there is a config in the root of the project
    var config = {}, configPath = path.resolve(process.cwd(), 'client-config.json');
    if (fs.existsSync(configPath)) {
        var defBuffer = fs.readFileSync(configPath);
        config = JSON.parse(defBuffer.toString());
    }
    return __assign(__assign({}, defaultConfig), config);
};
export var getHandoff = function () {
    if (global.handoff) {
        return global.handoff;
    }
    // check for a serialized version
    var handoff = deserializeHandoff();
    if (handoff) {
        global.handoff = handoff;
        return handoff;
    }
    throw Error('Handoff not initialized');
};
/**
 * Serialize the handoff to the working directory
 */
export var serializeHandoff = function () {
    var handoff = getHandoff();
    if (!fs.existsSync(path.join(process.cwd(), 'exported'))) {
        fs.mkdirSync(path.join(process.cwd(), 'exported'));
    }
    var statePath = path.join(process.cwd(), 'exported', 'handoff.state.json');
    fs.writeFileSync(statePath, JSON.stringify(handoff));
};
/**
 * Deserialize the handoff from the working directory
 * @returns
 */
export var deserializeHandoff = function () {
    var statePath = path.join(process.cwd(), 'exported', 'handoff.state.json');
    if (fs.existsSync(statePath)) {
        var stateBuffer = fs.readFileSync(statePath);
        var state = JSON.parse(stateBuffer.toString());
        return state;
    }
    throw Error('Handoff cannot be deserialized');
};
