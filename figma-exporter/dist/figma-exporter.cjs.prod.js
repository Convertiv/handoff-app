'use strict';

require('dotenv/config');
var path = require('path');
var fs = require('fs-extra');
var stream = require('node:stream');
var documentationObject = require('./documentation-object-de961ef3.cjs.prod.js');
var _ = require('lodash');
var Mustache = require('mustache');
var nodeHtmlParser = require('node-html-parser');
var webpack = require('webpack');
var chalk = require('chalk');
var archiver = require('archiver');
var sortedUniq = require('lodash/sortedUniq');
require('lodash/isEqual');
require('axios');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var path__default = /*#__PURE__*/_interopDefault(path);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var stream__namespace = /*#__PURE__*/_interopNamespace(stream);
var Mustache__default = /*#__PURE__*/_interopDefault(Mustache);
var webpack__default = /*#__PURE__*/_interopDefault(webpack);
var chalk__default = /*#__PURE__*/_interopDefault(chalk);
var archiver__default = /*#__PURE__*/_interopDefault(archiver);
var sortedUniq__default = /*#__PURE__*/_interopDefault(sortedUniq);

function transformColorTypes(colors) {
  const stringBuilder = [];
  stringBuilder.push(`$color-groups: ( ${Array.from(new Set(colors.map(color => `"${color.group}"`))).join(', ')} );`);
  stringBuilder.push(`$color-names: ( ${colors.map(color => `"${color.group}-${color.machineName}"`).join(', ')} );`);
  stringBuilder.push(``);
  return stringBuilder.join('\n');
}
function transformColors$1(colors) {
  const stringBuilder = [];
  colors.forEach(color => {
    stringBuilder.push(`$color-${color.group}-${color.machineName}: ${color.value};`);
  });
  return stringBuilder.join('\n');
}

function transformEffectTypes(effects) {
  const stringBuilder = [];
  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);
  if (validEffects) {
    stringBuilder.push(`$effects: ( ${validEffects.map(effect => `"${effect.group}-${effect.machineName}"`).join(', ')} );`);
    stringBuilder.push(``);
  }
  return stringBuilder.join('\n');
}
function transformEffects$1(effects) {
  const stringBuilder = [];
  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);
  if (validEffects) {
    validEffects.forEach(effect => {
      stringBuilder.push(`$effect-${effect.group}-${effect.machineName}: ${effect.effects.map(effect => effect.value).join(', ') || 'none'};`);
    });
  }
  return stringBuilder.join('\n');
}

function transformTypographyTypes(typography) {
  const stringBuilder = [];
  stringBuilder.push(`$type-sizes: ( ${typography.map(type => `"${getTypeName$1(type)}"`).join(', ')} );`);
  return stringBuilder.join('\n');
}
function transformTypography$1(typography) {
  const stringBuilder = [];
  typography.forEach(type => {
    stringBuilder.push([`$typography-${getTypeName$1(type)}-font-family: '${type.values.fontFamily}';`, `$typography-${getTypeName$1(type)}-font-size: ${type.values.fontSize}px;`, `$typography-${getTypeName$1(type)}-font-weight: ${type.values.fontWeight};`, `$typography-${getTypeName$1(type)}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`, `$typography-${getTypeName$1(type)}-letter-spacing: ${type.values.letterSpacing}px;`, `$typography-${getTypeName$1(type)}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`].join('\n'));
  });
  return stringBuilder.join('\n');
}
function getTypeName$1(type) {
  return type.group ? `${type.group}-${type.machine_name}` : `${type.machine_name}`;
}

const transformFigmaTextAlignToCss = textAlign => {
  return ['left', 'center', 'right', 'justify'].includes(textAlign.toLowerCase()) ? textAlign.toLowerCase() : 'left';
};
const transformFigmaTextDecorationToCss = textDecoration => {
  if (textDecoration === 'UNDERLINE') {
    return 'underline';
  }
  if (textDecoration === 'STRIKETHROUGH') {
    return 'line-through';
  }
  return 'none';
};
const transformFigmaTextCaseToCssTextTransform = textCase => {
  if (textCase === 'UPPER') {
    return 'uppercase';
  }
  if (textCase === 'LOWER') {
    return 'lowercase';
  }
  if (textCase === 'TITLE') {
    return 'capitalize';
  }
  return 'none';
};
const getTypesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.type).filter(documentationObject.filterOutUndefined)));
};
const getStatesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.state).filter(documentationObject.filterOutUndefined)));
};
const getThemesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.theme).filter(documentationObject.filterOutUndefined)));
};
const getSizesFromComponents = components => {
  return Array.from(new Set(components.map(component => component.size).filter(documentationObject.filterOutUndefined)));
};

