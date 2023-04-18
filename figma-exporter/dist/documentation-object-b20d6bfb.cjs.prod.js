'use strict';

var isEqual = require('lodash/isEqual');
var axios = require('axios');
var archiver = require('archiver');
var chalk = require('chalk');
var uniq = require('lodash/uniq');
var lodash = require('lodash');
var path = require('path');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

var isEqual__default = /*#__PURE__*/_interopDefault(isEqual);
var axios__default = /*#__PURE__*/_interopDefault(axios);
var archiver__default = /*#__PURE__*/_interopDefault(archiver);
var chalk__default = /*#__PURE__*/_interopDefault(chalk);
var uniq__default = /*#__PURE__*/_interopDefault(uniq);
var path__default = /*#__PURE__*/_interopDefault(path);

const figmaRestApi = axios__default["default"].create({
  baseURL: process.env.FIGMA_BASE_URL || 'https://api.figma.com/v1/'
});
let counter = 0;
/**
 * Fetch the frontend components
 * @param fileId
 * @param accessToken
 * @returns Promise<FileComponentsResponse>
 */
const getFileComponent = (fileId, accessToken) => {
  counter++;
  return figmaRestApi.get('files/' + fileId + '/components', {
    headers: {
      'X-Figma-Token': accessToken
    }
  });
};
const getFileNodes = (fileId, ids, accessToken) => {
  counter++;
  return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
    headers: {
      'X-Figma-Token': accessToken
    }
  });
};
const getAssetURL = (fileId, ids, extension, accessToken) => {
  counter++;
  return figmaRestApi.get('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
    headers: {
      'X-Figma-Token': accessToken
    }
  });
};
const getFileStyles = (fileId, accessToken) => {
  counter++;
  return figmaRestApi.get('files/' + fileId + '/styles', {
    headers: {
      'X-Figma-Token': accessToken
    }
  });
};
const getComponentSets = (fileId, accessToken) => {
  counter++;
  return figmaRestApi.get('files/' + fileId + '/component_sets', {
    headers: {
      'X-Figma-Token': accessToken
    }
  });
};
const getComponentSetNodes = (fileId, ids, accessToken) => {
  counter++;
  return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
    headers: {
      'X-Figma-Token': accessToken
    }
  });
};
const getRequestCount = () => counter;

/**
 * Generate slug from string
 * @param str
 * @returns
 */
const slugify = str => str.toLowerCase().trim().replace(/[^\w\s-]/g, '-').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

/**
 *  Filters out null values
 * @param value
 * @returns
 */
const filterOutNull = value => value !== null;

/**
 * Filters out undefined vars
 * @param value
 * @returns
 */
const filterOutUndefined = value => value !== undefined;

const defaultExtension = 'svg';
const assetsExporter = async (fileId, accessToken, component) => {
  try {
    const parent_response = await getFileComponent(fileId, accessToken);
    const asset_components = Object.entries(parent_response.data.meta.components).filter(([_, value]) => value.containing_frame.name?.indexOf(component) > -1).map(([key, value]) => {
      return {
        id: key,
        description: value.description,
        key: value.key,
        name: value.name
      };
    });
    const numOfAssets = asset_components.length;
    console.log(chalk__default["default"].green(`${component} exported:`), numOfAssets);
    if (!numOfAssets) {
      return [];
    }
    const assetsUrlsRes = await getAssetURL(fileId, Object.entries(parent_response.data.meta.components).filter(([_, value]) => value.containing_frame.name?.indexOf(component) > -1).sort(([a_key, a_val], [b_key, b_val]) => {
      // Fetch node ids
      const a_parts = a_val.node_id.split(':');
      const b_parts = b_val.node_id.split(':');
      let a_sort = 0,
        b_sort = 0;
      if (a_parts[1]) {
        a_sort = parseInt(a_parts[0]) + parseInt(a_parts[1]);
      }
      if (b_parts[1]) {
        b_sort = parseInt(b_parts[0]) + parseInt(b_parts[1]);
      }
      return a_sort - b_sort;
    }).map(([key, _]) => _.node_id), defaultExtension, accessToken);
    const assetsList = await Promise.all(Object.entries(assetsUrlsRes.data.images).map(async ([assetId, assetUrl]) => {
      const componentData = parent_response.data.meta.components.filter(value => value.node_id === assetId).shift();
      if (componentData) {
        const svgData = await axios__default["default"].get(assetUrl);
        const assetName = slugify(componentData.name ?? '');
        const filename = assetName + '.' + defaultExtension;
        return {
          path: filename,
          name: assetName,
          icon: assetName,
          description: componentData.description,
          index: assetName.toLowerCase().replace(/[\W_]+/g, ' '),
          size: svgData.data.length,
          data: svgData.data.replace(/(\r\n|\n|\r)/gm, '')
        };
      } else {
        return null;
      }
    }));
    return assetsList.filter(filterOutNull);
  } catch (err) {
    console.error(err);
    return [];
  }
};
const zipAssets = async (assets, destination) => {
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
  assets.forEach(asset => {
    archive.append(asset.data, {
      name: asset.path
    });
  });
  await archive.finalize();
  return destination;
};

const generateChangelogObjectArr = (prevArr, newArr, discriminator) => {
  return [
  // find items that exist in newArr but do not in prevArr and mark them as added
  ...newArr.filter(newItem => !prevArr.find(prevItem => prevItem[discriminator] === newItem[discriminator])).map(newItem => ({
    type: 'add',
    object: newItem
  })),
  // find items that exist in prevArr but do not in newArr and mark them as deleted
  ...prevArr.filter(prevItem => !newArr.find(newItem => newItem[discriminator] === prevItem[discriminator])).map(prevItem => ({
    type: 'delete',
    object: prevItem
  })),
  // find items that exist both in prevArr and newArr, and filter out equals
  ...newArr.filter(newItem => prevArr.find(prevItem => prevItem[discriminator] === newItem[discriminator])).map(newItem => {
    const prevItem = prevArr.find(prevItem => prevItem[discriminator] === newItem[discriminator]);
    return {
      type: 'change',
      old: prevItem,
      new: newItem
    };
  }).filter(changeItem => {
    return !isEqual__default["default"](changeItem.old, changeItem.new);
  })];
};
const generateChangelogRecord = (prevDoc, newDoc) => {
  const colors = generateChangelogObjectArr(prevDoc?.design.color ?? [], newDoc.design.color, 'sass');
  const typography = generateChangelogObjectArr(prevDoc?.design.typography ?? [], newDoc.design.typography, 'name');
  const design = colors.length || typography.length ? {
    colors: colors.length ? colors : undefined,
    typography: typography.length ? typography : undefined
  } : undefined;
  const icons = generateChangelogObjectArr(prevDoc?.assets.icons ?? [], newDoc.assets.icons, 'path');
  const logos = generateChangelogObjectArr(prevDoc?.assets.logos ?? [], newDoc.assets.logos, 'path');
  const assets = icons.length || logos.length ? {
    icons: icons.length ? icons : undefined,
    logos: logos.length ? logos : undefined
  } : undefined;
  if (assets || design) {
    return {
      timestamp: new Date().toISOString(),
      design,
      assets
    };
  }
  return undefined;
};

function filterByNodeType(type) {
  return obj => obj?.type === type;
}
function isNodeType(obj, type) {
  return obj?.type === type;
}
function findChildNodeWithType(node, type) {
  if (isNodeType(node, type)) {
    return node;
  }
  if (!('children' in node) || !node.children.length) {
    return null;
  }
  if (node.children) {
    for (const child of node.children) {
      const foundNode = findChildNodeWithType(child, type);
      if (foundNode) {
        return foundNode;
      }
    }
  }
  return null;
}
function findChildNodeWithTypeAndName(node, type, name) {
  if (isNodeType(node, type) && node.name.toLowerCase() === name.toLowerCase()) {
    return node;
  }
  if (!('children' in node) || !node.children.length) {
    return null;
  }
  if (node.children) {
    for (const child of node.children) {
      const foundNode = findChildNodeWithTypeAndName(child, type, name);
      if (foundNode) {
        return foundNode;
      }
    }
  }
  return null;
}
function getComponentNamePart(componentName, partKey) {
  return componentName.split(',').find(part => part.trim().startsWith(`${partKey}=`))?.split('=')[1];
}
const isValidTheme = theme => {
  return ['light', 'dark'].includes(theme);
};
const isValidEffectType = effect => {
  return isShadowEffectType(effect);
};
const isShadowEffectType = effect => {
  return ['DROP_SHADOW', 'INNER_SHADOW'].includes(effect);
};
const isValidGradientType = gradientType => {
  return ['GRADIENT_LINEAR', 'GRADIENT_RADIAL'].includes(gradientType);
};
const normalizeNamePart = namePart => {
  return namePart.replace(/[^a-z0-9]+/gi, '-').replace(/^-/g, '').replace(/-$/g, '').toLowerCase();
};

/**
 * Is this a valid state for a button?
 *
 * @param state
 * @returns boolean
 */
const isValidState$6 = state => {
  return ['default', 'hover', 'disabled'].includes(state);
};

/**
 * Fetch all button compnents from the button component object and
 * transform into ButtonComponents
 * @param buttonComponents
 * @returns ButtonComponents
 */
