var path = require("path");
const tailwindcss = require("tailwindcss");
const fs = require("fs");

/** @type {import('handoff-app').Plugin} */
sandbox.exports = {
  init: () => {
    console.log("initialize hook in tailwind plugin");
  },
  postCssTransformer: (documentationObject, css) => {},
  postScssTransformer: (documentationObject, scss) => {},
  postExtract: (documentationObject) => {},
  postPreview: (documentationObject) => {},
  postBuild: (documentationObject) => {},
  postFont: (documentationObject, customFonts) => {},
  modifyWebpackConfig: (webpackConfig) => {
    const tailwindPath = path.resolve(
      __dirname,
      "./templates/tailwind.config.js"
    );
    if (!fs.existsSync(tailwindPath)) {
      console.log(`Tailwind config not found at ${tailwindPath}.`);
    }
    webpackConfig.module.rules = [
      {
        test: /\.js$/i,
        include: path.resolve(__dirname, "templates"),
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [tailwindcss(tailwindPath), require("autoprefixer")],
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
    documentationObject.design.color.map(
      (color) =>
        (extend.colors[`${color.group}-${color.machineName}`] = color.value)
    );
    documentationObject.design.typography.map((type) => {
      extend.fontSize[type.machine_name] = `${type.values.fontSize}px`;
      extend.lineHeight[type.machine_name] = `${Math.round(
        type.values.lineHeightPx
      )}px`;
      extend.textColor[type.machine_name] = type.values.color;
      extend.fontFamily[type.machine_name] = [type.values.fontFamily];
      extend.fontWeight[type.machine_name] = type.values.fontWeight;
      extend.letterSpacing[
        type.machine_name
      ] = `${type.values.letterSpacing}px`;
    });
    const defaults = {
      theme: extend,
    };
    const data = `/** You can include this file in your tailwind.config.js */ \n module.exports = ${JSON.stringify(
      defaults,
      null,
      2
    )};`;

    const plugin =
      transformButtonComponentTokensToTailwinds(documentationObject);
    const pluginString = JSON.stringify(plugin, null, 2);
    return [
      {
        filename: "theme.js",
        data,
      },
      {
        filename: "components.js",
        data: `/** This exports all the components as Tailwinds Components for Handoff Preview. */ \n
module.exports = ${pluginString};`,
      },
    ];
  },
};

/**
 * Transform Buton components into Css vars
 * @param tokens
 * @returns
 */
const transformButtonComponentTokensToTailwinds = (documentationObject) => {
  plugins = [];
  // Find default buttons
  documentationObject.components.buttons
    .filter((button) => button.state === "default" && button.theme === "light")
    .map((button) => {
      const rendered = {
        background: `var(--button-${button.type}-background)`,
        color: `var(--button-${button.type}-color)`,
        paddingTop: `var(--button-${button.type}-padding-top)`,
        paddingRight: `var(--button-${button.type}-padding-right)`,
        paddingBottom: `var(--button-${button.type}-padding-bottom)`,
        paddingLeft: `var(--button-${button.type}-padding-left)`,
        borderWidth: `var(--button-${button.type}-border-width)`,
        borderRadius: `var(--button-${button.type}-border-radius)`,
        borderColor: `var(--button-${button.type}-border-color)`,
        fontFamily: `var(--button-${button.type}-font-family)`,
        fontSize: `var(--button-${button.type}-font-size)`,
        fontWeight: `var(--button-${button.type}-font-weight)`,
        lineHeight: `var(--button-${button.type}-line-height)`,
        letterSpacing: `var(--button-${button.type}-letter-spacing)`,
        textAlign: `var(--button-${button.type}-text-align)`,
        textDecoration: `var(--button-${button.type}-text-decoration)`,
        textTransform: `var(--button-${button.type}-text-transform)`,
        boxShadow: `var(--button-${button.type}-box-shadow)`,
        opacity: `var(--button-${button.type}-opacity)`,
        $hover: {
        }
      };
      plugins.push({
        [`.btn-${button.type}`]: rendered,
      });
    });
  return plugins;
};