/**
 * Get Config
 * @returns Config
 */
const getFetchConfig = () => {
  let config;
  try {
    config = require(path__default["default"].resolve(__dirname, '../../client-config'));
  } catch (e) {
    config = {};
  }

  // Check to see if there is a config in the root of the project
  const parsed = {
    ...config
  };
  return parsed;
};

/**
 * Map a component size to the right name
 * @param figma
 * @returns
 */
const mapComponentSize = (figma, component) => {
  const config = getFetchConfig();
  if (component) {
    if (config.figma.components[component]?.size) {
      const componentMap = config.components[component]?.size;
      const componentSize = componentMap.find(size => size.figma === figma);
      if (componentSize && componentSize?.css) {
        return componentSize?.css;
      }
    }
  }
  const coreMap = config.figma.size;
  const size = coreMap.find(size => size.figma === figma);
  return size?.css ?? figma;
};

const transformComponentsToScssTypes = (name, components) => {
  const lines = [];
  const themes = getThemesFromComponents(components);
  const types = getTypesFromComponents(components);
  const states = getStatesFromComponents(components);
  const sizes = getSizesFromComponents(components);

  // Types
  if (types && types.length > 0) {
    lines.push(`$${name}-variants: ( ${types.map(type => `"${type}"`).join(', ')});`);
  }

  // Sizes
  if (sizes && sizes.length > 0) {
    lines.push(`$${name}-sizes: ( ${sizes.map(type => `"${mapComponentSize(type, name)}"`).join(', ')} );`);
  }

  // Themes
  if (themes && themes.length > 0) {
    lines.push(`$${name}-themes: ( ${themes.map(type => `"${type}"`).join(', ')} );`);
  }

  // States
  if (states && states.length > 0) {
    lines.push(`$${name}-states: ( ${states.map(type => `"${type == 'default' ? '' : type}"`).join(', ')} );`);
  }
  return lines.join('\n\n') + '\n';
};
const transformComponentTokensToScssVariables = tokens => {
  let result = {};
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.activity ?? tokens.state : undefined;
  const type = tokens.componentType === 'design' ? state && state === tokens.activity ? tokens.state : tokens.type : tokens.layout ?? mapComponentSize(tokens.size ?? '', tokens.name);
  for (const partId in tokens.parts) {
    const tokenSets = tokens.parts[partId];
    if (!tokenSets || tokenSets.length === 0) {
      continue;
    }
    for (const tokenSet of tokenSets) {
      const transformer = getTokenSetTransformer$1(tokenSet);
      if (!transformer) {
        continue;
      }
      result = {
        ...result,
        ...transformer(tokens.name, partId === '$' ? '' : partId.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), tokenSet, {
          theme,
          type,
          state
        })
      };
    }
  }
  return result;
};
const getTokenSetTransformer$1 = tokenSet => {
  switch (tokenSet.name) {
    case 'BACKGROUND':
      return transformBackgroundTokenSet$1;
    case 'SPACING':
      return transformSpacingTokenSet$1;
    case 'BORDER':
      return transformBorderTokenSet$1;
    case 'TYPOGRAPHY':
      return transformTypographyTokenSet$1;
    case 'FILL':
      return transformFillTokenSet$1;
    case 'EFFECT':
      return transformEffectTokenSet$1;
    case 'OPACITY':
      return transformOpacityTokenSet$1;
    case 'SIZE':
      return transformSizeTokenSet$1;
    default:
      return undefined;
  }
};
const transformBackgroundTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'BACKGROUND' ? {
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'background',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokenSet.background).color,
      property: 'background',
      group: part
    }
  } : {};
};
const transformSpacingTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'SPACING' ? {
    // Padding
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-y',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.TOP}px`,
      property: 'padding-y',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-x',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.LEFT}px`,
      property: 'padding-x',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-top',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.TOP}px`,
      property: 'padding-top',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-right',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.RIGHT}px`,
      property: 'padding-right',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-bottom',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.BOTTOM}px`,
      property: 'padding-bottom',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-left',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.LEFT}px`,
      property: 'padding-left',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-start',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.LEFT}px`,
      property: 'padding-start',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'padding-end',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.RIGHT}px`,
      property: 'padding-end',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'spacing',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.spacing}px`,
      property: 'spacing',
      group: part
    }
  } : {};
};
const transformBorderTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'BORDER' ? {
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'border-width',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.weight}px`,
      property: 'border-width',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'border-radius',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.radius}px`,
      property: 'border-radius',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'border-color',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokenSet.strokes).color,
      property: 'border-color',
      group: part
    }
  } : {};
};
const transformTypographyTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'TYPOGRAPHY' ? {
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'font-family',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `'${tokenSet.fontFamily}'`,
      property: 'font-family',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'font-size',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.fontSize}px`,
      property: 'font-size',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'font-weight',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.fontWeight}`,
      property: 'font-weight',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'line-height',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.lineHeight}`,
      property: 'line-height',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'letter-spacing',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.letterSpacing}px`,
      property: 'letter-spacing',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'text-align',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
      property: 'text-align',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'text-decoration',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: transformFigmaTextDecorationToCss(tokenSet.textDecoration),
      property: 'text-decoration',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'text-transform',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: transformFigmaTextCaseToCssTextTransform(tokenSet.textCase),
      property: 'text-transform',
      group: part
    }
  } : {};
};
const transformFillTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'FILL' ? {
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'color',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokenSet.color).color,
      property: 'color',
      group: part
    }
  } : {};
};
const transformEffectTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'EFFECT' ? {
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'box-shadow',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: tokenSet.effect.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'color',
      group: part
    }
  } : {};
};
const transformOpacityTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'OPACITY' ? {
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'opacity',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.opacity}`,
      property: 'opacity',
      group: part
    }
  } : {};
};
const transformSizeTokenSet$1 = (component, part, tokenSet, params) => {
  return tokenSet.name === 'SIZE' ? {
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'width',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.width ?? '0'}px`,
      property: 'width',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'width-raw',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.width ?? '0'}`,
      property: 'width-raw',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'height',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.height ?? '0'}px`,
      property: 'height',
      group: part
    },
    [documentationObject.getScssVariableName({
      component,
      part,
      property: 'height-raw',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.height ?? '0'}`,
      property: 'height-raw',
      group: part
    }
  } : {};
};

/**
 * Generate a comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
const componentCodeBlockComment = (type, component, format) => {
  let str = type;
  if (component.componentType === 'design') {
    str = component.type !== undefined ? `${_.capitalize(component.type)} ${str}` : `${_.capitalize(str)}`;
    str += component.theme !== undefined ? `, theme: ${component.theme}` : ``;
    str += component.state !== undefined ? `, state: ${component.state}` : ``;
    str += component.activity !== undefined ? `, activity: ${component.activity}` : ``;
  }
  if (component.componentType === 'layout') {
    str = `${_.capitalize(str)}`;
    str += component.layout !== undefined ? `, layout: ${component.layout}` : ``;
    str += component.size !== undefined ? `, size: ${component.size}` : ``;
  }
  return format === "/**/" ? `/* ${str} */` : `// ${str}`;
};

/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
function scssTypesTransformer(documentationObject) {
  const components = {};
  for (const componentName in documentationObject.components) {
    components[componentName] = transformComponentsToScssTypes(componentName, documentationObject.components[componentName]);
  }
  const design = {
    colors: transformColorTypes(documentationObject.design.color),
    effects: transformEffectTypes(documentationObject.design.effect),
    typography: transformTypographyTypes(documentationObject.design.typography)
  };
  return {
    components,
    design
  };
}

/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
function scssTransformer(documentationObject) {
  const components = {};
  for (const componentName in documentationObject.components) {
    components[componentName] = documentationObject.components[componentName].map(component => [componentCodeBlockComment(componentName, component, '//'), Object.entries(transformComponentTokensToScssVariables(component)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')].join('\n')).join('\n\n');
  }
  const design = {
    colors: transformColors$1(documentationObject.design.color),
    typography: transformTypography$1(documentationObject.design.typography),
    effects: transformEffects$1(documentationObject.design.effect)
  };
  return {
    components,
    design
  };
}

/**
 * Get the component template
 * @param component
 * @param parts
 * @returns
 */
const getComponentTemplate = async (component, ...parts) => {
  const componentFallbackPath = path__default["default"].resolve(__dirname, `../../templates/${component}/default.html`);
  if (!parts.length) {
    if (await fs__namespace["default"].pathExists(componentFallbackPath)) {
      return await fs__namespace["default"].readFile(componentFallbackPath, 'utf8');
    }
    return null;
  }
  const partsTemplatePath = path__default["default"].resolve(__dirname, `../../templates/${component}/${parts.join('/')}.html`);
  if (await fs__namespace["default"].pathExists(partsTemplatePath)) {
    return await fs__namespace["default"].readFile(partsTemplatePath, 'utf8');
  }
  return await getComponentTemplate(component, ...parts.slice(0, -1));
};

function mergeTokenSets(list) {
  const obj = {};
  list.forEach(item => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'name') {
        obj[key] = value;
      }
    });
  });
  return obj;
}
const getComponentTemplateByKey = async (componentKey, component) => {
  const parts = component.componentType === 'design' ? [...(component.type ? [component.type] : []), ...(component.state ? [component.state] : []), ...(component.activity ? [component.activity] : [])] : [...(component.size ? [component.size] : []), ...(component.layout ? [component.layout] : [])];
  return await getComponentTemplate(componentKey, ...parts);
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async (componentKey, component) => {
  const template = await getComponentTemplateByKey(componentKey, component);
  if (!template) {
    return null;
  }
  const parts = {};
  if (component.parts) {
    Object.keys(component.parts).forEach(part => {
      parts[part] = mergeTokenSets(component.parts[part]);
    });
  }
  const renderableComponent = {
    ...component,
    parts
  };
  const preview = Mustache__default["default"].render(template, renderableComponent);
  const bodyEl = nodeHtmlParser.parse(preview).querySelector('body');
  return {
    id: component.id,
    preview,
    code: bodyEl ? bodyEl.innerHTML.trim() : preview
  };
};

/**
 * Transforms the documentation object components into a preview and code
 */
async function previewTransformer(documentationObject$1) {
  const {
    components
  } = documentationObject$1;
  const componentKeys = Object.keys(components);
  const result = await Promise.all(componentKeys.map(async componentKey => {
    return [componentKey, await Promise.all(documentationObject$1.components[componentKey].map(component => transformComponentTokens(componentKey, component))).then(res => res.filter(documentationObject.filterOutNull))];
  }));
  return {
    components: result.reduce((obj, el) => {
      obj[el[0]] = el[1];
      return obj;
    }, {})
  };
}

const buildClientFiles = async () => {
  return new Promise((resolve, reject) => {
    const compile = webpack__default["default"]({
      mode: 'production',
      entry: path__default["default"].resolve(__dirname, '../../templates/main.js'),
      resolve: {
        modules: [path__default["default"].resolve(__dirname, '../..'), path__default["default"].resolve(__dirname, '../../..'), path__default["default"].resolve(__dirname, '../../node_modules'), path__default["default"].resolve(__dirname, '../../../../node_modules')]
      },
      output: {
        path: path__default["default"].resolve(__dirname, '../../public/components'),
        filename: 'bundle.js'
      },
      module: {
        rules: [{
          test: /\.s[ac]ss$/i,
          use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader']
        }]
      }
    });
    compile.run((err, stats) => {
      if (err) {
        let error = "Errors encountered trying to build preview styles.\n";
        if (process.argv.indexOf('--debug') > 0) {
          error += err.stack || err;
        }
        return reject(error);
      }
      if (stats) {
        if (stats.hasErrors()) {
          let buildErrors = stats.compilation.errors?.map(err => err.message);
          let error = "Errors encountered trying to build preview styles.\n";
          if (process.argv.indexOf('--debug') > 0) {
            error += buildErrors;
          }
          return reject(error);
        }
        if (stats.hasWarnings()) {
          let buildWarnings = stats.compilation.warnings?.map(err => err.message);
          let error = "Warnings encountered when building preview styles.\n";
          if (process.argv.indexOf('--debug') > 0) {
            error += buildWarnings;
            console.error(chalk__default["default"].yellow(error));
          }
        }
      }
      return resolve("Preview template styles built");
    });
  });
};

/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
const transformComponentsToCssVariables = components => {
  const lines = [];
  const componentName = components[0].name;
  const componentCssClass = components[0].rootCssClass ?? componentName;
  lines.push(`.${componentCssClass} {`);
  const cssVars = components.map(tokens => `\t${componentCodeBlockComment(componentName, tokens, '/**/')}\n${Object.entries(transformComponentTokensToCssVariables(componentName, tokens)).map(([variable, value]) => `\t${variable}: ${value.value};`).join('\n')}`);
  return lines.concat(cssVars).join('\n\n') + '\n}\n';
};

/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
const transformComponentTokensToCssVariables = (componentName, tokens) => {
  let result = {};
  const theme = tokens.componentType === 'design' ? tokens.theme : undefined;
  const state = tokens.componentType === 'design' ? tokens.activity ?? tokens.state : undefined;
  const type = tokens.componentType === 'design' ? state && state === tokens.activity ? tokens.state : tokens.type : tokens.layout ?? mapComponentSize(tokens.size ?? '', tokens.name);
  for (const partId in tokens.parts) {
    const tokenSets = tokens.parts[partId];
    if (!tokenSets || tokenSets.length === 0) {
      continue;
    }
    for (const tokenSet of tokenSets) {
      const transformer = getTokenSetTransformer(tokenSet);
      if (!transformer) {
        continue;
      }
      result = {
        ...result,
        ...transformer(componentName, partId === '$' ? '' : partId.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), tokenSet, {
          theme,
          type,
          state
        })
      };
    }
  }
  return result;
};
const getTokenSetTransformer = tokenSet => {
  switch (tokenSet.name) {
    case 'BACKGROUND':
      return transformBackgroundTokenSet;
    case 'SPACING':
      return transformSpacingTokenSet;
    case 'BORDER':
      return transformBorderTokenSet;
    case 'TYPOGRAPHY':
      return transformTypographyTokenSet;
    case 'FILL':
      return transformFillTokenSet;
    case 'EFFECT':
      return transformEffectTokenSet;
    case 'OPACITY':
      return transformOpacityTokenSet;
    case 'SIZE':
      return transformSizeTokenSet;
    default:
      return undefined;
  }
};
const transformBackgroundTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'BACKGROUND' ? {
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'background',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokenSet.background).color,
      property: 'background'
    }
  } : {};
};
const transformSpacingTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'SPACING' ? {
    // Padding
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-y',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.TOP}px`,
      property: 'vertical padding'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-x',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.LEFT}px`,
      property: 'horizontal padding'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-top',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.TOP}px`,
      property: 'padding-top'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-right',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.RIGHT}px`,
      property: 'padding-right'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-bottom',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.BOTTOM}px`,
      property: 'padding-bottom'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-left',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.LEFT}px`,
      property: 'padding-left'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-start',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.LEFT}px`,
      property: 'padding-start'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'padding-end',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.padding.RIGHT}px`,
      property: 'padding-end'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'spacing',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.spacing}px`,
      property: 'spacing'
    }
  } : {};
};
const transformBorderTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'BORDER' ? {
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'border-width',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.weight}px`,
      property: 'border-width'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'border-radius',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.radius}px`,
      property: 'border-radius'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'border-color',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokenSet.strokes).color,
      property: 'border-color'
    }
  } : {};
};
const transformTypographyTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'TYPOGRAPHY' ? {
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'font-family',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `'${tokenSet.fontFamily}'`,
      property: 'font-family'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'font-size',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.fontSize}px`,
      property: 'font-size'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'font-weight',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.fontWeight}`,
      property: 'font-weight'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'line-height',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.lineHeight}`,
      property: 'line-height'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'letter-spacing',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.letterSpacing}px`,
      property: 'letter-spacing'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'text-align',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
      property: 'text-align'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'text-decoration',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaTextDecorationToCss(tokenSet.textDecoration),
      property: 'text-decoration'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'text-transform',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaTextCaseToCssTextTransform(tokenSet.textCase),
      property: 'text-transform'
    }
  } : {};
};
const transformFillTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'FILL' ? {
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'color',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: documentationObject.transformFigmaFillsToCssColor(tokenSet.color).color,
      property: 'color'
    }
  } : {};
};
const transformEffectTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'EFFECT' ? {
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'box-shadow',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: tokenSet.effect.map(documentationObject.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
      property: 'color'
    }
  } : {};
};
const transformOpacityTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'OPACITY' ? {
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'opacity',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.opacity}`,
      property: 'opacity'
    }
  } : {};
};
const transformSizeTokenSet = (component, part, tokenSet, params) => {
  return tokenSet.name === 'SIZE' ? {
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'width',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.width ?? '0'}px`,
      property: 'width'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'width-raw',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.width ?? '0'}`,
      property: 'width-raw'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'height',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.height ?? '0'}px`,
      property: 'height'
    },
    [documentationObject.getCssVariableName({
      component,
      part,
      property: 'height-raw',
      theme: params.theme,
      type: params.type,
      state: params.state
    })]: {
      value: `${tokenSet.height ?? '0'}`,
      property: 'height-raw'
    }
  } : {};
};