function extractButtonComponents(buttonComponents) {
  const allButtons = buttonComponents.components.map(buttonComponent => {
    const theme = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'Theme') ?? 'light');
    const type = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'Type') ?? 'default');
    const state = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'State') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'Size') ?? '');
    const instanceNode = size ? buttonComponent : findChildNodeWithType(buttonComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for button ${buttonComponent.name}`);
    }
    const textNode = findChildNodeWithType(instanceNode, 'TEXT');
    if (!textNode) {
      throw new Error(`No text node found for button ${buttonComponent.name}`);
    }

    // Description
    const description = buttonComponents.metadata[buttonComponent.id]?.description ?? '';

    // Background color
    const background = instanceNode.background.slice();

    // Padding
    const paddingTop = instanceNode.paddingTop ?? 0;
    const paddingRight = instanceNode.paddingRight ?? 0;
    const paddingBottom = instanceNode.paddingBottom ?? 0;
    const paddingLeft = instanceNode.paddingLeft ?? 0;

    // Border
    const borderWeight = instanceNode.strokeWeight ?? 0;
    const borderRadius = instanceNode.cornerRadius ?? 0;
    const borderColor = instanceNode.strokes.slice();

    // Text
    const fontFamily = textNode.style.fontFamily;
    const fontSize = textNode.style.fontSize;
    const fontWeight = textNode.style.fontWeight;
    const lineHeight = (textNode.style.lineHeightPercentFontSize ?? 100) / 100;
    const letterSpacing = textNode.style.letterSpacing;
    const textAlign = textNode.style.textAlignHorizontal;
    const textDecoration = textNode.style.textDecoration ?? 'NONE';
    const textCase = textNode.style.textCase ?? 'ORIGINAL';
    const color = textNode.fills.slice();

    // Shadow
    const effects = [...instanceNode.effects];

    // Opacity
    const opacity = buttonComponent.opacity ?? 1;

    // Characters
    const characters = textNode.characters;
    const tokens = {
      description,
      background,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      borderWeight,
      borderRadius,
      borderColor,
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textAlign,
      textDecoration,
      textCase,
      color,
      effects,
      opacity,
      characters
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }

    // We shouldn't validate themes or state this way
    // TODO: allow other states and themes, and don't
    // require these theme names
    if (!isValidTheme(theme) || !isValidState$6(state)) {
      return null;
    }
    return {
      id: `design-theme-${theme}-type-${type}-state-${state}`,
      componentType: 'design',
      theme,
      type,
      state,
      ...tokens
    };
  }).filter(filterOutNull);
  const designComponents = allButtons.filter(component => component.componentType === 'design');
  const disabledButtonLight = designComponents.find(button => button.theme === 'light' && button.state === 'disabled');
  let disabledButtonDark = designComponents.find(button => button.theme === 'dark' && button.state === 'disabled');
  if (!disabledButtonLight) {
    throw new Error('No disabled button light found');
  }
  let dark = false;
  if (designComponents.filter(comp => comp.theme === 'dark').length > 0) {
    // There is a dark theme in this project
    dark = true;
    if (!disabledButtonDark) {
      console.log('No disabled button dark found. Defaulting to light disabled button.');
    }
  }
  const types = uniq__default["default"](designComponents.map(button => button.type));
  const themes = uniq__default["default"](designComponents.map(button => button.theme));
  return themes.flatMap(theme => {
    if (!dark && theme === 'dark') {
      return [];
    }
    return types.flatMap(type => {
      return ['default', 'hover', 'disabled'].map(state => {
        const button = designComponents.find(button => button.theme === theme && button.type === type && button.state === state);
        if (!button) {
          // If the state is disabled
          if (state === 'disabled') {
            if (disabledButtonDark) {
              return {
                ...(theme === 'light' ? disabledButtonLight : disabledButtonDark),
                theme,
                type
              };
            } else {
              return {
                ...disabledButtonLight,
                theme,
                type
              };
            }
          }
          throw new Error(`No button found for theme=${theme}, type=${type}, state=${state}`);
        }
        return button;
      });
    });
  }).concat(allButtons.filter(component => component.componentType === 'layout'));
}

const isValidState$5 = state => {
  return ['default', 'hover', 'disabled', 'active', 'error'].includes(state);
};
function extractSelectComponents(selectComponents) {
  return selectComponents.components.map(selectComponent => {
    const theme = normalizeNamePart(getComponentNamePart(selectComponent.name, 'Theme') ?? 'light');
    const state = normalizeNamePart(getComponentNamePart(selectComponent.name, 'State') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(selectComponent.name, 'Size') ?? '');
    const instanceNode = size ? selectComponent : findChildNodeWithType(selectComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for select component ${selectComponent.name}`);
    }
    const selectNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', ':: select');
    if (!selectNode) {
      throw new Error(`No select node found for select component ${selectComponent.name}`);
    }
    const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Select Label');
    if (!labelNode) {
      throw new Error(`No label node found for select component ${selectComponent.name}`);
    }
    const optionNode = findChildNodeWithTypeAndName(selectNode, 'TEXT', 'Select Option');
    if (!optionNode) {
      throw new Error(`No option node found for select component ${selectComponent.name}`);
    }
    const overlayNode = findChildNodeWithTypeAndName(selectNode, 'RECTANGLE', 'Color');
    if (!overlayNode) {
      throw new Error(`No overlay node found for input component ${selectNode.name}`);
    }
    const iconNode = findChildNodeWithTypeAndName(instanceNode, 'INSTANCE', 'Caret');
    if (!iconNode) {
      throw new Error(`No icon node found for select component ${selectComponent.name}`);
    }
    const additionalInfoNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Additional Info');
    if (!additionalInfoNode) {
      throw new Error(`No additional info node found for select component ${selectComponent.name}`);
    }

    // Description
    const description = selectComponents.metadata[selectComponent.id]?.description ?? '';

    // Background color
    const background = selectNode.background.slice();

    // Padding
    const paddingTop = selectNode.paddingTop ?? 0;
    const paddingRight = selectNode.paddingRight ?? 0;
    const paddingBottom = selectNode.paddingBottom ?? 0;
    const paddingLeft = selectNode.paddingLeft ?? 0;

    // Border
    const borderWeight = selectNode.strokeWeight ?? 0;
    const borderRadius = selectNode.cornerRadius ?? 0;
    const borderColor = selectNode.strokes.slice();

    // Effects
    const effects = [...selectNode.effects];

    // Label
    const label = {
      spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
      fontFamily: labelNode.style.fontFamily,
      fontSize: labelNode.style.fontSize,
      fontWeight: labelNode.style.fontWeight,
      lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: labelNode.style.letterSpacing,
      textAlign: labelNode.style.textAlignHorizontal,
      textDecoration: labelNode.style.textDecoration ?? 'NONE',
      textCase: labelNode.style.textCase ?? 'ORIGINAL',
      color: labelNode.fills.slice()
    };

    // Option
    const option = {
      fontFamily: optionNode.style.fontFamily,
      fontSize: optionNode.style.fontSize,
      fontWeight: optionNode.style.fontWeight,
      lineHeight: (optionNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: optionNode.style.letterSpacing,
      textAlign: optionNode.style.textAlignHorizontal,
      textDecoration: optionNode.style.textDecoration ?? 'NONE',
      textCase: optionNode.style.textCase ?? 'ORIGINAL',
      color: optionNode.fills.slice()
    };
    const icon = {
      width: iconNode.absoluteBoundingBox.width,
      height: iconNode.absoluteBoundingBox.height,
      color: overlayNode?.fills.slice()
    };
    const additionalInfo = {
      spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
      fontFamily: additionalInfoNode.style.fontFamily,
      fontSize: additionalInfoNode.style.fontSize,
      fontWeight: additionalInfoNode.style.fontWeight,
      lineHeight: (additionalInfoNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: additionalInfoNode.style.letterSpacing,
      textAlign: additionalInfoNode.style.textAlignHorizontal,
      textDecoration: additionalInfoNode.style.textDecoration ?? 'NONE',
      textCase: additionalInfoNode.style.textCase ?? 'ORIGINAL',
      color: additionalInfoNode.fills.slice()
    };
    const tokens = {
      description,
      background,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      borderWeight,
      borderRadius,
      borderColor,
      effects,
      parts: {
        label,
        option,
        icon,
        additionalInfo
      }
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }
    if (!isValidTheme(theme) || !isValidState$5(state)) {
      return null;
    }
    return {
      id: `design-theme-${theme}-state-${state}`,
      componentType: 'design',
      theme,
      state,
      ...tokens
    };
  }).filter(filterOutNull);
}

