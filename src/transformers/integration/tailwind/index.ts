import path from 'path';
import { ColorObject, DocumentationObject, TypographyObject } from '../../../types';
import { HookReturn } from '../../../types';
import webpack from 'webpack';
import fs from 'fs-extra';
import { getPathToIntegration } from '..';
import { ExportableTransformerOptionsMap } from '../../types';
import { transformComponentsToTailwind } from './components';

export const modifyWebpackConfigForTailwind = (webpackConfig: webpack.Configuration): webpack.Configuration => {
  const tailwindPath = path.resolve(path.join(getPathToIntegration(), 'templates/tailwind.config.js'));
  let plugins: any[] = [];
  try {
    const tailwindcss = require('tailwindcss');
    const autoprefixer = require('autoprefixer');
    plugins = [tailwindcss(tailwindPath), autoprefixer];
  } catch (e) {
    console.log('Tailwind not installed.  Please run `npm install tailwindcss autoprefixer`', e);
    return webpackConfig;
  }
  if (!fs.existsSync(tailwindPath)) {
    console.log(`Tailwind config not found at ${tailwindPath}.`);
  }
  if (!webpackConfig.module) {
    webpackConfig.module = {};
  }
  webpackConfig.module.rules = [
    {
      test: /\.js$/i,
      include: path.resolve(__dirname, 'templates'),
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

const makeModule = (data: any) => {
  return `module.exports = ${JSON.stringify(data, null, 2)};`;
};

const tailwindConfig = (): string => {
  return `
const colors = require('./colors');  
const fonts = require('./colors');  
module.exports = {
  theme: {
    colors: colors,
    fontSize: fonts.fontSize,
    lineHeight: fonts.lineHeight,
    textColor: fonts.textColor,
    fontFamily: fonts.fontFamily,
    fontWeight: fonts.fontWeight,
    letterSpacing: fonts.letterSpacing
  }
};
`;
};

const tailwindColors = (colors: ColorObject[]): string => {
  const output: { [key: string]: string } = {};
  colors.map((color) => (output[`${color.group}-${color.machineName}`] = color.value ?? ''));
  return makeModule(output);
};

interface TailwindFont {
  fontSize: { [key: string]: string };
  lineHeight: { [key: string]: string };
  textColor: { [key: string]: string };
  fontFamily: { [key: string]: [string] };
  fontWeight: { [key: string]: string };
  letterSpacing: { [key: string]: string };
}

const tailwindFonts = (typography: TypographyObject[]): string => {
  const output: TailwindFont = {
    fontSize: {},
    lineHeight: {},
    textColor: {},
    fontFamily: {},
    fontWeight: {},
    letterSpacing: {},
  };
  typography.map((type) => {
    output.fontSize[type.machine_name] = `${type.values.fontSize}px`;
    output.lineHeight[type.machine_name] = `${Math.round(type.values.lineHeightPx)}px`;
    output.textColor[type.machine_name] = type.values.color;
    output.fontFamily[type.machine_name] = [type.values.fontFamily];
    output.fontWeight[type.machine_name] = type.values.fontWeight;
    output.letterSpacing[type.machine_name] = `${type.values.letterSpacing}px`;
  });
  return makeModule(output);
};

export const postTailwindIntegration = (
  documentationObject: DocumentationObject,
  artifact: HookReturn[],
  options?: ExportableTransformerOptionsMap
): HookReturn[] => {
  const components: HookReturn[] = [];

  for (const componentName in documentationObject.components) {
    components.push({
      filename: `${componentName}.js`,
      data: transformComponentsToTailwind(componentName, documentationObject.components[componentName], options?.get(componentName)),
    });
  }

  return [
    ...components,
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
  ];
};

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