function transformColors(colors) {
  const stringBuilder = [];
  colors.forEach(color => {
    stringBuilder.push(`--color-${color.group}-${color.machineName}: ${color.value};`);
  });
  return stringBuilder.join('\n');
}

/**
 * Build effects CSS var list
 * @param effects 
 * @returns 
 */
function transformEffects(effects) {
  const stringBuilder = [];
  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);
  if (validEffects) {
    validEffects.forEach(effect => {
      stringBuilder.push(`--effect-${effect.group}-${effect.machineName}: ${effect.effects.map(effect => effect.value).join(', ') || 'none'};`);
    });
  }
  return stringBuilder.join('\n');
}

function transformTypography(typography) {
  const stringBuilder = [];
  typography.forEach(type => {
    stringBuilder.push([`--typography-${getTypeName(type)}-font-family: '${type.values.fontFamily}';`, `--typography-${getTypeName(type)}-font-size: ${type.values.fontSize}px;`, `--typography-${getTypeName(type)}-font-weight: ${type.values.fontWeight};`, `--typography-${getTypeName(type)}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`, `--typography-${getTypeName(type)}-letter-spacing: ${type.values.letterSpacing}px;`, `--typography-${getTypeName(type)}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`].join('\n'));
  });
  return stringBuilder.join('\n');
}
function getTypeName(type) {
  return type.group ? `${type.group}-${type.machine_name}` : `${type.machine_name}`;
}