const isValidVertical = vertical => {
  return ['top', 'bottom'].includes(vertical);
};
const isValidHorizontal = horizontal => {
  return ['left', 'center', 'right'].includes(horizontal);
};
function extractTooltipComponents(tooltipComponents) {
  return tooltipComponents.components.map(tooltipComponent => {
    const vertical = normalizeNamePart(getComponentNamePart(tooltipComponent.name, 'Vertical') ?? 'top');
    const horizontal = normalizeNamePart(getComponentNamePart(tooltipComponent.name, 'Horizontal') ?? 'center');
    if (!isValidVertical(vertical) || !isValidHorizontal(horizontal)) {
      throw Error('Invalid horizontal or vertical type');
    }
    const instanceNode = findChildNodeWithType(tooltipComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for select component ${tooltipComponent.name}`);
    }
    const toolTipNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'body');
    if (!toolTipNode) {
      throw new Error(`No text frame found for tooltip component ${tooltipComponent.name}`);
    }
    const textNode = findChildNodeWithType(instanceNode, 'TEXT');
    if (!textNode) {
      throw new Error(`No text node found for text node ${tooltipComponent.name}`);
    }

    // Description
    const description = tooltipComponents.metadata[tooltipComponent.id]?.description ?? '';

    // Background color
    const background = toolTipNode.background.slice();

    // Padding
    const paddingTop = toolTipNode.paddingTop ?? 0;
    const paddingRight = toolTipNode.paddingRight ?? 0;
    const paddingBottom = toolTipNode.paddingBottom ?? 0;
    const paddingLeft = toolTipNode.paddingLeft ?? 0;

    // Border
    const borderWeight = instanceNode.strokeWeight ?? 0;
    const borderRadius = toolTipNode.cornerRadius ?? 0;
    const borderColor = toolTipNode.strokes[0]?.color ?? {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    };

    // Label
    const label = {
      characters: textNode.characters ?? '',
      spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
      fontFamily: textNode.style.fontFamily,
      fontSize: textNode.style.fontSize,
      fontWeight: textNode.style.fontWeight,
      lineHeight: (textNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: textNode.style.letterSpacing,
      textAlign: textNode.style.textAlignHorizontal,
      textDecoration: textNode.style.textDecoration ?? 'NONE',
      textTransform: textNode.style.textCase ?? 'ORIGINAL',
      color: textNode.fills[0]?.color ?? {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      }
    };
    return {
      id: `design-vertical-${vertical}-horizontal-${horizontal}`,
      description,
      vertical,
      horizontal,
      background,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      borderWeight,
      borderRadius,
      borderColor,
      parts: {
        label
      }
    };
  });
}

/**
 * Validate input states.  We only can handle the following states
 * 'default', 'hover', 'disabled', 'active', 'error'
 * @param state
 * @returns boolean
 */
const isValidState$4 = state => {
  return ['default', 'hover', 'disabled', 'active', 'error', 'complete'].includes(state);
};

/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
function extractInputComponents(inputComponents) {
  return inputComponents.components.map(inputComponent => {
    const theme = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Theme') ?? 'light');
    const state = normalizeNamePart(getComponentNamePart(inputComponent.name, 'State') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Size') ?? '');
    const instanceNode = size ? inputComponent : findChildNodeWithType(inputComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for input component ${inputComponent.name}`);
    }
    const inputNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', ':: input');
    if (!inputNode) {
      throw new Error(`No input node found for input component ${inputComponent.name}`);
    }
    const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Input Label');
    if (!labelNode) {
      throw new Error(`No label node found for input component ${inputComponent.name}`);
    }
    const textNode = findChildNodeWithTypeAndName(inputNode, 'TEXT', 'Input Text');
    if (!textNode) {
      throw new Error(`No text node found for input component ${inputComponent.name}`);
    }
    const iconNode = findChildNodeWithType(inputNode, 'VECTOR');
    if (!iconNode) {
      throw new Error(`No icon node found for input component ${inputComponent.name}`);
    }
    const additionalInfoNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Help Text');
    if (!additionalInfoNode) {
      throw new Error(`No additional info node found for input component ${inputComponent.name}`);
    }

    // Description
    const description = inputComponents.metadata[inputComponent.id]?.description ?? '';

    // Background color
    const background = inputNode.background.slice();

    // Padding
    const paddingTop = inputNode.paddingTop ?? 0;
    const paddingRight = inputNode.paddingRight ?? 0;
    const paddingBottom = inputNode.paddingBottom ?? 0;
    const paddingLeft = inputNode.paddingLeft ?? 0;

    // Border
    const borderWeight = inputNode.strokeWeight ?? 0;
    const borderRadius = inputNode.cornerRadius ?? 0;
    const borderColor = inputNode.strokes.slice();

    // Label
    const label = {
      characters: labelNode.characters ?? '',
      spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
      fontFamily: labelNode.style.fontFamily,
      fontSize: labelNode.style.fontSize,
      fontWeight: labelNode.style.fontWeight,
      lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: labelNode.style.letterSpacing,
      textAlign: labelNode.style.textAlignHorizontal,
      textDecoration: labelNode.style.textDecoration ?? 'NONE',
      textCase: labelNode.style.textCase ?? 'ORIGINAL',
      color: labelNode.fills[0]?.color ?? {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      }
    };

    // Option
    const text = {
      characters: textNode.characters ?? '',
      fontFamily: textNode.style.fontFamily,
      fontSize: textNode.style.fontSize,
      fontWeight: textNode.style.fontWeight,
      lineHeight: (textNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: textNode.style.letterSpacing,
      textAlign: textNode.style.textAlignHorizontal,
      textDecoration: textNode.style.textDecoration ?? 'NONE',
      textCase: textNode.style.textCase ?? 'ORIGINAL',
      color: textNode.fills[0]?.color ?? {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      }
    };
    const icon = {
      borderWeight: iconNode.strokeWeight ?? 0,
      borderColor: iconNode.strokes[0]?.color ?? {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      }
    };
    const additionalInfo = {
      characters: additionalInfoNode.characters ?? '',
      spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
      fontFamily: additionalInfoNode.style.fontFamily,
      fontSize: additionalInfoNode.style.fontSize,
      fontWeight: additionalInfoNode.style.fontWeight,
      lineHeight: (additionalInfoNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: additionalInfoNode.style.letterSpacing,
      textAlign: additionalInfoNode.style.textAlignHorizontal,
      textDecoration: additionalInfoNode.style.textDecoration ?? 'NONE',
      textCase: additionalInfoNode.style.textCase ?? 'ORIGINAL',
      color: additionalInfoNode.fills[0]?.color ?? {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      }
    };
    const effects = [...inputNode.effects];
    const tokens = {
      description,
      background,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      borderWeight,
      borderRadius,
      borderColor,
      effects,
      parts: {
        label,
        text,
        icon,
        additionalInfo
      }
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }
    if (!isValidTheme(theme) || !isValidState$4(state)) {
      return null;
    }
    return {
      id: `design-theme-${theme}-state-${state}`,
      componentType: 'design',
      theme,
      state,
      ...tokens
    };
  }).filter(filterOutNull);
}

const isValidLayout = layout => {
  return ['horizontal', 'vertical'].includes(layout);
};
function extractAlertComponents(alertComponents) {
  return alertComponents.components.map(alertComponent => {
    const type = normalizeNamePart(getComponentNamePart(alertComponent.name, 'Type') ?? 'default');
    const layout = normalizeNamePart(getComponentNamePart(alertComponent.name, 'Layout') ?? '');
    const instanceNode = layout ? alertComponent : findChildNodeWithType(alertComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for alert ${alertComponent.name}`);
    }
    const bodyNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Body');
    if (!bodyNode) {
      throw new Error(`No body node found for alert ${alertComponent.name}`);
    }
    const closeNode = findChildNodeWithTypeAndName(instanceNode, 'INSTANCE', 'Close');
    if (!closeNode) {
      throw new Error(`No close node found for alert ${alertComponent.name}`);
    }
    const closeIconColorNode = findChildNodeWithTypeAndName(closeNode, 'RECTANGLE', 'Color');
    if (!closeIconColorNode) {
      throw new Error(`No close icon color node found for alert ${alertComponent.name}`);
    }
    const iconNode = findChildNodeWithTypeAndName(bodyNode, 'INSTANCE', 'Icon');
    if (!iconNode) {
      throw new Error(`No icon node found for alert ${alertComponent.name}`);
    }
    const iconColorNode = findChildNodeWithTypeAndName(iconNode, 'RECTANGLE', 'Color');
    if (!iconColorNode) {
      throw new Error(`No icon color node found for alert ${alertComponent.name}`);
    }
    const contentNode = findChildNodeWithTypeAndName(bodyNode, 'FRAME', 'Content');
    if (!contentNode) {
      throw new Error(`No content node found for alert ${alertComponent.name}`);
    }
    const titleNode = findChildNodeWithTypeAndName(contentNode, 'TEXT', 'Title');
    if (!titleNode) {
      throw new Error(`No title node found for alert ${alertComponent.name}`);
    }
    const textNode = findChildNodeWithTypeAndName(contentNode, 'TEXT', 'Text');
    if (!textNode) {
      throw new Error(`No text node found for alert ${alertComponent.name}`);
    }
    const actionsNode = findChildNodeWithTypeAndName(bodyNode, 'FRAME', 'Actions');
    if (!actionsNode) {
      throw new Error(`No actions node found for alert ${alertComponent.name}`);
    }
    const actionsLinkNode = findChildNodeWithTypeAndName(actionsNode, 'TEXT', 'Link');
    if (!actionsLinkNode) {
      throw new Error(`No actions link node found for alert ${alertComponent.name}`);
    }
    const tokens = {
      // Description
      description: alertComponents.metadata[alertComponent.id]?.description ?? '',
      // Background color
      background: instanceNode.background.slice(),
      // Padding
      paddingTop: instanceNode.paddingTop ?? 0,
      paddingRight: instanceNode.paddingRight ?? 0,
      paddingBottom: instanceNode.paddingBottom ?? 0,
      paddingLeft: instanceNode.paddingLeft ?? 0,
      // Border
      borderWeight: instanceNode.strokeWeight ?? 0,
      borderRadius: instanceNode.cornerRadius ?? 0,
      borderColor: instanceNode.strokes.slice(),
      // Shadow
      effects: [...instanceNode.effects],
      spacing: instanceNode.itemSpacing ?? 0,
      parts: {
        close: {
          color: closeIconColorNode.fills.slice()
        },
        icon: {
          color: iconColorNode.fills.slice()
        },
        body: {
          spacing: bodyNode.itemSpacing ?? 0
        },
        content: {
          spacing: contentNode.itemSpacing ?? 0
        },
        title: {
          fontFamily: titleNode.style.fontFamily,
          fontSize: titleNode.style.fontSize,
          fontWeight: titleNode.style.fontWeight,
          lineHeight: (titleNode.style.lineHeightPercentFontSize ?? 100) / 100,
          letterSpacing: titleNode.style.letterSpacing,
          textAlign: titleNode.style.textAlignHorizontal,
          textDecoration: titleNode.style.textDecoration ?? 'NONE',
          textCase: titleNode.style.textCase ?? 'ORIGINAL',
          color: titleNode.fills.slice(),
          characters: titleNode.characters
        },
        text: {
          fontFamily: textNode.style.fontFamily,
          fontSize: textNode.style.fontSize,
          fontWeight: textNode.style.fontWeight,
          lineHeight: (textNode.style.lineHeightPercentFontSize ?? 100) / 100,
          letterSpacing: textNode.style.letterSpacing,
          textAlign: textNode.style.textAlignHorizontal,
          textDecoration: textNode.style.textDecoration ?? 'NONE',
          textCase: textNode.style.textCase ?? 'ORIGINAL',
          color: textNode.fills.slice(),
          characters: textNode.characters
        },
        actions: {
          spacing: actionsNode.itemSpacing ?? 0,
          fontFamily: actionsLinkNode.style.fontFamily,
          fontSize: actionsLinkNode.style.fontSize,
          fontWeight: actionsLinkNode.style.fontWeight,
          lineHeight: (actionsLinkNode.style.lineHeightPercentFontSize ?? 100) / 100,
          letterSpacing: actionsLinkNode.style.letterSpacing,
          textAlign: actionsLinkNode.style.textAlignHorizontal,
          textDecoration: actionsLinkNode.style.textDecoration ?? 'NONE',
          textCase: actionsLinkNode.style.textCase ?? 'ORIGINAL',
          color: actionsLinkNode.fills.slice(),
          characters: actionsLinkNode.characters
        }
      }
    };
    if (layout) {
      if (!isValidLayout(layout)) {
        return null;
      }
      return {
        id: `layout-${layout}`,
        componentType: 'layout',
        layout,
        ...tokens
      };
    }
    return {
      id: `design-type-${type}`,
      componentType: 'design',
      type,
      ...tokens
    };
  }).filter(filterOutNull);
}

const isValidState$3 = state => {
  return ['default', 'hover', 'disabled'].includes(state);
};
const isValidActivity$2 = activity => {
  return ['on', 'off'].includes(activity);
};
/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
function extractCheckboxComponents(inputComponents) {
  return inputComponents.components.map(inputComponent => {
    const theme = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Theme') ?? 'light');
    const state = normalizeNamePart(getComponentNamePart(inputComponent.name, 'State') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Size') ?? '');
    const activity = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Activity') ?? '');
    const instanceNode = size ? inputComponent : findChildNodeWithType(inputComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for checkbox component ${inputComponent.name}`);
    }
    const inputNode = findChildNodeWithTypeAndName(instanceNode, 'GROUP', ':: checkbox');
    if (!inputNode) {
      throw new Error(`No checkbox node found for checkbox component ${inputComponent.name}`);
    }
    const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Checkbox Label');
    if (!labelNode) {
      throw new Error(`No label node found for input component ${inputComponent.name}`);
    }
    const overlayNode = findChildNodeWithTypeAndName(inputNode, 'RECTANGLE', 'Color');
    if (!overlayNode) {
      throw new Error(`No overlay node found for input component ${inputComponent.name}`);
    }
    const checkboxNode = findChildNodeWithTypeAndName(inputNode, 'RECTANGLE', 'body');
    if (!checkboxNode) {
      throw new Error(`No text node found for input component ${inputComponent.name}`);
    }
    const iconNode = findChildNodeWithTypeAndName(inputNode, 'INSTANCE', activity);

    // Description
    const description = inputComponents.metadata[inputComponent.id]?.description ?? '';

    // Background color
    const background = checkboxNode?.fills.slice();

    // Padding
    const paddingTop = inputNode.paddingTop ?? 0;
    const paddingRight = inputNode.paddingRight ?? 0;
    const paddingBottom = inputNode.paddingBottom ?? 0;
    const paddingLeft = inputNode.paddingLeft ?? 0;

    // Opacity
    const opacity = inputNode.opacity ?? 1;

    // Border
    const borderWeight = checkboxNode.strokeWeight ?? 0;
    const borderRadius = checkboxNode.cornerRadius ?? 0;
    const borderColor = checkboxNode.strokes.slice();

    // Label
    const label = {
      characters: labelNode.characters ?? '',
      fontFamily: labelNode.style.fontFamily,
      fontSize: labelNode.style.fontSize,
      fontWeight: labelNode.style.fontWeight,
      lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: labelNode.style.letterSpacing,
      textAlign: labelNode.style.textAlignHorizontal,
      textDecoration: labelNode.style.textDecoration ?? 'NONE',
      textCase: labelNode.style.textCase ?? 'ORIGINAL',
      color: labelNode.fills[0]?.color ?? {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      },
      opacity: labelNode.opacity ?? 1
    };

    // Option
    const check = {
      width: checkboxNode.absoluteBoundingBox.width,
      height: checkboxNode.absoluteBoundingBox.height,
      color: overlayNode?.fills.slice(),
      background,
      borderWeight,
      borderRadius,
      borderColor,
      paddingLeft: instanceNode.itemSpacing ?? 0,
      effects: [...checkboxNode.effects]
    };
    const icon = {
      width: iconNode ? iconNode.absoluteBoundingBox.width : 0,
      height: iconNode ? iconNode.absoluteBoundingBox.height : 0
    };
    const tokens = {
      height: instanceNode.absoluteBoundingBox.height,
      description,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      opacity,
      parts: {
        label,
        check,
        icon
      }
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }
    if (!isValidTheme(theme) || !isValidState$3(state) || !isValidActivity$2(activity)) {
      return null;
    }
    return {
      id: `design-theme-${theme}-state-${state}-activity-${activity}`,
      componentType: 'design',
      theme,
      state,
      activity,
      ...tokens
    };
  }).filter(filterOutNull);
}

