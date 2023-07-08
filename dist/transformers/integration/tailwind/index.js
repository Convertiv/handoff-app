"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postTailwindIntegration = exports.modifyWebpackConfigForTailwind = void 0;
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var components_1 = require("./components");
var config_1 = require("../../../config");
var modifyWebpackConfigForTailwind = function (webpackConfig) {
    var handoff = (0, config_1.getHandoff)();
    var tailwindPath = path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'exported/tailwind-tokens/tailwind.config.js');
    var plugins = [];
    try {
        var tailwindcss = require('tailwindcss');
        var autoprefixer = require('autoprefixer');
        plugins = [tailwindcss(tailwindPath), autoprefixer];
    }
    catch (e) {
        console.log('Tailwind not installed.  Please run `npm install tailwindcss autoprefixer`', e);
        return webpackConfig;
    }
    if (!fs_extra_1.default.existsSync(tailwindPath)) {
        console.log("Tailwind config not found at ".concat(tailwindPath, "."));
    }
    if (!webpackConfig.module) {
        webpackConfig.module = {};
    }
    webpackConfig.module.rules = [
        {
            test: /\.js$/i,
            include: path_1.default.resolve(__dirname, 'templates'),
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                },
            },
        },
        {
            test: /\.(sa|sc|c)ss$/,
            use: [
                'style-loader',
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: plugins,
                        },
                    },
                },
            ],
        },
    ];
    return webpackConfig;
};
exports.modifyWebpackConfigForTailwind = modifyWebpackConfigForTailwind;
var makeModule = function (data) {
    return "module.exports = ".concat(JSON.stringify(data, null, 2), ";");
};
var tailwindConfig = function () {
    return "\nconst path = require(\"path\");\nconst fs = require('fs');\nconst plugin = require('tailwindcss/plugin')\nconst colors = require('./colors');  \nconst fonts = require('./fonts');  \nconst components = require('./components');  \nmodule.exports = {\n  content: [\"./config/integrations/tailwind/3.3/templates/**/*.{html,js}\"],\n  blocklist: [],\n  theme: {\n    colors: colors,\n    fontSize: fonts.fontSize,\n    lineHeight: fonts.lineHeight,\n    textColor: fonts.textColor,\n    fontFamily: fonts.fontFamily,\n    fontWeight: fonts.fontWeight,\n    letterSpacing: fonts.letterSpacing\n  },\n  plugins: [\n    plugin(function ({ addComponents }) {\n      addComponents(components);\n    }),\n  ],\n};\n";
};
var tailwindColors = function (colors) {
    var output = {};
    colors.map(function (color) { var _a; return (output["".concat(color.group, "-").concat(color.machineName)] = (_a = color.value) !== null && _a !== void 0 ? _a : ''); });
    return makeModule(output);
};
var tailwindFonts = function (typography) {
    var output = {
        fontSize: {},
        lineHeight: {},
        textColor: {},
        fontFamily: {},
        fontWeight: {},
        letterSpacing: {},
    };
    typography.map(function (type) {
        output.fontSize[type.machine_name] = "".concat(type.values.fontSize, "px");
        output.lineHeight[type.machine_name] = "".concat(Math.round(type.values.lineHeightPx), "px");
        output.textColor[type.machine_name] = type.values.color;
        output.fontFamily[type.machine_name] = [type.values.fontFamily];
        output.fontWeight[type.machine_name] = type.values.fontWeight;
        output.letterSpacing[type.machine_name] = "".concat(type.values.letterSpacing, "px");
    });
    return makeModule(output);
};
var postTailwindIntegration = function (documentationObject, artifact, options) {
    var components = [];
    for (var componentName in documentationObject.components) {
        components.push({
            filename: "".concat(componentName, ".js"),
            data: (0, components_1.transformComponentsToTailwind)(componentName, documentationObject.components[componentName], options === null || options === void 0 ? void 0 : options.get(componentName)),
        });
    }
    return __spreadArray(__spreadArray([], components, true), [
        {
            filename: 'tailwind.config.js',
            data: tailwindConfig(),
        },
        {
            filename: 'colors.js',
            data: tailwindColors(documentationObject.design.color),
        },
        {
            filename: 'fonts.js',
            data: tailwindFonts(documentationObject.design.typography),
        },
        {
            filename: 'components.js',
            data: (0, components_1.componentMapFile)(documentationObject.components),
        }
    ], false);
};
exports.postTailwindIntegration = postTailwindIntegration;