function cssTransformer(documentationObject) {
  const components = {};
  for (const componentName in documentationObject.components) {
    components[componentName] = transformComponentsToCssVariables(documentationObject.components[componentName]);
  }
  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect)
  };
  return {
    components,
    design
  };
}

/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
async function fontTransformer(documentationObject) {
  const {
    design
  } = documentationObject;
  const outputFolder = 'public';
  const fontLocation = path__default["default"].join(outputFolder, 'fonts');
  const families = design.typography.reduce((result, current) => {
    return {
      ...result,
      [current.values.fontFamily]: result[current.values.fontFamily] ?
      // sorts and returns unique font weights
      sortedUniq__default["default"]([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b)) : [current.values.fontWeight]
    };
  }, {});
  const customFonts = [];
  Object.keys(families).map(async key => {
    //
    const name = key.replace(/\s/g, '');
    const fontDirName = path__default["default"].join(fontLocation, name);
    if (fs__namespace["default"].existsSync(fontDirName)) {
      console.log(chalk__default["default"].green(`Found a custom font ${name}`));
      // Ok, we've found a custom font at this location
      // Zip the font up and put the zip in the font location
      const stream = fs__namespace["default"].createWriteStream(path__default["default"].join(fontLocation, `${name}.zip`));
      await zipFonts(fontDirName, stream);
      customFonts.push(`${name}.zip`);
    }
  });
  return customFonts;
}