const isValidState$2 = state => {
  return ['default', 'hover', 'disabled', 'error'].includes(state);
};
const isValidActivity$1 = activity => {
  return ['on', 'off'].includes(activity);
};
function extractSwitchComponents(switchComponents) {
  return lodash.uniqBy(switchComponents.components.map(switchComponent => {
    const theme = normalizeNamePart(getComponentNamePart(switchComponent.name, 'Theme') ?? 'light');
    const state = normalizeNamePart(getComponentNamePart(switchComponent.name, 'State') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(switchComponent.name, 'Size') ?? '');
    const activity = normalizeNamePart(getComponentNamePart(switchComponent.name, 'Activity') ?? 'off');
    const instanceNode = size ? switchComponent : findChildNodeWithType(switchComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for switch component ${switchComponent.name}`);
    }
    const switchNode = findChildNodeWithTypeAndName(instanceNode, 'GROUP', ':: switch');
    if (!switchNode) {
      throw new Error(`No switch node found for switch component ${switchComponent.name}`);
    }
    const bodyNode = findChildNodeWithTypeAndName(switchNode, 'RECTANGLE', 'body');
    if (!bodyNode) {
      throw new Error(`No body node found for switch component ${switchComponent.name}`);
    }
    const thumbNode = findChildNodeWithTypeAndName(switchNode, 'ELLIPSE', activity);
    if (!thumbNode) {
      throw new Error(`No thumb node found for switch component ${switchComponent.name}`);
    }
    const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Switch Label');
    if (!labelNode) {
      throw new Error(`No label node found for switch component ${switchComponent.name}`);
    }

    // Description
    const description = switchComponents.metadata[switchComponent.id]?.description ?? '';

    // Spacing
    const spacing = instanceNode.itemSpacing ?? 0;

    // Width and height
    const width = bodyNode.absoluteBoundingBox.width;
    const height = bodyNode.absoluteBoundingBox.height;

    // Background color
    const background = bodyNode.fills.slice();

    // Border
    const borderWeight = bodyNode.strokeWeight ?? 0;
    const borderRadius = bodyNode.cornerRadius ?? 0;
    const borderColor = bodyNode.strokes.slice();

    // Opacity
    const opacity = switchNode.opacity ?? 1;

    // Effects
    const effects = [...bodyNode.effects];

    // Thumb
    const thumb = {
      background: thumbNode.fills.slice(),
      borderWeight: thumbNode.strokeWeight ?? 0,
      borderColor: thumbNode.strokes.slice(),
      width: thumbNode.absoluteBoundingBox.width,
      height: thumbNode.absoluteBoundingBox.height
    };

    // Label
    const label = {
      fontFamily: labelNode.style.fontFamily,
      fontSize: labelNode.style.fontSize,
      fontWeight: labelNode.style.fontWeight,
      lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: labelNode.style.letterSpacing,
      textAlign: labelNode.style.textAlignHorizontal,
      textDecoration: labelNode.style.textDecoration ?? 'NONE',
      textCase: labelNode.style.textCase ?? 'ORIGINAL',
      color: labelNode.fills.slice(),
      opacity: labelNode.opacity ?? 1
    };
    const tokens = {
      description,
      spacing,
      width,
      height,
      background,
      borderWeight,
      borderRadius,
      borderColor,
      opacity,
      effects,
      parts: {
        label,
        thumb
      }
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }
    if (!isValidTheme(theme) || !isValidState$2(state) || !isValidActivity$1(activity)) {
      return null;
    }
    return {
      id: `design-theme-${theme}-state-${state}-activity-${activity}`,
      componentType: 'design',
      theme,
      state,
      activity,
      ...tokens
    };
  }).filter(filterOutNull), 'id');
}

const isValidState$1 = state => {
  return ['default', 'hover', 'disabled', 'active'].includes(state);
};
function extractPaginationComponents(paginationComponents) {
  return paginationComponents.components.map(paginationComponent => {
    const theme = normalizeNamePart(getComponentNamePart(paginationComponent.name, 'Theme') ?? 'light');
    const state = normalizeNamePart(getComponentNamePart(paginationComponent.name, 'State') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(paginationComponent.name, 'Size') ?? '');
    const instanceNode = size ? paginationComponent : findChildNodeWithType(paginationComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for pagination component ${paginationComponent.name}`);
    }
    const previousNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Previous');
    if (!previousNode) {
      throw new Error(`No previous node found for pagination component ${paginationComponent.name}`);
    }
    const previousNodeText = findChildNodeWithType(previousNode, 'TEXT');
    if (!previousNodeText) {
      throw new Error(`No previous text node found for pagination component ${paginationComponent.name}`);
    }
    const nextNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Next');
    if (!nextNode) {
      throw new Error(`No next node found for pagination component ${paginationComponent.name}`);
    }
    const nextNodeText = findChildNodeWithType(nextNode, 'TEXT');
    if (!nextNodeText) {
      throw new Error(`No next text node found for pagination component ${paginationComponent.name}`);
    }
    const itemNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'Item');
    if (!itemNode) {
      throw new Error(`No item node found for pagination component ${paginationComponent.name}`);
    }
    const itemNodeText = findChildNodeWithType(itemNode, 'TEXT');
    if (!itemNodeText) {
      throw new Error(`No item text node found for pagination component ${paginationComponent.name}`);
    }

    // Description
    const description = paginationComponents.metadata[paginationComponent.id]?.description ?? '';

    // Background color
    const background = instanceNode.fills.slice();

    // Border
    const borderWeight = instanceNode.strokeWeight ?? 0;
    const borderRadius = instanceNode.cornerRadius ?? 0;
    const borderColor = instanceNode.strokes.slice();

    // Spacing
    const spacing = instanceNode.layoutMode === 'HORIZONTAL' ? instanceNode.itemSpacing : undefined;

    // Previous
    const previous = {
      // Background
      background: previousNode.fills.slice(),
      // Border
      borderWeight: previousNode.strokeWeight ?? 0,
      borderRadius: previousNode.cornerRadius ?? 0,
      borderColor: previousNode.strokes.slice(),
      // Padding
      paddingTop: previousNode.paddingTop ?? 0,
      paddingRight: previousNode.paddingRight ?? 0,
      paddingBottom: previousNode.paddingBottom ?? 0,
      paddingLeft: previousNode.paddingLeft ?? 0,
      // Typography
      fontFamily: previousNodeText.style.fontFamily,
      fontSize: previousNodeText.style.fontSize,
      fontWeight: previousNodeText.style.fontWeight,
      lineHeight: (previousNodeText.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: previousNodeText.style.letterSpacing,
      textAlign: previousNodeText.style.textAlignHorizontal,
      textDecoration: previousNodeText.style.textDecoration,
      textCase: previousNodeText.style.textCase,
      color: previousNodeText.fills.slice()
    };

    // Next
    const next = {
      // Background
      background: nextNode.fills.slice(),
      // Border
      borderWeight: nextNode.strokeWeight ?? 0,
      borderRadius: nextNode.cornerRadius ?? 0,
      borderColor: nextNode.strokes.slice(),
      // Padding
      paddingTop: nextNode.paddingTop ?? 0,
      paddingRight: nextNode.paddingRight ?? 0,
      paddingBottom: nextNode.paddingBottom ?? 0,
      paddingLeft: nextNode.paddingLeft ?? 0,
      // Typography
      fontFamily: nextNodeText.style.fontFamily,
      fontSize: nextNodeText.style.fontSize,
      fontWeight: nextNodeText.style.fontWeight,
      lineHeight: (nextNodeText.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: nextNodeText.style.letterSpacing,
      textAlign: nextNodeText.style.textAlignHorizontal,
      textDecoration: nextNodeText.style.textDecoration,
      textCase: nextNodeText.style.textCase,
      color: nextNodeText.fills.slice()
    };

    // Item
    const item = {
      // Background
      background: itemNode.fills.slice(),
      // Border
      borderWeight: itemNode.strokeWeight ?? 0,
      borderRadius: itemNode.cornerRadius ?? 0,
      borderColor: itemNode.strokes.slice(),
      // Padding
      paddingTop: itemNode.paddingTop ?? 0,
      paddingRight: itemNode.paddingRight ?? 0,
      paddingBottom: itemNode.paddingBottom ?? 0,
      paddingLeft: itemNode.paddingLeft ?? 0,
      // Typography
      fontFamily: itemNodeText.style.fontFamily,
      fontSize: itemNodeText.style.fontSize,
      fontWeight: itemNodeText.style.fontWeight,
      lineHeight: (itemNodeText.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: itemNodeText.style.letterSpacing,
      textAlign: itemNodeText.style.textAlignHorizontal,
      textDecoration: itemNodeText.style.textDecoration ?? 'NONE',
      textCase: itemNodeText.style.textCase ?? 'ORIGINAL',
      color: itemNodeText.fills.slice()
    };
    const tokens = {
      description,
      background,
      borderWeight,
      borderRadius,
      borderColor,
      spacing,
      parts: {
        previous,
        next,
        item
      }
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }
    if (!isValidTheme(theme) || !isValidState$1(state)) {
      return null;
    }
    return {
      id: `design-theme-${theme}-state-${state}`,
      componentType: 'design',
      theme,
      state,
      ...tokens
    };
  }).filter(filterOutNull);
}

const isValidState = state => {
  return ['default', 'hover', 'disabled'].includes(state);
};
const isValidActivity = activity => {
  return ['on', 'off'].includes(activity);
};
/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
function extractRadioComponents(inputComponents) {
  return inputComponents.components.map(inputComponent => {
    const theme = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Theme') ?? 'light');
    const state = normalizeNamePart(getComponentNamePart(inputComponent.name, 'State') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Size') ?? '');
    const activity = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Activity') ?? '');
    const instanceNode = size ? inputComponent : findChildNodeWithType(inputComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for radio component ${inputComponent.name}`);
    }
    const inputNode = findChildNodeWithTypeAndName(instanceNode, 'GROUP', ':: radio');
    if (!inputNode) {
      throw new Error(`No radio node found for radio component ${inputComponent.name}`);
    }
    const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Radio Label');
    if (!labelNode) {
      throw new Error(`No label node found for input component ${inputComponent.name}`);
    }
    const radioNode = findChildNodeWithTypeAndName(inputNode, 'RECTANGLE', 'body');
    if (!radioNode) {
      throw new Error(`No text node found for input component ${inputComponent.name}`);
    }
    const thumbNode = findChildNodeWithTypeAndName(inputNode, 'ELLIPSE', 'on');
    if (!thumbNode) {
      throw new Error(`No thumb node found for input component ${inputComponent.name}`);
    }

    // Description
    const description = inputComponents.metadata[inputComponent.id]?.description ?? '';

    // Background color
    const background = radioNode?.fills.slice();

    // Padding
    const paddingTop = inputNode.paddingTop ?? 0;
    const paddingRight = inputNode.paddingRight ?? 0;
    const paddingBottom = inputNode.paddingBottom ?? 0;
    const paddingLeft = inputNode.paddingLeft ?? 0;

    // Border
    const borderWeight = inputNode.strokeWeight ?? 0;
    const borderRadius = inputNode.cornerRadius ?? 0;
    const borderColor = inputNode.strokes.slice();

    // Opacity
    const opacity = inputNode.opacity ?? 1;

    // Label
    const label = {
      characters: labelNode.characters ?? '',
      fontFamily: labelNode.style.fontFamily,
      fontSize: labelNode.style.fontSize,
      fontWeight: labelNode.style.fontWeight,
      lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
      letterSpacing: labelNode.style.letterSpacing,
      textAlign: labelNode.style.textAlignHorizontal,
      textDecoration: labelNode.style.textDecoration ?? 'NONE',
      textCase: labelNode.style.textCase ?? 'ORIGINAL',
      color: labelNode.fills[0]?.color ?? {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      },
      opacity: labelNode.opacity ?? 1
    };

    // Option
    const check = {
      width: radioNode.absoluteBoundingBox.width,
      height: radioNode.absoluteBoundingBox.height,
      background,
      borderWeight,
      borderRadius,
      borderColor,
      paddingLeft: instanceNode.itemSpacing ?? 0,
      effects: [...radioNode.effects]
    };
    const thumb = {
      width: thumbNode.absoluteBoundingBox.width ?? 0,
      height: thumbNode.absoluteBoundingBox.height ?? 0,
      background: thumbNode.fills.slice(),
      borderWeight: thumbNode.strokeWeight ?? 0,
      borderColor: thumbNode.strokes.slice()
    };
    const tokens = {
      height: instanceNode.absoluteBoundingBox.height,
      description,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      opacity,
      parts: {
        label,
        check,
        thumb
      }
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }
    if (!isValidTheme(theme) || !isValidState(state) || !isValidActivity(activity)) {
      return null;
    }
    return {
      id: `design-theme-${theme}-state-${state}-activity-${activity}`,
      componentType: 'design',
      theme,
      state,
      activity,
      ...tokens
    };
  }).filter(filterOutNull);
}

function extractModalComponents(modalComponents) {
  return modalComponents.components.map(modalComponent => {
    const type = normalizeNamePart(getComponentNamePart(modalComponent.name, 'Type') ?? 'default');
    const size = normalizeNamePart(getComponentNamePart(modalComponent.name, 'Size') ?? '');
    const instanceNode = size ? modalComponent : findChildNodeWithType(modalComponent, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for select component ${modalComponent.name}`);
    }

    // Header
    const headerNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'header');
    if (!headerNode) {
      throw new Error(`No header node found for modal component ${modalComponent.name}`);
    }

    // Header title
    const headerTitleNode = findChildNodeWithType(headerNode, 'TEXT');
    if (!headerTitleNode) {
      throw new Error(`No header title node found for modal header component ${headerNode.name}`);
    }

    // Body
    const bodyNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'body');
    if (!bodyNode) {
      throw new Error(`No body node found for modal component ${modalComponent.name}`);
    }

    // Body content
    const bodyContentNode = findChildNodeWithType(bodyNode, 'TEXT');
    if (!bodyContentNode) {
      throw new Error(`No body content node found for modal body component ${bodyNode.name}`);
    }

    // Footer
    const footerNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', 'footer');
    if (!footerNode) {
      throw new Error(`No footer node found for modal component ${modalComponent.name}`);
    }

    // Footer copy
    const footerCopyNode = findChildNodeWithType(footerNode, 'TEXT');
    if (!footerCopyNode) {
      throw new Error(`No footer copy node found for modal footer component ${footerNode.name}`);
    }
    const tokens = {
      // Description
      description: modalComponents.metadata[modalComponent.id]?.description ?? '',
      // Background color
      background: instanceNode.background.slice(),
      // Padding
      paddingTop: instanceNode.paddingTop ?? 0,
      paddingRight: instanceNode.paddingRight ?? 0,
      paddingBottom: instanceNode.paddingBottom ?? 0,
      paddingLeft: instanceNode.paddingLeft ?? 0,
      // Border
      borderWeight: instanceNode.strokeWeight ?? 0,
      borderRadius: instanceNode.cornerRadius ?? 0,
      borderColor: instanceNode.strokes.slice(),
      // Shadow
      effects: [...instanceNode.effects],
      parts: {
        header: {
          // Background color
          background: headerNode.background.slice(),
          // Padding
          paddingTop: headerNode.paddingTop ?? 0,
          paddingRight: headerNode.paddingRight ?? 0,
          paddingBottom: headerNode.paddingBottom ?? 0,
          paddingLeft: headerNode.paddingLeft ?? 0,
          // Border
          borderWeight: headerNode.strokeWeight ?? 0,
          borderRadius: headerNode.cornerRadius ?? 0,
          borderColor: headerNode.strokes.slice(),
          // Shadow
          effects: [...headerNode.effects],
          // Title
          title: {
            fontFamily: headerTitleNode.style.fontFamily,
            fontSize: headerTitleNode.style.fontSize,
            fontWeight: headerTitleNode.style.fontWeight,
            lineHeight: (headerTitleNode.style.lineHeightPercentFontSize ?? 100) / 100,
            letterSpacing: headerTitleNode.style.letterSpacing,
            textAlign: headerTitleNode.style.textAlignHorizontal,
            textDecoration: headerTitleNode.style.textDecoration ?? 'NONE',
            textTransform: headerTitleNode.style.textCase ?? 'ORIGINAL',
            color: headerTitleNode.fills.slice(),
            characters: headerTitleNode.characters
          }
        },
        body: {
          // Background color
          background: bodyNode.background.slice(),
          // Padding
          paddingTop: bodyNode.paddingTop ?? 0,
          paddingRight: bodyNode.paddingRight ?? 0,
          paddingBottom: bodyNode.paddingBottom ?? 0,
          paddingLeft: bodyNode.paddingLeft ?? 0,
          // Border
          borderWeight: bodyNode.strokeWeight ?? 0,
          borderRadius: bodyNode.cornerRadius ?? 0,
          borderColor: bodyNode.strokes.slice(),
          // Shadow
          effects: [...bodyNode.effects],
          // Content
          content: {
            fontFamily: bodyContentNode.style.fontFamily,
            fontSize: bodyContentNode.style.fontSize,
            fontWeight: bodyContentNode.style.fontWeight,
            lineHeight: (bodyContentNode.style.lineHeightPercentFontSize ?? 100) / 100,
            letterSpacing: bodyContentNode.style.letterSpacing,
            textAlign: bodyContentNode.style.textAlignHorizontal,
            textDecoration: bodyContentNode.style.textDecoration ?? 'NONE',
            textTransform: bodyContentNode.style.textCase ?? 'ORIGINAL',
            color: bodyContentNode.fills.slice(),
            characters: bodyContentNode.characters
          }
        },
        footer: {
          // Background color
          background: footerNode.background.slice(),
          // Padding
          paddingTop: footerNode.paddingTop ?? 0,
          paddingRight: footerNode.paddingRight ?? 0,
          paddingBottom: footerNode.paddingBottom ?? 0,
          paddingLeft: footerNode.paddingLeft ?? 0,
          // Border
          borderWeight: footerNode.strokeWeight ?? 0,
          borderRadius: footerNode.cornerRadius ?? 0,
          borderColor: footerNode.strokes.slice(),
          // Shadow
          effects: [...footerNode.effects],
          // Content
          copy: {
            fontFamily: footerCopyNode.style.fontFamily,
            fontSize: footerCopyNode.style.fontSize,
            fontWeight: footerCopyNode.style.fontWeight,
            lineHeight: (footerCopyNode.style.lineHeightPercentFontSize ?? 100) / 100,
            letterSpacing: footerCopyNode.style.letterSpacing,
            textAlign: footerCopyNode.style.textAlignHorizontal,
            textDecoration: footerCopyNode.style.textDecoration ?? 'NONE',
            textTransform: footerCopyNode.style.textCase ?? 'ORIGINAL',
            color: footerCopyNode.fills.slice(),
            characters: footerCopyNode.characters
          }
        }
      }
    };
    if (size) {
      return {
        id: `layout-size-${size}`,
        componentType: 'layout',
        size,
        ...tokens
      };
    }
    return {
      id: `design-type-${type}`,
      componentType: 'design',
      type,
      ...tokens
    };
  }).filter(filterOutNull);
}

