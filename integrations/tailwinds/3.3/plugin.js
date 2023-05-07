var path = require('path');
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
        test: /\.css$/i,
        include: path.resolve(__dirname, 'templates'),
        use: ['style-loader', 'css-loader'],
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
    const data = `module.exports = ${JSON.stringify(extend, null, 2)};`;
    return {
      filename: 'tailwind.config.js',
      data,
    };
  },
};
