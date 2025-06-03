"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postTailwindIntegration = exports.modifyWebpackConfigForTailwind = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const _1 = require(".");
const modifyWebpackConfigForTailwind = (handoff, webpackConfig) => {
    const tailwindPath = path_1.default.resolve(path_1.default.join((0, _1.getPathToIntegration)(handoff, false), 'templates/tailwind.config.js'));
    let plugins = [];
    try {
        const tailwindcss = require('tailwindcss');
        const autoprefixer = require('autoprefixer');
        plugins = [tailwindcss(tailwindPath), autoprefixer];
    }
    catch (e) {
        console.log('Tailwind not installed.  Please run `npm install tailwindcss autoprefixer`', e);
        return webpackConfig;
    }
    if (!fs_extra_1.default.existsSync(tailwindPath)) {
        console.log(`Tailwind config not found at ${tailwindPath}.`);
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
const postTailwindIntegration = (documentationObject, artifacts) => {
    const extend = {
        colors: {},
        fontSize: {},
        lineHeight: {},
        textColor: {},
        fontFamily: {},
        fontWeight: {},
        letterSpacing: {},
    };
    documentationObject.design.color.map((color) => (extend.colors[`${color.group}-${color.machineName}`] = color.value));
    documentationObject.design.typography.map((type) => {
        extend.fontSize[type.machine_name] = `${type.values.fontSize}px`;
        extend.lineHeight[type.machine_name] = `${Math.round(type.values.lineHeightPx)}px`;
        extend.textColor[type.machine_name] = type.values.color;
        extend.fontFamily[type.machine_name] = [type.values.fontFamily];
        extend.fontWeight[type.machine_name] = type.values.fontWeight;
        extend.letterSpacing[type.machine_name] = `${type.values.letterSpacing}px`;
    });
    const defaults = {
        theme: extend,
    };
    const data = `/** You can include this file in your tailwind.config.js */ \n module.exports = ${JSON.stringify(defaults, null, 2)};`;
    //const plugin = transformButtonComponentTokensToTailwinds(documentationObject);
    //const pluginString = JSON.stringify(plugin, null, 2);
    return [
        {
            filename: 'theme.js',
            data,
        },
        //     {
        //       filename: 'components.js',
        //       data: `/** This exports all the components as Tailwinds Components for Handoff Preview. */ \n
        // module.exports = ${pluginString};`,
        //     },
    ];
};
exports.postTailwindIntegration = postTailwindIntegration;
// /**
//  * Transform Buton components into Css vars
//  * @param tokens
//  * @returns
//  */
// const transformButtonComponentTokensToTailwinds = (documentationObject: DocumentationObject) => {
//   const plugins: {[key: string]: any} = [];
//   // Find default buttons
//   documentationObject.components.buttons
//     .filter((button) => button.state === 'default' && button.theme === 'light')
//     .map((button) => {
//       const rendered = {
//         background: `var(--button-${button.type}-background)`,
//         color: `var(--button-${button.type}-color)`,
//         paddingTop: `var(--button-${button.type}-padding-top)`,
//         paddingRight: `var(--button-${button.type}-padding-right)`,
//         paddingBottom: `var(--button-${button.type}-padding-bottom)`,
//         paddingLeft: `var(--button-${button.type}-padding-left)`,
//         borderWidth: `var(--button-${button.type}-border-width)`,
//         borderRadius: `var(--button-${button.type}-border-radius)`,
//         borderColor: `var(--button-${button.type}-border-color)`,
//         fontFamily: `var(--button-${button.type}-font-family)`,
//         fontSize: `var(--button-${button.type}-font-size)`,
//         fontWeight: `var(--button-${button.type}-font-weight)`,
//         lineHeight: `var(--button-${button.type}-line-height)`,
//         letterSpacing: `var(--button-${button.type}-letter-spacing)`,
//         textAlign: `var(--button-${button.type}-text-align)`,
//         textDecoration: `var(--button-${button.type}-text-decoration)`,
//         textTransform: `var(--button-${button.type}-text-transform)`,
//         boxShadow: `var(--button-${button.type}-box-shadow)`,
//         opacity: `var(--button-${button.type}-opacity)`,
//         $hover: {},
//       };
//       plugins.push({
//         [`.btn-${button.type}`]: rendered,
//       });
//     });
//   return plugins;
// };