/**
 * Get Config
 * @returns Config
 */
const getFetchConfig = () => {
  let config;
  try {
    console.log(path__default["default"].resolve(__dirname, '../../client-config'));
    config = require(path__default["default"].resolve(__dirname, '../../client-config'));
    console.log(config);
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
const mapComponentSize = (figma, component, config) => {
  if (!config) {
    config = getFetchConfig();
  }
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

function getComponentSetComponents(metadata, componentSets, componentMetadata, name) {
  // console.log(componentSets.map((componentSet) => componentSet.name));
  const componentSet = componentSets.find(componentSet => componentSet.name === name);
  if (!componentSet) {
    // TODO: remove this when all component sets are implemented
    return {
      components: [],
      metadata: {}
    };
  }
  const componentSetMetadata = metadata.find(metadata => metadata.node_id === componentSet.id);
  const baseComponentSetMetadata = componentSetMetadata ? metadata.find(metadata => metadata.node_id !== componentSetMetadata.node_id && metadata.containing_frame.nodeId === componentSetMetadata.containing_frame.nodeId) : undefined;
  const baseComponentSet = baseComponentSetMetadata ? componentSets.find(componentSet => componentSet.id === baseComponentSetMetadata.node_id) : undefined;
  const components = [...componentSet.children, ...(baseComponentSet?.children || [])];
  const componentsMetadata = Object.fromEntries(Array.from(componentMetadata.entries()).filter(([key]) => components.map(child => child.id).includes(key)));
  return {
    components: components,
    metadata: componentsMetadata
  };
}
const getFileComponentTokens = async (fileId, accessToken) => {
  let fileComponentSetsRes;
  try {
    fileComponentSetsRes = await getComponentSets(fileId, accessToken);
  } catch (err) {
    throw new Error('Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide');
  }
  if (fileComponentSetsRes.data.meta.component_sets.length === 0) {
    console.error(chalk__default["default"].red('Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'));
    console.log(chalk__default["default"].blue('Continuing fetch with only colors and typography design foundations'));
    return {
      buttons: [],
      selects: [],
      checkboxes: [],
      radios: [],
      inputs: [],
      tooltips: [],
      alerts: [],
      switches: [],
      pagination: [],
      modal: []
    };
  }
  const componentSetsNodesRes = await getComponentSetNodes(fileId, fileComponentSetsRes.data.meta.component_sets.map(item => item.node_id), accessToken);
  const componentSets = Object.values(componentSetsNodesRes.data.nodes).map(node => node?.document).filter(filterByNodeType('COMPONENT_SET'));
  const componentMetadata = new Map(Object.entries(Object.values(componentSetsNodesRes.data.nodes).map(node => {
    return node?.components;
  }).reduce((acc, cur) => {
    return {
      ...acc,
      ...cur
    };
  }) ?? {}));
  const config = await getFetchConfig();
  const figmaSearch = config.figma.components;
  return {
    buttons: figmaSearch.button ? extractButtonComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.button.search ?? 'Button')) : [],
    selects: figmaSearch.select ? extractSelectComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.select.search ?? 'Select')) : [],
    checkboxes: figmaSearch.checkbox ? extractCheckboxComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.checkbox.search ?? 'Checkbox')) : [],
    radios: figmaSearch.radio ? extractRadioComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.radio.search ?? 'Radio')) : [],
    inputs: figmaSearch.input ? extractInputComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.input.search ?? 'Input')) : [],
    tooltips: figmaSearch.tooltip ? extractTooltipComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.tooltip.search ?? 'Tooltip')) : [],
    alerts: figmaSearch.alert ? extractAlertComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.alert.search ?? 'Alert')) : [],
    switches: figmaSearch.switch ? extractSwitchComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.switch.search ?? 'Switch')) : [],
    pagination: figmaSearch.pagination ? extractPaginationComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.pagination.search ?? 'Pagination')) : [],
    modal: figmaSearch.modal ? extractModalComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, figmaSearch.modal.search ?? 'Modal')) : []
  };
};

