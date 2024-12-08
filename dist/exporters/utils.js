"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNamePart = exports.isValidGradientType = exports.isShadowEffectType = exports.isValidEffectType = exports.isValidNodeType = exports.isExportable = exports.extractComponentInstanceVariantProps = exports.getComponentInstanceNamePart = exports.findChildNodeWithTypeAndName = exports.findChildNodeWithType = exports.isNodeType = exports.filterByNodeType = void 0;
function filterByNodeType(type) {
    return (obj) => (obj === null || obj === void 0 ? void 0 : obj.type) === type;
}
exports.filterByNodeType = filterByNodeType;
function isNodeType(obj, type) {
    return (obj === null || obj === void 0 ? void 0 : obj.type) === type;
}
exports.isNodeType = isNodeType;
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
exports.findChildNodeWithType = findChildNodeWithType;
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
exports.findChildNodeWithTypeAndName = findChildNodeWithTypeAndName;
function getComponentInstanceNamePart(componentInstanceName, partKey) {
    var _a;
    return (_a = componentInstanceName
        .split(',')
        .find((part) => part.trim().startsWith(`${partKey}=`))) === null || _a === void 0 ? void 0 : _a.split('=')[1];
}
exports.getComponentInstanceNamePart = getComponentInstanceNamePart;
function extractComponentInstanceVariantProps(componentInstanceName, supportedVariantProps) {
    const componentVariantProps = new Map();
    const supportedVariantPropNames = supportedVariantProps;
    supportedVariantPropNames.forEach((supportedVariantPropName) => {
        componentVariantProps.set(supportedVariantPropName, (0, exports.normalizeNamePart)(getComponentInstanceNamePart(componentInstanceName, supportedVariantPropName)));
    });
    return componentVariantProps;
}
exports.extractComponentInstanceVariantProps = extractComponentInstanceVariantProps;
const isExportable = (exportable) => {
    return ['BACKGROUND', 'BORDER', 'SPACING', 'TYPOGRAPHY', 'FILL', 'EFFECT', 'OPACITY', 'SIZE'].includes(exportable);
};
exports.isExportable = isExportable;
const isValidNodeType = (type) => {
    return [
        'DOCUMENT',
        'CANVAS',
        'FRAME',
        'GROUP',
        'VECTOR',
        'BOOLEAN_OPERATION',
        'STAR',
        'LINE',
        'ELLIPSE',
        'REGULAR_POLYGON',
        'RECTANGLE',
        'TEXT',
        'SLICE',
        'COMPONENT',
        'COMPONENT_SET',
        'INSTANCE',
    ].includes(type);
};
exports.isValidNodeType = isValidNodeType;
const isValidEffectType = (effect) => {
    return (0, exports.isShadowEffectType)(effect);
};
exports.isValidEffectType = isValidEffectType;
const isShadowEffectType = (effect) => {
    return ['DROP_SHADOW', 'INNER_SHADOW'].includes(effect);
};
exports.isShadowEffectType = isShadowEffectType;
const isValidGradientType = (gradientType) => {
    return ['GRADIENT_LINEAR', 'GRADIENT_RADIAL'].includes(gradientType);
};
exports.isValidGradientType = isValidGradientType;
const normalizeNamePart = (namePart) => {
    return namePart
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-/g, '')
        .replace(/-$/g, '')
        .toLowerCase();
};
exports.normalizeNamePart = normalizeNamePart;
