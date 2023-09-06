"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNamePart = exports.isValidGradientType = exports.isShadowEffectType = exports.isValidEffectType = exports.isValidNodeType = exports.isExportable = exports.extractComponentVariantProps = exports.getComponentNamePart = exports.findChildNodeWithTypeAndName = exports.findChildNodeWithType = exports.isNodeType = exports.filterByNodeType = void 0;
function filterByNodeType(type) {
    return function (obj) { return (obj === null || obj === void 0 ? void 0 : obj.type) === type; };
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
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var foundNode = findChildNodeWithType(child, type);
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
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var foundNode = findChildNodeWithTypeAndName(child, type, name);
            if (foundNode) {
                return foundNode;
            }
        }
    }
    return null;
}
exports.findChildNodeWithTypeAndName = findChildNodeWithTypeAndName;
function getComponentNamePart(component, partKey) {
    var _a;
    return (_a = component
        .split(',')
        .find(function (part) { return part.trim().startsWith("".concat(partKey, "=")); })) === null || _a === void 0 ? void 0 : _a.split('=')[1];
}
exports.getComponentNamePart = getComponentNamePart;
function extractComponentVariantProps(component, supportedVariantProps, defaults) {
    var hasAnyNonDefaultVariantProperty = false;
    var componentVariantProps = new Map();
    var supportedVariantPropNames = supportedVariantProps.map(function (supportedVariantProp) { return supportedVariantProp.name; });
    supportedVariantPropNames.forEach(function (supportedVariantPropName) {
        var _a, _b;
        var defaultValue = defaults ? (_a = defaults[supportedVariantPropName]) !== null && _a !== void 0 ? _a : '' : '';
        var value = (0, exports.normalizeNamePart)((_b = getComponentNamePart(component, supportedVariantPropName)) !== null && _b !== void 0 ? _b : defaultValue);
        hasAnyNonDefaultVariantProperty = hasAnyNonDefaultVariantProperty || value !== defaultValue;
        componentVariantProps.set(supportedVariantPropName, value);
    });
    return [componentVariantProps, hasAnyNonDefaultVariantProperty];
}
exports.extractComponentVariantProps = extractComponentVariantProps;
var isExportable = function (exportable) {
    return ['BACKGROUND', 'BORDER', 'SPACING', 'TYPOGRAPHY', 'FILL', 'EFFECT', 'OPACITY', 'SIZE'].includes(exportable);
};
exports.isExportable = isExportable;
var isValidNodeType = function (type) {
    return ['DOCUMENT', 'CANVAS', 'FRAME', 'GROUP', 'VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'ELLIPSE', 'REGULAR_POLYGON', 'RECTANGLE', 'TEXT', 'SLICE', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(type);
};
exports.isValidNodeType = isValidNodeType;
var isValidEffectType = function (effect) {
    return (0, exports.isShadowEffectType)(effect);
};
exports.isValidEffectType = isValidEffectType;
var isShadowEffectType = function (effect) {
    return ['DROP_SHADOW', 'INNER_SHADOW'].includes(effect);
};
exports.isShadowEffectType = isShadowEffectType;
var isValidGradientType = function (gradientType) {
    return ['GRADIENT_LINEAR', 'GRADIENT_RADIAL'].includes(gradientType);
};
exports.isValidGradientType = isValidGradientType;
var normalizeNamePart = function (namePart) {
    return namePart
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-/g, '')
        .replace(/-$/g, '')
        .toLowerCase();
};
exports.normalizeNamePart = normalizeNamePart;