/**
 * Returns a position object where 2 lines (represented by 4 position objects) intersect.
 * Throws a error if the lines do not intersect.
 * 
 * @param {PositionObject} p1
 * @param {PositionObject} p2
 * @param {PositionObject} p3
 * @param {PositionObject} p4
 * @returns {PositionObject}
 */
function getIntersection(p1, p2, p3, p4) {
  // usage: https://dirask.com/posts/JavaScript-how-to-calculate-intersection-point-of-two-lines-for-given-4-points-VjvnAj

  // down part of intersection point formula
  var d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
  var d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
  var d = d1 - d2;
  if (d === 0) {
    throw new Error('Number of intersection points is zero or infinity.');
  }

  // upper part of intersection point formula
  var u1 = p1.x * p2.y - p1.y * p2.x; // (x1 * y2 - y1 * x2)
  var u4 = p3.x * p4.y - p3.y * p4.x; // (x3 * y4 - y3 * x4)

  var u2x = p3.x - p4.x; // (x3 - x4)
  var u3x = p1.x - p2.x; // (x1 - x2)
  var u2y = p3.y - p4.y; // (y3 - y4)
  var u3y = p1.y - p2.y; // (y1 - y2)

  // intersection point formula
  var px = (u1 * u2x - u3x * u4) / d;
  var py = (u1 * u2y - u3y * u4) / d;
  return {
    x: px,
    y: py
  };
}

/**
 * Returns the handle position object when rotated around the pivot point (position object) by the given angle (in degrees).
 * 
 * @param {PositionObject} pivot 
 * @param {PositionObject} handle 
 * @param {number} angle 
 * @returns 
 */
function rotate(pivot, handle, angle) {
  const radians = Math.PI / 180 * angle;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: cos * (handle.x - pivot.x) + sin * (handle.y - pivot.y) + pivot.x,
    y: cos * (handle.y - pivot.y) - sin * (handle.x - pivot.x) + pivot.y
  };
}

