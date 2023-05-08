var path = require('path');
const tailwindcss = require('tailwindcss');

sandbox.exports = {
  init: () => {
    console.log('initialize hook in tailwind plugin');
  },
  postCssTransformer: (documentationObject, css) => {},
  postScssTransformer: (documentationObject, scss) => {},
  postExtract: (documentationObject) => {},
  postPreview: (documentationObject) => {},
  postBuild: (documentationObject) => {},
  modifyWebpackConfig: (webpackConfig) => {
    webpackConfig.module.rules = [
      {
        test: /\.js$/i,
        include: path.resolve(__dirname, 'templates'),
        use: { 
          loader: 'babel-loader', 
          options: { 
            presets: ['@babel/preset-env'] } },
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
                plugins: [
                  tailwindcss(path.resolve(__dirname, '../../../exported/tailwind-tokens/tailwind.config.js')),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      },
    ];
    return webpackConfig;
  },

  /**
   * Execute the postIntegration hook to generate the tailwind.config.js file
   * and save it to the exported directory.
   * @param {*} documentationObject
   * @returns
   */
  postIntegration: (documentationObject) => {
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
      content: [
        path.resolve(__dirname, './**/*.{html,js}'),
      ],
      extend,
    }
    const data = `/** @type {import('tailwindcss').Config} */ \n module.exports = ${JSON.stringify(defaults, null, 2)};`;
    return {
      filename: 'tailwind.config.js',
      data,
    };
  },
};
