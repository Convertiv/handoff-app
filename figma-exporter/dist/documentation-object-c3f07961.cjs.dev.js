'use strict';

var isEqual = require('lodash/isEqual');
var axios = require('axios');
var archiver = require('archiver');
var chalk = require('chalk');
var _ = require('lodash');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

var isEqual__default = /*#__PURE__*/_interopDefault(isEqual);
var axios__default = /*#__PURE__*/_interopDefault(axios);
var archiver__default = /*#__PURE__*/_interopDefault(archiver);
var chalk__default = /*#__PURE__*/_interopDefault(chalk);
var ___default = /*#__PURE__*/_interopDefault(_);

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
const isValidVariantProperty = variantProperty => {
  return ['THEME', 'TYPE', 'STATE', 'ACTIVITY', 'LAYOUT', 'SIZE'].includes(variantProperty);
};
const isExportable = exportable => {
  return ['BACKGROUND', 'BORDER', 'SPACING', 'TYPOGRAPHY', 'FILL', 'EFFECT', 'OPACITY', 'SIZE'].includes(exportable);
};
const isValidNodeType = type => {
  return ['DOCUMENT', 'CANVAS', 'FRAME', 'GROUP', 'VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'ELLIPSE', 'REGULAR_POLYGON', 'RECTANGLE', 'TEXT', 'SLICE', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(type);
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

function extractComponents(componentSetComponentsResult, definition) {
  const supportedVariantPropertiesWithParams = getComponentSupportedVariantProperties(definition);
  const supportedVariantProperties = supportedVariantPropertiesWithParams.map(item => item.property);
  const stateVariantProperty = supportedVariantPropertiesWithParams.filter(item => item.property === 'STATE');
  const componentSharedStates = stateVariantProperty.length > 0 ? stateVariantProperty[0].params : null;
  const sharedStateComponents = {};
  const components = ___default["default"].uniqBy(componentSetComponentsResult.components.map(component => {
    // Design
    const theme = supportedVariantProperties.includes("THEME") ? normalizeNamePart(getComponentNamePart(component.name, 'Theme') ?? 'light') : undefined;
    const type = supportedVariantProperties.includes("TYPE") ? normalizeNamePart(getComponentNamePart(component.name, 'Type') ?? 'default') : undefined;
    const state = supportedVariantProperties.includes("STATE") ? normalizeNamePart(getComponentNamePart(component.name, 'State') ?? 'default') : undefined;
    const activity = supportedVariantProperties.includes("ACTIVITY") ? normalizeNamePart(getComponentNamePart(component.name, 'Activity') ?? '') : undefined;
    // Layout
    const layout = supportedVariantProperties.includes("LAYOUT") ? normalizeNamePart(getComponentNamePart(component.name, 'Layout') ?? '') : undefined;
    const size = supportedVariantProperties.includes("SIZE") ? normalizeNamePart(getComponentNamePart(component.name, 'Size') ?? '') : undefined;
    const instanceNode = layout || size ? component : findChildNodeWithType(component, 'INSTANCE');
    if (!instanceNode) {
      throw new Error(`No instance node found for component ${component.name}`);
    }
    const partsToExport = definition.parts;
    if (!partsToExport) {
      return null;
    }
    const parts = partsToExport.reduce((previous, current) => {
      const tokenSets = extractComponentPartTokenSets(instanceNode, current, {
        activity
      });
      return {
        ...previous,
        ...{
          [current.id]: tokenSets
        }
      };
    }, {});
    const name = definition.id ?? '';
    const description = componentSetComponentsResult.metadata[component.id]?.description ?? '';
    if (layout || size) {
      return {
        id: generateLayoutId(layout, size),
        name,
        description,
        componentType: 'layout',
        size,
        layout,
        parts
      };
    }
    const designComponent = {
      id: generateDesignId(theme, type, state, activity),
      name,
      description,
      theme,
      type,
      state,
      activity,
      componentType: 'design',
      parts
    };
    if (state && (componentSharedStates ?? []).includes(state)) {
      sharedStateComponents[state] ??= {};
      sharedStateComponents[state][theme ?? 'light'] = designComponent;
      return null;
    }
    return designComponent;
  }).filter(filterOutNull), 'id');
  if (componentSharedStates && Object.keys(sharedStateComponents).length > 0) {
    components.filter(component => {
      return component.componentType === 'design' && component.state === 'default';
    }).forEach(component => {
      Object.keys(sharedStateComponents).forEach(stateToApply => {
        const sharedStateComponent = sharedStateComponents[stateToApply][component.theme ?? 'light'];
        components.push({
          ...sharedStateComponent,
          id: generateDesignId(component.theme, component.type, sharedStateComponent.state, component.activity),
          theme: component.theme,
          type: component.type,
          activity: component.activity
        });
      });
    });
  }
  return components;
}
function extractComponentPartTokenSets(root, part, tokens) {
  if (!part.tokens || part.tokens.length === 0) {
    return [];
  }
  const tokenSets = [];
  for (const def of part.tokens) {
    if (!def.from || !def.export || def.export.length === 0) {
      continue;
    }
    const node = resolveNodeFromPath(root, def.from, tokens);
    if (!node) {
      continue;
    }
    for (const exportable of def.export) {
      if (!isExportable(exportable)) {
        continue;
      }
      const tokenSet = extractNodeExportable(node, exportable);
      if (!tokenSet) {
        continue;
      }
      const conflictingTokenSetIdx = tokenSets.map(set => set.name).indexOf(exportable);
      if (conflictingTokenSetIdx > -1) {
        tokenSets[conflictingTokenSetIdx] = mergeTokenSets(tokenSets[conflictingTokenSetIdx], tokenSet);
      } else {
        tokenSets.push(tokenSet);
      }
    }
  }
  return tokenSets;
}
function resolveNodeFromPath(root, path, tokens) {
  const pathArr = path.split('>').filter(part => part !== "$").map(part => part.trim());
  let currentNode = root;
  for (const path of pathArr) {
    const nodeDef = parsePathNodeParams(path);
    if (!nodeDef.type) {
      continue;
    }
    nodeDef.name = nodeDef.name ? nodeDef.name.replaceAll('$activity', tokens?.activity ?? '') : nodeDef.name;
    currentNode = nodeDef.name ? findChildNodeWithTypeAndName(currentNode, nodeDef.type, nodeDef.name) : findChildNodeWithType(currentNode, nodeDef.type);
    if (!currentNode) {
      return null;
    }
  }
  return currentNode;
}
function parsePathNodeParams(path) {
  const type = path.split('[')[0];
  const selectors = new Map();
  const selectorsMatch = path.match(/\[(.*?)\]/);
  if (selectorsMatch) {
    selectorsMatch[1].split(',').forEach(selector => {
      const [key, value] = selector.split('=');
      if (!(key && value)) {
        return;
      }
      selectors.set(key, value.replace(/['"]/g, ''));
    });
  }
  return {
    type: isValidNodeType(type) ? type : undefined,
    name: selectors.get("name")
  };
}
function mergeTokenSets(first, second) {
  return ___default["default"].mergeWith({}, first, second, (a, b) => b === null ? a : undefined);
}
function getComponentSupportedVariantProperties(definition) {
  return (definition.options.exporter.supportedVariantProps ?? []).map(variantProperty => {
    const regex = /^([^:]+)(?:\(([^)]+)\))?$/;
    const matches = variantProperty.match(regex);
    if (!matches || matches.length !== 3) {
      return null; // ignore if format is invalid
    }

    const key = matches[1].trim();
    const value = matches[2]?.trim();
    if (!isValidVariantProperty(key)) {
      return null; // ignore if variant property isn't supported
    }

    return {
      property: key,
      params: value ? value.substring(1).split(':') : null
    };
  }).filter(filterOutNull);
}
function generateDesignId(theme, type, state, activity) {
  const parts = ['design'];
  if (theme !== undefined) parts.push(`theme-${theme}`);
  if (type !== undefined) parts.push(`type-${type}`);
  if (state !== undefined) parts.push(`state-${state}`);
  if (activity !== undefined) parts.push(`activity-${activity}`);
  return parts.join('-');
}
function generateLayoutId(layout, size) {
  const parts = [];
  if (layout) parts.push(`layout-${layout}`);
  if (size) parts.push(`size-${size}`);
  return parts.join('-');
}
function extractNodeFill(node) {
  return {
    name: 'FILL',
    color: 'fills' in node ? node.fills.slice() : []
  };
}
function extractNodeTypography(node) {
  const styleInNode = ('style' in node);
  const charactersInNode = ('style' in node);
  return {
    name: 'TYPOGRAPHY',
    fontFamily: styleInNode ? node.style.fontFamily : '',
    fontSize: styleInNode ? node.style.fontSize : 16,
    fontWeight: styleInNode ? node.style.fontWeight : 100,
    lineHeight: styleInNode ? (node.style.lineHeightPercentFontSize ?? 100) / 100 : 1,
    letterSpacing: styleInNode ? node.style.letterSpacing : 0,
    textAlignHorizontal: styleInNode ? node.style.textAlignHorizontal : 'LEFT',
    textDecoration: styleInNode ? node.style.textDecoration ?? 'NONE' : 'NONE',
    textCase: styleInNode ? node.style.textCase ?? 'ORIGINAL' : 'ORIGINAL',
    characters: charactersInNode ? node.characters : ''
  };
}
function extractNodeEffect(node) {
  return {
    name: 'EFFECT',
    effect: 'effects' in node ? [...node.effects] : []
  };
}
function extractNodeBorder(node) {
  return {
    name: 'BORDER',
    weight: 'strokeWeight' in node ? node.strokeWeight ?? 0 : 0,
    radius: 'cornerRadius' in node ? node.cornerRadius ?? 0 : 0,
    strokes: 'strokes' in node ? node.strokes.slice() : []
  };
}
function extractNodeSpacing(node) {
  return {
    name: 'SPACING',
    padding: {
      TOP: 'paddingTop' in node ? node.paddingTop ?? 0 : 0,
      RIGHT: 'paddingRight' in node ? node.paddingRight ?? 0 : 0,
      BOTTOM: 'paddingBottom' in node ? node.paddingBottom ?? 0 : 0,
      LEFT: 'paddingLeft' in node ? node.paddingLeft ?? 0 : 0
    },
    spacing: 'itemSpacing' in node ? node.itemSpacing ?? 0 : 0
  };
}
function extractNodeBackground(node) {
  return {
    name: 'BACKGROUND',
    background: 'background' in node ? node.background.slice() : []
  };
}
function extractNodeOpacity(node) {
  return {
    name: 'OPACITY',
    opacity: 'opacity' in node ? node.opacity ?? 1 : 1
  };
}
function extractNodeSize(node) {
  return {
    name: 'SIZE',
    width: 'absoluteBoundingBox' in node ? node.absoluteBoundingBox.width ?? 0 : 0,
    height: 'absoluteBoundingBox' in node ? node.absoluteBoundingBox.height ?? 0 : 0
  };
}
function extractNodeExportable(node, exportable) {
  switch (exportable) {
    case "BACKGROUND":
      return extractNodeBackground(node);
    case "SPACING":
      return extractNodeSpacing(node);
    case "BORDER":
      return extractNodeBorder(node);
    case "EFFECT":
      return extractNodeEffect(node);
    case "TYPOGRAPHY":
      return extractNodeTypography(node);
    case "FILL":
      return extractNodeFill(node);
    case "OPACITY":
      return extractNodeOpacity(node);
    case "SIZE":
      return extractNodeSize(node);
    default:
      return null;
  }
}

const getComponentSetComponents = (metadata, componentSets, componentMetadata, name) => {
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
};
const getFileComponentTokens = async (fileId, accessToken, exportables) => {
  let fileComponentSetsRes;
  try {
    fileComponentSetsRes = await getComponentSets(fileId, accessToken);
  } catch (err) {
    throw new Error('Handoff could not access the figma file. \n - Check your file id, dev token, and permissions. \n - For more information on permissions, see https://www.handoff.com/docs/guide');
  }
  if (fileComponentSetsRes.data.meta.component_sets.length === 0) {
    console.error(chalk__default["default"].red('Handoff could not find any published components.\n  - If you expected components, please check to make sure you published them.\n  - You must have a paid license to publish components.\n - For more information, see https://www.handoff.com/docs/guide'));
    console.log(chalk__default["default"].blue('Continuing fetch with only colors and typography design foundations'));
    return {};
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
  const componentTokens = {};
  for (const exportable of exportables) {
    if (!exportable.id) {
      console.error(chalk__default["default"].red('Handoff could not process exportable component without a id.\n  - Please update the exportable definition to include the name of the component.\n - For more information, see https://www.handoff.com/docs/guide'));
      continue;
    }
    if (!exportable.options.exporter.search) {
      console.error(chalk__default["default"].red('Handoff could not process exportable component without search.\n  - Please update the exportable definition to include the search property.\n - For more information, see https://www.handoff.com/docs/guide'));
      continue;
    }
    componentTokens[exportable.id ?? ''] = extractComponents(getComponentSetComponents(fileComponentSetsRes.data.meta.component_sets, componentSets, componentMetadata, exportable.options.exporter.search), exportable);
  }
  return componentTokens;
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

const createDocumentationObject = async (figmaFileKey, figmaAccessToken, exportables) => {
  const components = await getFileComponentTokens(figmaFileKey, figmaAccessToken, exportables);
  // Log out components
  if (Object.keys(components).filter(component => components[component].length > 0).length > 0) {
    Object.keys(components).map(component => {
      if (components[component].length === 0) {
        console.error(chalk__default["default"].grey(`${_.startCase(component)} could not be located in the figma file`));
      } else {
        console.log(chalk__default["default"].green(`${_.startCase(component)} exported:`), components[component].length);
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
exports.getRequestCount = getRequestCount;
exports.transformFigmaEffectToCssBoxShadow = transformFigmaEffectToCssBoxShadow;
exports.transformFigmaFillsToCssColor = transformFigmaFillsToCssColor;
exports.transformFigmaTextAlignToCss = transformFigmaTextAlignToCss;
exports.transformFigmaTextCaseToCssTextTransform = transformFigmaTextCaseToCssTextTransform;
exports.transformFigmaTextDecorationToCss = transformFigmaTextDecorationToCss;
exports.zipAssets = zipAssets;