/**
 * Returns a resulting position object of a elipse rotation around a pivot position object with the given angle and radius (x, y).
 * 
 * @param {PositionObject} pivot
 * @param {number} xRadius
 * @param {number} yRadius
 * @param {number} angle
 * @returns 
 */
function rotateElipse(pivot, xRadius, yRadius, angle) {
  'https://www.desmos.com/calculator/aqlhivzbvs';

  // -> rotated elipse equations
  'https://www.mathopenref.com/coordparamellipse.html';

  // -> good explanation about elipse parametric equations
  'https://math.stackexchange.com/questions/941490/whats-the-parametric-equation-for-the-general-form-of-an-ellipse-rotated-by-any?noredirect=1&lq=1&newreg=fd8890e3dad245b0b6a0f182ba22f7f3';

  // -> good explanation of rotated parametric elipse equations
  // rotates points[x, y] some degrees about an origin [cx, cy]
  xRadius = xRadius * 1.5;
  yRadius = yRadius * 1.5;
  const cosAngle = Math.cos(Math.PI / 180 * (angle + 180));
  const sinAngle = Math.sin(Math.PI / 180 * (angle + 180));
  return {
    x: -xRadius * cosAngle + pivot.x,
    y: -yRadius * sinAngle + pivot.y
  };
}

/**
 * Returns the angle of the gradient
 * 
 * @param {PositionObject[]} handles
 * @returns {number}
 */
function getGradientAngle(handles) {
  if (handles.length < 3) {
    throw new Error("Three handles are required to calculate the angle of the gradient");
  }
  let [pivotPoint, directionGuidePoint, angleGuidePoint] = [...handles];
  const refSlope = (directionGuidePoint.y - pivotPoint.y) / (directionGuidePoint.x - pivotPoint.x);
  const refAngle = Number((Math.atan(refSlope) * 180 / Math.PI).toFixed(2));
  const normalizedDirectionGuidePoint = rotate(pivotPoint, directionGuidePoint, refAngle);
  const normalizedAngleGuidePoint = rotate(pivotPoint, angleGuidePoint, refAngle);
  if (normalizedDirectionGuidePoint.x - pivotPoint.x > 0 && normalizedAngleGuidePoint.y - pivotPoint.y > 0 || normalizedDirectionGuidePoint.x - pivotPoint.x < 0 && normalizedAngleGuidePoint.y - pivotPoint.y < 0) {
    // Since Figma allows the angle guide point to move to the either side
    // of the direction axis (defined by the pivot point and direction guide point) 
    // we will swap angle guide point and the pivot point to compensate for the fact
    // that the direction of the angle guide point is on the opposite side of the direction axis
    pivotPoint = handles[2];
    angleGuidePoint = handles[0];
  }
  const slope = (angleGuidePoint.y - pivotPoint.y) / (angleGuidePoint.x - pivotPoint.x);
  const radians = Math.atan(slope);
  let degrees = radians * 180 / Math.PI;
  if (pivotPoint.x < angleGuidePoint.x) {
    degrees = degrees + 180;
  } else if (pivotPoint.x > angleGuidePoint.x) {
    if (pivotPoint.y < angleGuidePoint.y) {
      degrees = 360 - Math.abs(degrees);
    }
  } else if (pivotPoint.x === angleGuidePoint.x) {
    // horizontal line
    if (pivotPoint.y < angleGuidePoint.y) {
      degrees = 360 - Math.abs(degrees); // on negative y-axis
    } else {
      degrees = Math.abs(degrees); // on positive y-axis
    }
  }

  return Number(degrees.toFixed(2));
}

/**
 * Returns params (angle and stops) necessary for a linear gradient to be constructed. 
 * @param {GradientObject} gradient 
 * @returns {number[]}
 */