/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
const zipFonts = async (dirPath, destination) => {
  const archive = archiver__default["default"]('zip', {
    zlib: {
      level: 9
    } // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });
  archive.pipe(destination);
  const fontDir = await fs__namespace["default"].readdir(dirPath);
  for (const file of fontDir) {
    const data = fs__namespace["default"].readFileSync(path__default["default"].join(dirPath, file), 'utf-8');
    archive.append(data, {
      name: path__default["default"].basename(file)
    });
  }
  await archive.finalize();
  return destination;
};

/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
const getPathToIntegration = () => {
  const integrationFolder = 'integrations';
  const defaultIntegration = 'bootstrap';
  const defaultVersion = '5.2';
  const defaultPath = path__default["default"].resolve(path__default["default"].join(__dirname, '../..', integrationFolder, defaultIntegration, defaultVersion));
  const config = getFetchConfig();
  if (config.integration) {
    if (config.integration.name === 'custom') {
      // Look for a custom integration
      const customPath = path__default["default"].resolve(path__default["default"].join(__dirname, '../..', integrationFolder));
      if (!fs__namespace["default"].existsSync(customPath)) {
        throw Error(`The config is set to use a custom integration but no custom integration found at integrations/custom`);
      }
      return customPath;
    }
    const searchPath = path__default["default"].resolve(path__default["default"].join(__dirname, '../..', integrationFolder, config.integration.name, config.integration.version));
    if (!fs__namespace["default"].existsSync(searchPath)) {
      throw Error(`The requested integration was ${config.integration.name} version ${config.integration.version} but no integration plugin with that name was found`);
    }
    return searchPath;
  }
  return defaultPath;
};

/**
 * Get the name of the current integration
 * @returns string
 */
const getIntegrationName = () => {
  const config = getFetchConfig();
  const defaultIntegration = 'bootstrap';
  if (config.integration) {
    if (config.integration.name) {
      return config.integration.name;
    }
  }
  return defaultIntegration;
};

/**
 * Find the integration to sync and sync the sass files and template files.
 */
async function integrationTransformer() {
  const outputFolder = path__default["default"].join('public');
  const integrationPath = getPathToIntegration();
  const integrationName = getIntegrationName();
  const sassFolder = `exported/${integrationName}-tokens`;
  const templatesFolder = path__default["default"].resolve(__dirname, '../../templates');
  const integrationsSass = path__default["default"].resolve(integrationPath, 'sass');
  const integrationTemplates = path__default["default"].resolve(integrationPath, 'templates');
  fs__namespace["default"].copySync(integrationsSass, sassFolder);
  fs__namespace["default"].copySync(integrationTemplates, templatesFolder);
  const stream = fs__namespace["default"].createWriteStream(path__default["default"].join(outputFolder, `tokens.zip`));
  await zipTokens('exported', stream);
}

/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
const zipTokens = async (dirPath, destination) => {
  let archive = archiver__default["default"]('zip', {
    zlib: {
      level: 9
    } // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });
  archive.pipe(destination);
  const directory = await fs__namespace["default"].readdir(dirPath);
  archive = await addFileToZip(directory, dirPath, archive);
  await archive.finalize();
  return destination;
};

/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
const addFileToZip = async (directory, dirPath, archive) => {
  for (const file of directory) {
    const pathFile = path__default["default"].join(dirPath, file);
    if (fs__namespace["default"].lstatSync(pathFile).isDirectory()) {
      const recurse = await fs__namespace["default"].readdir(pathFile);
      archive = await addFileToZip(recurse, pathFile, archive);
    } else {
      const data = fs__namespace["default"].readFileSync(pathFile, 'utf-8');
      archive.append(data, {
        name: pathFile
      });
    }
  }
  return archive;
};

const outputFolder = process.env.OUTPUT_DIR || 'exported';
const exportablesFolder = process.env.OUTPUT_DIR || 'exportables';
const tokensFilePath = path__default["default"].join(outputFolder, 'tokens.json');
const previewFilePath = path__default["default"].join(outputFolder, 'preview.json');
const changelogFilePath = path__default["default"].join(outputFolder, 'changelog.json');
const variablesFilePath = path__default["default"].join(outputFolder, 'tokens');
const iconsZipFilePath = path__default["default"].join(outputFolder, 'icons.zip');
const logosZipFilePath = path__default["default"].join(outputFolder, 'logos.zip');

/**
 * Read Previous Json File
 * @param path
 * @returns
 */
const readPrevJSONFile = async path => {
  try {
    return await fs__namespace.readJSON(path);
  } catch (e) {
    return undefined;
  }
};
const getExportables = async () => {
  try {
    const indexBuffer = await fs__namespace.readFile(path__default["default"].join(exportablesFolder, 'index.json'));
    const index = JSON.parse(indexBuffer.toString());
    const definitions = index.definitions;
    if (!definitions || definitions.length === 0) {
      return [];
    }
    const exportables = definitions.map(def => {
      const defPath = path__default["default"].join(exportablesFolder, `${def}.json`);
      if (!fs__namespace.existsSync(defPath)) {
        return null;
      }
      const defBuffer = fs__namespace.readFileSync(defPath);
      return JSON.parse(defBuffer.toString());
    }).filter(documentationObject.filterOutNull);
    return exportables ? exportables : [];
  } catch (e) {
    return [];
  }
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildCustomFonts = async documentationObject => {
  return await fontTransformer(documentationObject);
};

/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
const buildIntegration = async documentationObject => {
  return await integrationTransformer();
};
/**
 * Run just the preview
 * @param documentationObject
 */
const buildPreview = async documentationObject => {
  if (Object.keys(documentationObject.components).filter(name => documentationObject.components[name].length > 0).length > 0) {
    await Promise.all([previewTransformer(documentationObject).then(out => fs__namespace.writeJSON(previewFilePath, out, {
      spaces: 2
    }))]);
    await buildClientFiles().then(value => chalk__default["default"].green(console.log(value))).catch(error => {
      throw new Error(error);
    });
  } else {
    console.log(chalk__default["default"].red('Skipping preview generation'));
  }
};

/**
 * Build only the styles pipeline
 * @param documentationObject
 */
const buildStyles = async documentationObject => {
  const typeFiles = scssTypesTransformer(documentationObject);
  const cssFiles = cssTransformer(documentationObject);
  const scssFiles = scssTransformer(documentationObject);
  await Promise.all([fs__namespace.ensureDir(variablesFilePath).then(() => fs__namespace.ensureDir(`${variablesFilePath}/types`)).then(() => fs__namespace.ensureDir(`${variablesFilePath}/css`)).then(() => fs__namespace.ensureDir(`${variablesFilePath}/sass`)).then(() => Promise.all(Object.entries(typeFiles.components).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/types/${name}.scss`, content)))).then(() => Promise.all(Object.entries(typeFiles.design).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/types/${name}.scss`, content)))).then(() => Promise.all(Object.entries(cssFiles.components).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/css/${name}.css`, content)))).then(() => Promise.all(Object.entries(cssFiles.design).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/css/${name}.css`, content)))).then(() => Promise.all(Object.entries(scssFiles.components).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/sass/${name}.scss`, content)))).then(() => Promise.all(Object.entries(scssFiles.design).map(([name, content]) => fs__namespace.writeFile(`${variablesFilePath}/sass/${name}.scss`, content))))]);
};
/**
 * Run the entire pipeline
 */
const entirePipeline = async () => {
  const DEV_ACCESS_TOKEN = process.env.DEV_ACCESS_TOKEN;
  const FIGMA_PROJECT_ID = process.env.FIGMA_PROJECT_ID;

  // TODO: rename to something more meaningful
  if (!DEV_ACCESS_TOKEN) {
    throw new Error('Missing "DEV_ACCESS_TOKEN" env variable.');
  }

  // TODO: rename to something more meaningful
  if (!FIGMA_PROJECT_ID) {
    throw new Error('Missing "FIGMA_PROJECT_ID" env variable.');
  }
  let prevDocumentationObject = await readPrevJSONFile(tokensFilePath);
  let changelog = (await readPrevJSONFile(changelogFilePath)) || [];
  await fs__namespace.emptyDir(outputFolder);
  const exportables = await getExportables();
  const documentationObject$1 = await documentationObject.createDocumentationObject(FIGMA_PROJECT_ID, DEV_ACCESS_TOKEN, exportables);
  const changelogRecord = documentationObject.generateChangelogRecord(prevDocumentationObject, documentationObject$1);
  if (changelogRecord) {
    changelog = [changelogRecord, ...changelog];
  }
  await Promise.all([fs__namespace.writeJSON(tokensFilePath, documentationObject$1, {
    spaces: 2
  }), fs__namespace.writeJSON(changelogFilePath, changelog, {
    spaces: 2
  }), ...(!process.env.CREATE_ASSETS_ZIP_FILES || process.env.CREATE_ASSETS_ZIP_FILES !== 'false' ? [documentationObject.zipAssets(documentationObject$1.assets.icons, fs__namespace.createWriteStream(iconsZipFilePath)).then(writeStream => stream__namespace.promises.finished(writeStream)), documentationObject.zipAssets(documentationObject$1.assets.logos, fs__namespace.createWriteStream(logosZipFilePath)).then(writeStream => stream__namespace.promises.finished(writeStream))] : [])]);
  await buildCustomFonts(documentationObject$1);
  await buildStyles(documentationObject$1);
  await buildIntegration();
  await buildPreview(documentationObject$1);
  console.log(chalk__default["default"].green(`Figma pipeline complete:`, `${documentationObject.getRequestCount()} requests`));
};

// Check to see what options have been passed and
(async function () {
  try {
    if (process.argv.length === 2 || process.argv.length === 3 && process.argv.indexOf('--debug') > 0) {
      await entirePipeline();
    }
    if (process.argv.length === 3) {
      if (process.argv.indexOf('preview') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildPreview(documentationObject);
          await buildIntegration(documentationObject);
        } else {
          throw Error('Cannot run preview only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('integration') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildStyles(documentationObject);
          await buildPreview(documentationObject);
          await buildIntegration(documentationObject);
        } else {
          throw Error('Cannot run preview only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('styles') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildStyles(documentationObject);
        } else {
          throw Error('Cannot run styles only because tokens do not exist. Run the fetch first.');
        }
      } else if (process.argv.indexOf('fonts') > 0) {
        let documentationObject = await readPrevJSONFile(tokensFilePath);
        if (documentationObject) {
          await buildCustomFonts(documentationObject);
        } else {
          throw Error('Cannot run styles only because tokens do not exist. Run the fetch first.');
        }
      }
    }
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    console.error(chalk__default["default"].red(message));
    if (process.argv.indexOf('--debug') > 0) {
      throw error;
    } else {
      console.log(chalk__default["default"].red('The fetch pipeline was halted because of an error. \n - To debug this error, rerun it with `-- --debug`'));
    }
  }
})();
