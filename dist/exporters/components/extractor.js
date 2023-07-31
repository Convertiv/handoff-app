"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var utils_1 = require("../utils");
var index_1 = require("../../utils/index");
function extractComponents(componentSetComponentsResult, definition) {
    var supportedVariantPropertiesWithParams = getComponentSupportedVariantProperties(definition);
    var supportedVariantProperties = supportedVariantPropertiesWithParams.map(function (item) { return item.property; });
    var stateVariantProperty = supportedVariantPropertiesWithParams.filter(function (item) { return item.property === 'STATE'; });
    var componentSharedStates = stateVariantProperty.length > 0 ? stateVariantProperty[0].params : null;
    var sharedStateComponents = {};
    var components = lodash_1.default.uniqBy(componentSetComponentsResult.components
        .map(function (component) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;
        // Design
        var theme = supportedVariantProperties.includes('THEME')
            ? (0, utils_1.normalizeNamePart)((_e = (_a = (0, utils_1.getComponentNamePart)(component.name, 'Theme')) !== null && _a !== void 0 ? _a : (_d = (_c = (_b = definition.options) === null || _b === void 0 ? void 0 : _b.shared) === null || _c === void 0 ? void 0 : _c.defaults) === null || _d === void 0 ? void 0 : _d.theme) !== null && _e !== void 0 ? _e : '')
            : undefined;
        var type = supportedVariantProperties.includes('TYPE')
            ? (0, utils_1.normalizeNamePart)((_k = (_f = (0, utils_1.getComponentNamePart)(component.name, 'Type')) !== null && _f !== void 0 ? _f : (_j = (_h = (_g = definition.options) === null || _g === void 0 ? void 0 : _g.shared) === null || _h === void 0 ? void 0 : _h.defaults) === null || _j === void 0 ? void 0 : _j.type) !== null && _k !== void 0 ? _k : '')
            : undefined;
        var state = supportedVariantProperties.includes('STATE')
            ? (0, utils_1.normalizeNamePart)((_q = (_l = (0, utils_1.getComponentNamePart)(component.name, 'State')) !== null && _l !== void 0 ? _l : (_p = (_o = (_m = definition.options) === null || _m === void 0 ? void 0 : _m.shared) === null || _o === void 0 ? void 0 : _o.defaults) === null || _p === void 0 ? void 0 : _p.state) !== null && _q !== void 0 ? _q : '')
            : undefined;
        var activity = supportedVariantProperties.includes('ACTIVITY')
            ? (0, utils_1.normalizeNamePart)((_v = (_r = (0, utils_1.getComponentNamePart)(component.name, 'Activity')) !== null && _r !== void 0 ? _r : (_u = (_t = (_s = definition.options) === null || _s === void 0 ? void 0 : _s.shared) === null || _t === void 0 ? void 0 : _t.defaults) === null || _u === void 0 ? void 0 : _u.activity) !== null && _v !== void 0 ? _v : '')
            : undefined;
        // Layout
        var layout = supportedVariantProperties.includes('LAYOUT')
            ? (0, utils_1.normalizeNamePart)((_0 = (_w = (0, utils_1.getComponentNamePart)(component.name, 'Layout')) !== null && _w !== void 0 ? _w : (_z = (_y = (_x = definition.options) === null || _x === void 0 ? void 0 : _x.shared) === null || _y === void 0 ? void 0 : _y.defaults) === null || _z === void 0 ? void 0 : _z.layout) !== null && _0 !== void 0 ? _0 : '')
            : undefined;
        var size = supportedVariantProperties.includes('SIZE')
            ? (0, utils_1.normalizeNamePart)((_5 = (_1 = (0, utils_1.getComponentNamePart)(component.name, 'Size')) !== null && _1 !== void 0 ? _1 : (_4 = (_3 = (_2 = definition.options) === null || _2 === void 0 ? void 0 : _2.shared) === null || _3 === void 0 ? void 0 : _3.defaults) === null || _4 === void 0 ? void 0 : _4.size) !== null && _5 !== void 0 ? _5 : '')
            : undefined;
        var instanceNode = layout || size ? component : (0, utils_1.findChildNodeWithType)(component, 'INSTANCE');
        if (!instanceNode) {
            throw new Error("No instance node found for component ".concat(component.name));
        }
        var partsToExport = definition.parts;
        if (!partsToExport) {
            return null;
        }
        var parts = partsToExport.reduce(function (previous, current) {
            var _a;
            var tokenSets = extractComponentPartTokenSets(instanceNode, current, { activity: activity });
            return __assign(__assign({}, previous), (_a = {}, _a[current.id] = tokenSets, _a));
        }, {});
        var name = (_6 = definition.id) !== null && _6 !== void 0 ? _6 : '';
        var description = (_8 = (_7 = componentSetComponentsResult.metadata[component.id]) === null || _7 === void 0 ? void 0 : _7.description) !== null && _8 !== void 0 ? _8 : '';
        if (layout || size) {
            return {
                id: generateLayoutId(layout, size),
                name: name,
                description: description,
                componentType: 'layout',
                size: size,
                layout: layout,
                parts: parts,
            };
        }
        var designComponent = {
            id: generateDesignId(theme, type, state, activity),
            name: name,
            description: description,
            theme: theme,
            type: type,
            state: state,
            activity: activity,
            componentType: 'design',
            parts: parts,
        };
        if (state && (componentSharedStates !== null && componentSharedStates !== void 0 ? componentSharedStates : []).includes(state)) {
            (_9 = sharedStateComponents[state]) !== null && _9 !== void 0 ? _9 : (sharedStateComponents[state] = {});
            sharedStateComponents[state][(_13 = theme !== null && theme !== void 0 ? theme : (_12 = (_11 = (_10 = definition.options) === null || _10 === void 0 ? void 0 : _10.shared) === null || _11 === void 0 ? void 0 : _11.defaults) === null || _12 === void 0 ? void 0 : _12.theme) !== null && _13 !== void 0 ? _13 : ''] = designComponent;
            return null;
        }
        return designComponent;
    })
        .filter(index_1.filterOutNull), 'id');
    if (componentSharedStates && Object.keys(sharedStateComponents).length > 0) {
        components
            .filter(function (component) {
            var _a, _b, _c, _d;
            return component.componentType === 'design' && component.state === ((_d = (_c = (_b = (_a = definition.options) === null || _a === void 0 ? void 0 : _a.shared) === null || _b === void 0 ? void 0 : _b.defaults) === null || _c === void 0 ? void 0 : _c.state) !== null && _d !== void 0 ? _d : '');
        })
            .forEach(function (component) {
            Object.keys(sharedStateComponents).forEach(function (stateToApply) {
                var _a, _b, _c, _d, _e;
                var sharedStateComponent = sharedStateComponents[stateToApply][(_e = (_a = component.theme) !== null && _a !== void 0 ? _a : (_d = (_c = (_b = definition.options) === null || _b === void 0 ? void 0 : _b.shared) === null || _c === void 0 ? void 0 : _c.defaults) === null || _d === void 0 ? void 0 : _d.theme) !== null && _e !== void 0 ? _e : ''];
                components.push(__assign(__assign({}, sharedStateComponent), { id: generateDesignId(component.theme, component.type, sharedStateComponent.state, component.activity), theme: component.theme, type: component.type, activity: component.activity }));
            });
        });
    }
    return components;
}
exports.default = extractComponents;
function extractComponentPartTokenSets(root, part, tokens) {
    if (!part.tokens || part.tokens.length === 0) {
        return [];
    }
    var tokenSets = [];
    for (var _i = 0, _a = part.tokens; _i < _a.length; _i++) {
        var def = _a[_i];
        if (!def.from || !def.export || def.export.length === 0) {
            continue;
        }
        var node = resolveNodeFromPath(root, def.from, tokens);
        if (!node) {
            continue;
        }
        for (var _b = 0, _c = def.export; _b < _c.length; _b++) {
            var exportable = _c[_b];
            if (!(0, utils_1.isExportable)(exportable)) {
                continue;
            }
            var tokenSet = extractNodeExportable(node, exportable);
            if (!tokenSet) {
                continue;
            }
            var conflictingTokenSetIdx = tokenSets.map(function (set) { return set.name; }).indexOf(exportable);
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
function resolveNodeFromPath(root, path, tokens) {
    var _a;
    var pathArr = path
        .split('>')
        .filter(function (part) { return part !== '$'; })
        .map(function (part) { return part.trim(); });
    var currentNode = root;
    for (var _i = 0, pathArr_1 = pathArr; _i < pathArr_1.length; _i++) {
        var path_1 = pathArr_1[_i];
        var nodeDef = parsePathNodeParams(path_1);
        if (!nodeDef.type) {
            continue;
        }
        nodeDef.name = nodeDef.name ? nodeDef.name.replaceAll('$activity', (_a = tokens === null || tokens === void 0 ? void 0 : tokens.activity) !== null && _a !== void 0 ? _a : '') : nodeDef.name;
        currentNode = nodeDef.name
            ? (0, utils_1.findChildNodeWithTypeAndName)(currentNode, nodeDef.type, nodeDef.name)
            : (0, utils_1.findChildNodeWithType)(currentNode, nodeDef.type);
        if (!currentNode) {
            return null;
        }
    }
    return currentNode;
}
function parsePathNodeParams(path) {
    var type = path.split('[')[0];
    var selectors = new Map();
    var selectorsMatch = path.match(/\[(.*?)\]/);
    if (selectorsMatch) {
        selectorsMatch[1].split(',').forEach(function (selector) {
            var _a = selector.split('='), key = _a[0], value = _a[1];
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
    return lodash_1.default.mergeWith({}, first, second, function (a, b) { return (b === null ? a : undefined); });
}
function getComponentSupportedVariantProperties(definition) {
    var _a;
    return ((_a = definition.options.exporter.supportedVariantProps) !== null && _a !== void 0 ? _a : [])
        .map(function (variantProperty) {
        var _a;
        var regex = /^([^:]+)(?:\(([^)]+)\))?$/;
        var matches = variantProperty.match(regex);
        if (!matches || matches.length !== 3) {
            return null; // ignore if format is invalid
        }
        var key = matches[1].trim();
        var value = (_a = matches[2]) === null || _a === void 0 ? void 0 : _a.trim();
        if (!(0, utils_1.isValidVariantProperty)(key)) {
            return null; // ignore if variant property isn't supported
        }
        return {
            property: key,
            params: value ? value.substring(1).split(':') : null,
        };
    })
        .filter(index_1.filterOutNull);
}
function generateDesignId(theme, type, state, activity) {
    var parts = ['design'];
    if (theme !== undefined)
        parts.push("theme-".concat(theme));
    if (type !== undefined)
        parts.push("type-".concat(type));
    if (state !== undefined)
        parts.push("state-".concat(state));
    if (activity !== undefined)
        parts.push("activity-".concat(activity));
    return parts.join('-');
}
function generateLayoutId(layout, size) {
    var parts = [];
    if (layout)
        parts.push("layout-".concat(layout));
    if (size)
        parts.push("size-".concat(size));
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
    var styleInNode = 'style' in node;
    var charactersInNode = 'style' in node;
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
        effect: 'effects' in node ? __spreadArray([], node.effects, true) : [],
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
function extractNodeSize(node) {
    var _a, _b;
    return {
        name: 'SIZE',
        width: 'absoluteBoundingBox' in node ? (_a = node.absoluteBoundingBox.width) !== null && _a !== void 0 ? _a : 0 : 0,
        height: 'absoluteBoundingBox' in node ? (_b = node.absoluteBoundingBox.height) !== null && _b !== void 0 ? _b : 0 : 0,
    };
}
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
