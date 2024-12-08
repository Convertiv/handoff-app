"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("../utils");
const index_1 = require("../../utils/index");
/**
 * Given a list of components, a component definition, and a handoff object,
 * this function will extract the component instances
 * @param components
 * @param definition
 * @param handoff
 * @param legacyDefinition
 * @returns ComponentInstance[]
 */
function extractComponentInstances(components, definition, handoff, legacyDefinition) {
    var _a;
    const options = definition.options;
    const sharedComponentVariantIds = (_a = options.exporter.sharedComponentVariants) !== null && _a !== void 0 ? _a : [];
    const sharedInstances = [];
    const componentInstances = components.map((component) => {
        var _a, _b, _c, _d, _e, _f;
        const variantProperties = (0, utils_1.extractComponentInstanceVariantProps)(component.node.name, options.exporter.variantProperties);
        const id = generateComponentId(variantProperties);
        const name = (0, index_1.slugify)(definition.name);
        const description = (_b = (_a = component.metadata[component.node.id]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '';
        let rootNode = component.node;
        if (legacyDefinition) {
            let isLayoutComponent = false;
            if (!!((_e = (_d = (_c = legacyDefinition === null || legacyDefinition === void 0 ? void 0 : legacyDefinition.options) === null || _c === void 0 ? void 0 : _c.exporter) === null || _d === void 0 ? void 0 : _d.supportedVariantProps) === null || _e === void 0 ? void 0 : _e.layout)) {
                legacyDefinition.options.exporter.supportedVariantProps.layout.forEach((layoutVariantProp) => {
                    if (!isLayoutComponent && variantProperties.get(layoutVariantProp) !== undefined) {
                        isLayoutComponent = true;
                    }
                });
                if (!isLayoutComponent) {
                    rootNode = (0, utils_1.findChildNodeWithType)(component.node, 'INSTANCE');
                }
                if (!rootNode) {
                    throw new Error(`No instance node found for component ${component.node.name}`);
                }
            }
        }
        if (!definition.parts || definition.parts.length === 0) {
            return [];
        }
        const parts = definition.parts.reduce((previous, current) => {
            return Object.assign(Object.assign({}, previous), { [current.id || '$']: extractComponentPartTokenSets(rootNode, current, variantProperties, handoff) });
        }, {});
        const instance = {
            id,
            name,
            description,
            variantProperties: variantProperties,
            parts,
        };
        const isSharedComponentVariant = ((_f = sharedComponentVariantIds.findIndex((s) => s.componentId === component.node.id)) !== null && _f !== void 0 ? _f : -1) > -1;
        if (isSharedComponentVariant) {
            sharedInstances.push(Object.assign(Object.assign({}, instance), { componentId: component.node.id }));
            return [];
        }
        const result = [instance];
        sharedInstances
            .filter((sharedInstance) => {
            var _a, _b, _c, _d, _e;
            const sharedInstanceDefinition = options.exporter.sharedComponentVariants.find((item) => item.componentId === sharedInstance.componentId);
            if (!sharedInstanceDefinition) {
                return false;
            }
            if (instance.variantProperties.get(sharedInstanceDefinition.sharedVariantProperty) !==
                ((_d = (_c = ((_b = (_a = handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.options) !== null && _b !== void 0 ? _b : {})[sharedInstance.name]) === null || _c === void 0 ? void 0 : _c.defaults) !== null && _d !== void 0 ? _d : {})[sharedInstanceDefinition.sharedVariantProperty.toLowerCase()] // TODO: Remove when shared variant functionality gets removed
            ) {
                return false;
            }
            if (((_e = sharedInstanceDefinition.distinctiveVariantProperties) !== null && _e !== void 0 ? _e : []).length > 0) {
                for (const distinctiveVariantProperty of sharedInstanceDefinition.distinctiveVariantProperties) {
                    if (instance.variantProperties.get(distinctiveVariantProperty) !==
                        sharedInstance.variantProperties.get(distinctiveVariantProperty)) {
                        return false;
                    }
                }
            }
            return true;
        })
            .forEach((sharedInstance) => {
            const sharedInstanceDefinition = options.exporter.sharedComponentVariants.find((item) => item.componentId === sharedInstance.componentId);
            const additionalInstance = Object.assign({}, sharedInstance);
            const additionalInstanceVariantProps = new Map(instance.variantProperties);
            additionalInstanceVariantProps.set(sharedInstanceDefinition.sharedVariantProperty, sharedInstance.variantProperties.get(sharedInstanceDefinition.sharedVariantProperty));
            additionalInstance.id = generateComponentId(additionalInstanceVariantProps);
            additionalInstance.variantProperties = additionalInstanceVariantProps;
            result.push({
                id: additionalInstance.id,
                name: additionalInstance.name,
                description: additionalInstance.description,
                variantProperties: additionalInstanceVariantProps,
                parts: additionalInstance.parts,
            });
        });
        return result;
    });
    const instances = componentInstances.reduce((result, current) => {
        return [
            ...result,
            ...current.map((component) => ({
                id: component.id,
                name: component.name,
                description: component.description,
                variantProperties: Array.from(component.variantProperties.entries()),
                parts: component.parts,
            })),
        ];
    }, []);
    return lodash_1.default.uniqBy(instances, 'id');
}
exports.default = extractComponentInstances;
/**
 * Given a component instance, a component definition, and a handoff object,
 * this function will extract the component instance's token sets
 * @param root
 * @param part
 * @param tokens
 * @returns ExportTypes.TokenSets
 */
function extractComponentPartTokenSets(root, part, tokens, handoff) {
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
            if (!(0, utils_1.isExportable)(exportable)) {
                continue;
            }
            const tokenSet = extractNodeExportable(node, exportable);
            if (!tokenSet) {
                continue;
            }
            if (node.styles) {
                tokenSet.reference = getReferenceFromMap(node, tokenSet, handoff);
            }
            const conflictingTokenSetIdx = tokenSets.map((set) => set.name).indexOf(exportable);
            if (conflictingTokenSetIdx > -1) {
                tokenSets[conflictingTokenSetIdx] = mergeTokenSets(tokenSets[conflictingTokenSetIdx], tokenSet);
            }
            else {
                tokenSets.push(tokenSet);
            }
        }
    }
    return tokenSets;
}
/**
 * Get the reference from a node
 * @param node
 * @param handoff
 * @returns
 */
function getReferenceFromMap(node, tokenSet, handoff) {
    const styles = node.styles;
    if (!styles) {
        return undefined;
    }
    switch (tokenSet.name) {
        case 'BACKGROUND':
            if (styles.fills) {
                return handoff.designMap.colors[styles.fills] ? handoff.designMap.colors[styles.fills] : undefined;
            }
            else if (styles.fill) {
                return handoff.designMap.colors[styles.fill] ? handoff.designMap.colors[styles.fill] : undefined;
            }
            break;
        case 'FILL':
            if (styles.fills) {
                return handoff.designMap.colors[styles.fills] ? handoff.designMap.colors[styles.fills] : undefined;
            }
            else if (styles.fill) {
                return handoff.designMap.colors[styles.fill] ? handoff.designMap.colors[styles.fill] : undefined;
            }
            break;
        case 'BORDER':
            if (styles.strokes) {
                return handoff.designMap.colors[styles.strokes] ? handoff.designMap.colors[styles.strokes] : undefined;
            }
            else if (styles.stroke) {
                return handoff.designMap.colors[styles.stroke] ? handoff.designMap.colors[styles.stroke] : undefined;
            }
            break;
        case 'TYPOGRAPHY':
            if (styles.text) {
                return handoff.designMap.typography[styles.text] ? handoff.designMap.typography[styles.text] : undefined;
            }
            break;
        case 'EFFECT':
            if (styles.effect) {
                return handoff.designMap.effects[styles.effect] ? handoff.designMap.effects[styles.effect] : undefined;
            }
            break;
    }
    return undefined;
}
/**
 * Find the node from a path provided by the schema
 * @param root
 * @param path
 * @param tokens
 * @returns FigmaTypes.Node
 */
function resolveNodeFromPath(root, path, tokens) {
    const pathArr = path
        .split('>')
        .filter((part) => part !== '$')
        .map((part) => part.trim());
    let currentNode = root;
    for (const path of pathArr) {
        const nodeDef = parsePathNodeParams(path);
        if (!nodeDef.type) {
            continue;
        }
        if (nodeDef.name) {
            nodeDef.name = (0, index_1.replaceTokens)(nodeDef.name, tokens);
        }
        currentNode = nodeDef.name
            ? (0, utils_1.findChildNodeWithTypeAndName)(currentNode, nodeDef.type, nodeDef.name)
            : (0, utils_1.findChildNodeWithType)(currentNode, nodeDef.type);
        if (!currentNode) {
            return null;
        }
    }
    return currentNode;
}
/**
 * Given a schema path, this function will parse the node type and name
 * @param path
 * @returns
 */
function parsePathNodeParams(path) {
    const type = path.split('[')[0];
    const selectors = new Map();
    const selectorsMatch = path.match(/\[(.*?)\]/);
    if (selectorsMatch) {
        selectorsMatch[1].split(',').forEach((selector) => {
            const [key, value] = selector.split('=');
            if (!(key && value)) {
                return;
            }
            selectors.set(key, value.replace(/['"]/g, ''));
        });
    }
    return {
        type: (0, utils_1.isValidNodeType)(type) ? type : undefined,
        name: selectors.get('name'),
    };
}
function mergeTokenSets(first, second) {
    return lodash_1.default.mergeWith({}, first, second, (a, b) => (b === null ? a : undefined));
}
function generateComponentId(variantProperties) {
    const parts = [];
    variantProperties.forEach((val, variantProp) => {
        parts.push(`${variantProp}-${val}`);
    });
    return parts.join('-');
}
function extractNodeFill(node) {
    return {
        name: 'FILL',
        color: 'fills' in node ? node.fills.slice() : [],
    };
}
function extractNodeTypography(node) {
    var _a, _b, _c;
    const styleInNode = 'style' in node;
    const charactersInNode = 'style' in node;
    return {
        name: 'TYPOGRAPHY',
        fontFamily: styleInNode ? node.style.fontFamily : '',
        fontSize: styleInNode ? node.style.fontSize : 16,
        fontWeight: styleInNode ? node.style.fontWeight : 100,
        lineHeight: styleInNode ? ((_a = node.style.lineHeightPercentFontSize) !== null && _a !== void 0 ? _a : 100) / 100 : 1,
        letterSpacing: styleInNode ? node.style.letterSpacing : 0,
        textAlignHorizontal: styleInNode ? node.style.textAlignHorizontal : 'LEFT',
        textDecoration: styleInNode ? (_b = node.style.textDecoration) !== null && _b !== void 0 ? _b : 'NONE' : 'NONE',
        textCase: styleInNode ? (_c = node.style.textCase) !== null && _c !== void 0 ? _c : 'ORIGINAL' : 'ORIGINAL',
        characters: charactersInNode ? node.characters : '',
    };
}
function extractNodeEffect(node) {
    return {
        name: 'EFFECT',
        effect: 'effects' in node ? [...node.effects] : [],
    };
}
function extractNodeBorder(node) {
    var _a, _b;
    return {
        name: 'BORDER',
        weight: 'strokeWeight' in node ? (_a = node.strokeWeight) !== null && _a !== void 0 ? _a : 0 : 0,
        radius: 'cornerRadius' in node ? (_b = node.cornerRadius) !== null && _b !== void 0 ? _b : 0 : 0,
        strokes: 'strokes' in node ? node.strokes.slice() : [],
        dashes: 'strokeDashes' in node ? node.strokeDashes.concat() : [0, 0],
    };
}
function extractNodeSpacing(node) {
    var _a, _b, _c, _d, _e;
    return {
        name: 'SPACING',
        padding: {
            TOP: 'paddingTop' in node ? (_a = node.paddingTop) !== null && _a !== void 0 ? _a : 0 : 0,
            RIGHT: 'paddingRight' in node ? (_b = node.paddingRight) !== null && _b !== void 0 ? _b : 0 : 0,
            BOTTOM: 'paddingBottom' in node ? (_c = node.paddingBottom) !== null && _c !== void 0 ? _c : 0 : 0,
            LEFT: 'paddingLeft' in node ? (_d = node.paddingLeft) !== null && _d !== void 0 ? _d : 0 : 0,
        },
        spacing: 'itemSpacing' in node ? (_e = node.itemSpacing) !== null && _e !== void 0 ? _e : 0 : 0,
    };
}
function extractNodeBackground(node) {
    return {
        name: 'BACKGROUND',
        background: 'background' in node ? node.background.slice() : [],
    };
}
function extractNodeOpacity(node) {
    var _a;
    return {
        name: 'OPACITY',
        opacity: 'opacity' in node ? (_a = node.opacity) !== null && _a !== void 0 ? _a : 1 : 1,
    };
}
/**
 * Get the size bounding box size from a node
 * @param node
 * @returns ExportTypes.SizeTokenSet | null
 */
function extractNodeSize(node) {
    var _a, _b;
    return {
        name: 'SIZE',
        width: 'absoluteBoundingBox' in node ? (_a = node.absoluteBoundingBox.width) !== null && _a !== void 0 ? _a : 0 : 0,
        height: 'absoluteBoundingBox' in node ? (_b = node.absoluteBoundingBox.height) !== null && _b !== void 0 ? _b : 0 : 0,
    };
}
/**
 * Extract the exportable from a node.  Given a node and an exportable
 * identifier, this function will return the token set
 * @param node
 * @param exportable
 * @returns
 */
function extractNodeExportable(node, exportable) {
    switch (exportable) {
        case 'BACKGROUND':
            return extractNodeBackground(node);
        case 'SPACING':
            return extractNodeSpacing(node);
        case 'BORDER':
            return extractNodeBorder(node);
        case 'EFFECT':
            return extractNodeEffect(node);
        case 'TYPOGRAPHY':
            return extractNodeTypography(node);
        case 'FILL':
            return extractNodeFill(node);
        case 'OPACITY':
            return extractNodeOpacity(node);
        case 'SIZE':
            return extractNodeSize(node);
        default:
            return null;
    }
}