function getLinearGradientParamsFromGradientObject(gradient) {
  const gradientAngle = getGradientAngle(gradient.handles);

  // this next section finds the linear gradient line segment -> https://stackoverflow.com/questions/51881307 creating-a-css-linear-gradient-based-on-two-points-relative-to-a-rectangle
  // calculating gradient line size (scalar) and change in x, y direction (coords)

  const lineChangeCoords = [gradient.handles[1].x - gradient.handles[0].x, 1 - gradient.handles[1].y - (1 - gradient.handles[0].y)];
  const currentLineSize = Math.sqrt(lineChangeCoords[0] ** 2 + lineChangeCoords[1] ** 2);

  // creating arbitrary gradient line 
  const desiredLength = 1;
  const scaleFactor = (desiredLength - currentLineSize) / 2 / currentLineSize;
  const scaleCoords = {
    x: lineChangeCoords[0] * scaleFactor,
    y: lineChangeCoords[1] * scaleFactor
  };
  const scaledArbGradientLine = [{
    x: gradient.handles[0].x - scaleCoords.x,
    y: gradient.handles[0].y + scaleCoords.y
  }, {
    x: gradient.handles[1].x + scaleCoords.x,
    y: gradient.handles[1].y - scaleCoords.y
  }];

  // getting relevant corners     
  const topCenter = gradientAngle > 90 && gradientAngle <= 180 || gradientAngle > 270 && gradientAngle <= 360 ? {
    x: 0,
    y: 0
  } : {
    x: 1,
    y: 0
  };
  const bottomCenter = gradientAngle >= 0 && gradientAngle <= 90 || gradientAngle > 180 && gradientAngle <= 270 ? {
    x: 0,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const topLine = [{
    x: topCenter.x - desiredLength / 2,
    y: topCenter.y
  }, {
    x: topCenter.x + desiredLength / 2,
    y: topCenter.y
  }];
  const rotatedTopLine = [rotateElipse(topCenter, topCenter.x - topLine[0].x, topCenter.x - topLine[0].x, gradientAngle), rotateElipse(topCenter, topCenter.x - topLine[1].x, topCenter.x - topLine[1].x, gradientAngle)];
  const bottomLine = [{
    x: bottomCenter.x - desiredLength / 2,
    y: bottomCenter.y
  }, {
    x: bottomCenter.x + desiredLength / 2,
    y: bottomCenter.y
  }];
  const rotatedBottomLine = [rotateElipse(bottomCenter, bottomCenter.x - bottomLine[0].x, bottomCenter.x - bottomLine[0].x, gradientAngle), rotateElipse(bottomCenter, bottomCenter.x - bottomLine[1].x, bottomCenter.x - bottomLine[1].x, gradientAngle)];

  // calculating relevant portion of gradient line (the actual gradient line -> taking POI of perpendicular lines w/ arbitrary gradient line)
  const topLineIntersection = getIntersection(rotatedTopLine[0], rotatedTopLine[1], scaledArbGradientLine[0], scaledArbGradientLine[1]);
  const bottomLineIntersection = getIntersection(rotatedBottomLine[0], rotatedBottomLine[1], scaledArbGradientLine[0], scaledArbGradientLine[1]);
  const gradientLineDistance = Math.sqrt((bottomLineIntersection.y - topLineIntersection.y) ** 2 + (bottomLineIntersection.x - topLineIntersection.x) ** 2);
  let params = [gradientAngle];
  gradient.stops.map(stop => {
    let gradientStartPoint = {
      x: 0,
      y: 0
    };
    if (gradient.handles[0].y < gradient.handles[1].y) {
      gradientStartPoint = topLineIntersection.y < bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection;
    } else {
      gradientStartPoint = topLineIntersection.y > bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection;
    }
    const stopX = stop.position * lineChangeCoords[0] + gradient.handles[0].x;
    const stopY = gradient.handles[0].y - stop.position * lineChangeCoords[1];
    let colorDistance = Math.sqrt((stopY - gradientStartPoint.y) ** 2 + (stopX - gradientStartPoint.x) ** 2);
    let actualPercentage = colorDistance / gradientLineDistance;
    params.push(Number((Number(actualPercentage.toFixed(4)) * 100).toFixed(2)));
  });
  return params;
}

/**
 * Returns the values (shape and position) necessary for a radial gradient to be constructed. 
 * 
 * @param {PositionObject[]} handles 
 * @returns {number[]}
 */
function getRadialGradientParamsFromGradientObject(gradient) {
  return [Math.abs(Number((gradient.handles[1].x - gradient.handles[0].x).toFixed(4))) * 100, Math.abs(Number((gradient.handles[2].y - gradient.handles[0].y).toFixed(4))) * 100, Number(gradient.handles[0].x.toFixed(4)) * 100, Number(gradient.handles[0].y.toFixed(4)) * 100];
}

const getScssVariableName = tokens => {
  const {
    component,
    property,
    part,
    theme = 'light',
    type = 'default',
    state = 'default'
  } = tokens;
  const parts = [component, type === 'default' ? '' : type, part, theme === 'light' ? '' : theme, state === 'default' ? '' : state, property].filter(Boolean);
  return `$${parts.join('-')}`;
};
const getCssVariableName = tokens => {
  const {
    component,
    property,
    part,
    theme = 'light',
    type = 'default',
    state = 'default'
  } = tokens;
  const parts = [component, type === 'default' ? '' : type, part, theme === 'light' ? '' : theme, state === 'default' ? '' : state, property].filter(Boolean);
  return `--${parts.join('-')}`;
};

/**
 * Generate a CSS gradient from a color gradient object
 
 * @todo Support other kinds of gradients
 * @param color
 * @returns
 */
function transformGradientToCss(color, paintType = 'GRADIENT_LINEAR') {
  // generate the rgbs) {}
  let params = [];
  let colors = [];
  if (paintType === 'SOLID') {
    params = getLinearGradientParamsFromGradientObject(color);
    colors = color.stops.map(stop => `rgba(${figmaColorToWebRGB(stop.color).join(', ')})`);
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }
  if (paintType === 'GRADIENT_LINEAR') {
    params = getLinearGradientParamsFromGradientObject(color);
    colors = color.stops.map((stop, i) => `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${params[i + 1]}%`);
    return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
  }
  if (paintType === 'GRADIENT_RADIAL') {
    const params = getRadialGradientParamsFromGradientObject(color);
    colors = color.stops.map(stop => `rgba(${figmaColorToWebRGB(stop.color).join(', ')}) ${Number(Number((stop.position ?? 0).toFixed(4)) * 100).toFixed(2)}%`);
    return `radial-gradient(${params[0]}% ${params[1]}% at ${params[2]}% ${params[3]}%, ${colors.join(', ')})`;
  }
  return ``;
}
function transformFigmaPaintToGradient(paint) {
  if (paint.type === 'SOLID') {
    // Process solid as gradient
    const gradientColor = paint.color && paint.opacity ? {
      ...paint.color,
      a: paint.opacity
    } : paint.color;
    return {
      blend: paint.blendMode,
      handles: [{
        x: 0,
        y: 0
      }, {
        x: 0,
        y: 0
      }, {
        x: 1,
        y: 0
      }],
      stops: [{
        color: gradientColor,
        position: null
      }, {
        color: gradientColor,
        position: null
      }]
    };
  }
  if (isValidGradientType(paint.type)) {
    return {
      blend: paint.blendMode,
      handles: paint.gradientHandlePositions ?? [],
      stops: paint.gradientStops ?? []
    };
  }
  return null;
}

/**
 * Converts figma color to a hex (string) value.
 * 
 * @param {FigmaTypes.Color} color 
 * @returns {string}
 * 
 * @example
 * // returns #001aff
 * figmaRGBToHex({ r: 0, g: 0.1, b: 1, a: 1 })
 */
function transformFigmaColorToHex(color) {
  let hex = '#';
  const rgb = figmaColorToWebRGB(color);
  hex += ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
  if (rgb[3] !== undefined) {
    const a = Math.round(rgb[3] * 255).toString(16);
    if (a.length == 1) {
      hex += '0' + a;
    } else {
      if (a !== 'ff') hex += a;
    }
  }
  return hex;
}
const transformFigmaColorToCssColor = color => {
  const {
    r,
    g,
    b,
    a
  } = color;
  if (a === 1) {
    // transform to hex
    return transformFigmaColorToHex(color);
  }
  return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${parseFloat(a.toFixed(3))})`;
};
function transformFigmaPaintToCssColor(paint, asLinearGradient = false) {
  if (paint.type === 'SOLID' && !asLinearGradient) {
    if (!paint.color) {
      return null;
    }
    const {
      r,
      g,
      b,
      a
    } = paint.color || {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    };
    return transformFigmaColorToCssColor({
      r,
      g,
      b,
      a: a * (paint.opacity ?? 1)
    });
  }
  const gradient = transformFigmaPaintToGradient(paint);
  return gradient ? transformGradientToCss(gradient, paint.type) : null;
}
const transformFigmaFillsToCssColor = (fills, fallbackColor = 'transparent', fallbackBlendMode = 'normal') => {
  fills = [...fills].reverse();
  const count = fills?.length ?? 0;
  const hasMoreThanOneLayer = count > 1;
  const colorValue = count > 0 ? fills.map((fill, i) => transformFigmaPaintToCssColor(fill, hasMoreThanOneLayer && i !== count - 1)).filter(Boolean).join(', ') : fallbackColor;
  const blendValue = hasMoreThanOneLayer ? fills.map(fill => fill.blendMode.toLowerCase().replaceAll('_', '-')).filter(Boolean).join(', ') : fallbackBlendMode;
  return {
    color: colorValue,
    blend: blendValue
  };
};
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
const transformFigmaEffectToCssBoxShadow = effect => {
  const {
    type,
    color,
    offset,
    radius,
    visible,
    spread
  } = effect;
  if (!visible) {
    return '';
  }
  if (isShadowEffectType(type) && color && offset) {
    const {
      x,
      y
    } = offset;
    return `${x}px ${y}px ${radius ?? 0}px ${spread ? spread + 'px ' : ''}${transformFigmaColorToCssColor(color)}${type === 'INNER_SHADOW' ? ' inset' : ''}`;
  }
  return '';
};

/**
 * Converts figma color to a RGB(A) in form of a array.
 * 
 * @param {FigmaTypes.Color} color 
 * @returns {string}
 * 
 * @example
 * // returns [226, 18, 17]
 * figmaRGBToWebRGB({r: 0.887499988079071, g: 0.07058823853731155, b: 0.0665624737739563, a: 1})
 */
function figmaColorToWebRGB(color) {
  if ('a' in color && color.a !== 1) {
    return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), Math.round(color.a * 100) / 100];
  }
  return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)];
}
const transformFigmaNumberToCss = value => {
  return parseFloat(value.toFixed(3));
};

const toMachineName = name => {
  return name.toLowerCase().replace(/[^a-z0-9\s\-]/gi, '').replace(/\s\-\s|\s+/gi, '-');
};
const fieldData = name => {
  let nameArray = name.split('/');
  const data = {
    name: '',
    machine_name: '',
    group: ''
  };
  if (nameArray[1]) {
    data.group = toMachineName(nameArray[0]);
    data.name = nameArray[1];
    data.machine_name = toMachineName(data.name);
  } else {
    data.name = nameArray[0];
    data.machine_name = toMachineName(data.name);
  }
  return data;
};
const isArray = input => {
  return Array.isArray(input);
};
const getFileDesignTokens = async (fileId, accessToken) => {
  try {
    const apiResponse = await getFileStyles(fileId, accessToken);
    const file = apiResponse.data;
    const styles = file.meta.styles;
    const nodeMeta = styles.map(item => ({
      node_id: item.node_id,
      sort_position: item.sort_position
    }));
    const nodeIds = nodeMeta.sort((a, b) => {
      if (a.sort_position < b.sort_position) {
        return -1;
      }
      if (a.sort_position > b.sort_position) {
        return 1;
      }
      return 0;
    }).map(item => item.node_id);
    const childrenApiResponse = await getFileNodes(fileId, nodeIds, accessToken);
    const tokens = Object.entries(childrenApiResponse.data.nodes);
    const colorsArray = [];
    const effectsArray = [];
    const typographyArray = [];
    tokens.forEach(([_, node]) => {
      if (!node) {
        return;
      }
      let document = node.document;
      if (document.type === 'RECTANGLE') {
        let {
          name,
          machine_name,
          group
        } = fieldData(document.name);
        if (isArray(document.effects) && document.effects.length > 0) {
          effectsArray.push({
            name,
            machineName: machine_name,
            group,
            effects: document.effects.filter(effect => isValidEffectType(effect.type) && effect.visible).map(effect => ({
              type: effect.type,
              value: isShadowEffectType(effect.type) ? transformFigmaEffectToCssBoxShadow(effect) : ''
            }))
          });
        } else if (isArray(document.fills) && document.fills[0] && (document.fills[0].type === 'SOLID' || isValidGradientType(document.fills[0].type))) {
          const color = transformFigmaFillsToCssColor(document.fills);
          colorsArray.push({
            name,
            group,
            value: color.color,
            blend: color.blend,
            sass: `$color-${group}-${machine_name}`,
            machineName: machine_name
          });
        }
      }
      if (document.type === 'TEXT') {
        let {
          machine_name,
          group
        } = fieldData(document.name);
        let color;
        if (isArray(document.fills) && document.fills[0] && document.fills[0].type === 'SOLID' && document.fills[0].color) {
          color = transformFigmaColorToHex(document.fills[0].color);
        }
        typographyArray.push({
          name: document.name,
          machine_name,
          group,
          values: {
            // @ts-ignore
            ...document.style,
            color
          }
        });
      }
    });
    chalk__default["default"].green('Colors, Effects and Typography Exported');
    const data = {
      color: colorsArray,
      effect: effectsArray,
      typography: typographyArray
    };
    return data;
  } catch (err) {
    throw new Error('An error occured fetching Colors and Typography.  This typically happens when the library cannot be read from Handoff');
  }
};

const createDocumentationObject = async (figmaFileKey, figmaAccessToken) => {
  const components = await getFileComponentTokens(figmaFileKey, figmaAccessToken);
  // Log out components
  if (Object.keys(components).filter(component => components[component].length > 0).length > 0) {
    Object.keys(components).map(component => {
      if (components[component].length === 0) {
        console.error(chalk__default["default"].grey(`${lodash.startCase(component)} could not be located in the figma file`));
      } else {
        console.log(chalk__default["default"].green(`${lodash.startCase(component)} exported:`), components[component].length);
      }
    });
  }
  const design = await getFileDesignTokens(figmaFileKey, figmaAccessToken);
  const icons = await assetsExporter(figmaFileKey, figmaAccessToken, 'Icons');
  const logos = await assetsExporter(figmaFileKey, figmaAccessToken, 'Logo');
  return {
    timestamp: new Date().toISOString(),
    design,
    components,
    assets: {
      icons,
      logos
    }
  };
};

exports.createDocumentationObject = createDocumentationObject;
exports.filterOutNull = filterOutNull;
exports.filterOutUndefined = filterOutUndefined;
exports.generateChangelogRecord = generateChangelogRecord;
exports.getCssVariableName = getCssVariableName;
exports.getFetchConfig = getFetchConfig;
exports.getRequestCount = getRequestCount;
exports.getScssVariableName = getScssVariableName;
exports.mapComponentSize = mapComponentSize;
exports.transformFigmaColorToCssColor = transformFigmaColorToCssColor;
exports.transformFigmaColorToHex = transformFigmaColorToHex;
exports.transformFigmaEffectToCssBoxShadow = transformFigmaEffectToCssBoxShadow;
exports.transformFigmaFillsToCssColor = transformFigmaFillsToCssColor;
exports.transformFigmaNumberToCss = transformFigmaNumberToCss;
exports.transformFigmaTextAlignToCss = transformFigmaTextAlignToCss;
exports.transformFigmaTextCaseToCssTextTransform = transformFigmaTextCaseToCssTextTransform;
exports.transformFigmaTextDecorationToCss = transformFigmaTextDecorationToCss;
exports.zipAssets = zipAssets;
