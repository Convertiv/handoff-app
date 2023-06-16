export function filterByNodeType(type) {
    return function (obj) { return (obj === null || obj === void 0 ? void 0 : obj.type) === type; };
}
export function isNodeType(obj, type) {
    return (obj === null || obj === void 0 ? void 0 : obj.type) === type;
}
export function findChildNodeWithType(node, type) {
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
export function findChildNodeWithTypeAndName(node, type, name) {
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
export function getComponentNamePart(componentName, partKey) {
    var _a;
    return (_a = componentName
        .split(',')
        .find(function (part) { return part.trim().startsWith("".concat(partKey, "=")); })) === null || _a === void 0 ? void 0 : _a.split('=')[1];
}
export var isValidVariantProperty = function (variantProperty) {
    return ['THEME', 'TYPE', 'STATE', 'ACTIVITY', 'LAYOUT', 'SIZE'].includes(variantProperty);
};
export var isExportable = function (exportable) {
    return ['BACKGROUND', 'BORDER', 'SPACING', 'TYPOGRAPHY', 'FILL', 'EFFECT', 'OPACITY', 'SIZE'].includes(exportable);
};
export var isValidNodeType = function (type) {
    return ['DOCUMENT', 'CANVAS', 'FRAME', 'GROUP', 'VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'ELLIPSE', 'REGULAR_POLYGON', 'RECTANGLE', 'TEXT', 'SLICE', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(type);
};
export var isValidEffectType = function (effect) {
    return isShadowEffectType(effect);
};
export var isShadowEffectType = function (effect) {
    return ['DROP_SHADOW', 'INNER_SHADOW'].includes(effect);
};
export var isValidGradientType = function (gradientType) {
    return ['GRADIENT_LINEAR', 'GRADIENT_RADIAL'].includes(gradientType);
};
export var normalizeNamePart = function (namePart) {
    return namePart
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-/g, '')
        .replace(/-$/g, '')
        .toLowerCase();
};
