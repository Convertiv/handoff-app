import path from 'path';
import { ColorObject, DocumentationObject, TypographyObject } from '../../../types';
import { HookReturn } from '../../../types';
import webpack from 'webpack';
import fs from 'fs-extra';
import { getPathToIntegration } from '..';
import { ExportableTransformerOptionsMap } from '../../types';
import { componentMapFile, transformComponentsToTailwind } from './components';
import { getHandoff } from '../../../config';

export const modifyWebpackConfigForTailwind = (webpackConfig: webpack.Configuration): webpack.Configuration => {
  const handoff = getHandoff();
  const tailwindPath = path.resolve(handoff?.workingPath, 'exported/tailwind-tokens/tailwind.config.js');
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
const path = require("path");
const fs = require('fs');
const plugin = require('tailwindcss/plugin')
const colors = require('./colors');  
const fonts = require('./fonts');  
const components = require('./components');  
module.exports = {
  content: ["./config/integrations/tailwind/3.3/templates/**/*.{html,js}"],
  blocklist: [],
  theme: {
    colors: colors,
    fontSize: fonts.fontSize,
    lineHeight: fonts.lineHeight,
    textColor: fonts.textColor,
    fontFamily: fonts.fontFamily,
    fontWeight: fonts.fontWeight,
    letterSpacing: fonts.letterSpacing
  },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents(components);
    }),
  ],
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
    {
      filename: 'components.js',
      data: componentMapFile(documentationObject.components),
    }
  ];
};