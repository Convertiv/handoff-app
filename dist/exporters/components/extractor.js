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
    var sharedComponentVariants = [];
    var supportedVariantProperties = getComponentSupportedVariantProperties(definition);
    var supportedDesignVariantPropertiesWithSharedVariants = supportedVariantProperties.design.filter(function (variantProperty) { var _a; return ((_a = variantProperty.params) !== null && _a !== void 0 ? _a : []).length > 0; });
    var hasAnyVariantPropertiesWithSharedVariants = supportedDesignVariantPropertiesWithSharedVariants.length > 0;
    var components = lodash_1.default.uniqBy(componentSetComponentsResult.components
        .map(function (component) {
        // BEGIN: Get variant properties
        var _a, _b, _c, _d, _e, _f;
        var defaults = (_c = (_b = (_a = definition.options) === null || _a === void 0 ? void 0 : _a.shared) === null || _b === void 0 ? void 0 : _b.defaults) !== null && _c !== void 0 ? _c : {};
        var _g = (0, utils_1.extractComponentVariantProps)(component.name, supportedVariantProperties.design, defaults), designVariantProperties = _g[0], _ = _g[1];
        var _h = (0, utils_1.extractComponentVariantProps)(component.name, supportedVariantProperties.layout, defaults), layoutVariantProperties = _h[0], hasAnyNonDefaultLayoutVariantProperty = _h[1];
        // END: Get variant properties
        // BEGIN: Set component type indicator
        var isLayoutComponent = hasAnyNonDefaultLayoutVariantProperty;
        // END: Set component type indicator
        // BEGIN: Define required component properties
        var variantProperties = isLayoutComponent ? layoutVariantProperties : designVariantProperties;
        var type = isLayoutComponent ? 'layout' : 'design';
        var description = (_e = (_d = componentSetComponentsResult.metadata[component.id]) === null || _d === void 0 ? void 0 : _d.description) !== null && _e !== void 0 ? _e : '';
        var name = (_f = definition.id) !== null && _f !== void 0 ? _f : '';
        var id = generateComponentId(variantProperties, isLayoutComponent);
        // END: Define required component properties
        // BEGIN: Get component parts
        var instanceNode = isLayoutComponent ? component : (0, utils_1.findChildNodeWithType)(component, 'INSTANCE');
        if (!instanceNode) {
            throw new Error("No instance node found for component ".concat(component.name));
        }
        var partsToExport = definition.parts;
        if (!partsToExport) {
            return null;
        }
        var parts = partsToExport.reduce(function (previous, current) {
            var _a;
            var tokenSets = extractComponentPartTokenSets(instanceNode, current, variantProperties);
            return __assign(__assign({}, previous), (_a = {}, _a[current.id] = tokenSets, _a));
        }, {});
        // END: Get component parts
        // BEGIN: Initialize the resulting component
        var result = {
            id: id,
            name: name,
            description: description,
            type: type,
            variantProperties: variantProperties,
            parts: parts,
        };
        // END: Initialize the resulting component
        // BEGIN: Store resulting component if component variant should be shared
        var componentVariantIsBeingShared = false;
        if (type === 'design' && hasAnyVariantPropertiesWithSharedVariants) {
            supportedDesignVariantPropertiesWithSharedVariants.forEach(function (variantProperty) {
                var _a;
                // Get the variant property value of the component and validate that the value is set
                var variantPropertyValue = variantProperties.get(variantProperty.name);
                // Check if the component has a value set for the variant property we are checking
                if (!variantPropertyValue) {
                    // If the component doesn't have a value set we bail early
                    return;
                }
                // Check if the component is set to be shared based on the value of the variant property
                var matchesByComponentVariantPropertyValue = (_a = variantProperty.params.filter(function (param) { return param[0] === variantPropertyValue; })) !== null && _a !== void 0 ? _a : [];
                // Check if there are any matches
                if (matchesByComponentVariantPropertyValue.length === 0) {
                    // If there aren't any matches, we bail early
                    return;
                }
                // Signal that the component variant is considered to be shared
                componentVariantIsBeingShared = true;
                // Current component is a shared component.
                // We store the component for later when we will do the binding.
                matchesByComponentVariantPropertyValue.forEach(function (match) {
                    sharedComponentVariants.push({
                        variantProperty: variantProperty.name,
                        groupByVariantProperty: match[1],
                        component: result
                    });
                });
            });
        }
        // END: Store resulting component if component variant should be shared
        if (componentVariantIsBeingShared) {
            return null;
        }
        return result;
    })
        .filter(index_1.filterOutNull), 'id');
    if (sharedComponentVariants.length > 0) {
        sharedComponentVariants.forEach(function (sharedComponentVariant) {
            var sharedComponentVariantProps = sharedComponentVariant.component.variantProperties;
            components
                .filter(function (component) {
                var _a, _b;
                // check if the component is a design component
                if (component.type !== 'design') {
                    return false; // ignore component if it's not a design component
                }
                // check if the grouping variant property is defined
                if (sharedComponentVariant.groupByVariantProperty) {
                    // get the shared component grouping variant property value
                    var sharedComponentGroupVariantPropertyValue = sharedComponentVariant.component.variantProperties.get(sharedComponentVariant.groupByVariantProperty);
                    // check if the current component variant property value matches the group value
                    if (sharedComponentGroupVariantPropertyValue && sharedComponentGroupVariantPropertyValue !== component.variantProperties.get(sharedComponentVariant.groupByVariantProperty)) {
                        return false; // ignore if the value does not match
                    }
                }
                // applying shared variant should happen only once per design component
                // so we pick only those design components for which the value of the
                // shared variant property is the default one
                if (component.variantProperties.get(sharedComponentVariant.variantProperty) !== ((_b = (_a = definition.options) === null || _a === void 0 ? void 0 : _a.shared) === null || _b === void 0 ? void 0 : _b.defaults[sharedComponentVariant.variantProperty])) {
                    return false; // ignore if the variant property value is not the default one
                }
                return true;
            })
                .forEach(function (component) {
                var componentToPush = __assign({}, sharedComponentVariant.component);
                var componentToPushVariantProps = new Map(component.variantProperties);
                componentToPushVariantProps.set(sharedComponentVariant.variantProperty, sharedComponentVariantProps.get(sharedComponentVariant.variantProperty));
                componentToPush.id = generateComponentId(componentToPushVariantProps, false);
                componentToPush.variantProperties = componentToPushVariantProps;
                components.push(componentToPush);
            });
        });
    }
    return components.map(function (component) { return ({
        id: component.id,
        name: component.name,
        description: component.description,
        type: component.type,
        variantProperties: Array.from(component.variantProperties.entries()),
        parts: component.parts,
    }); });
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
function getComponentPropertyWithParams(variantProperty) {
    var _a;
    var regex = /^([^:]+)(?:\(([^)]+)\))?$/;
    var matches = variantProperty.match(regex);
    if (!matches || matches.length !== 3) {
        return null; // ignore if format is invalid
    }
    var key = matches[1].trim();
    var value = (_a = matches[2]) === null || _a === void 0 ? void 0 : _a.trim();
    return {
        name: key,
        params: value ? value.substring(1).split(':').map(function (param) { return param.split(/\/(.*)/s).slice(0, 2); }) : undefined,
    };
}
function getComponentSupportedVariantProperties(definition) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        design: ((_d = (_c = (_b = (_a = definition === null || definition === void 0 ? void 0 : definition.options) === null || _a === void 0 ? void 0 : _a.exporter) === null || _b === void 0 ? void 0 : _b.supportedVariantProps) === null || _c === void 0 ? void 0 : _c.design) !== null && _d !== void 0 ? _d : []).map(function (variantProperty) { return getComponentPropertyWithParams(variantProperty); }),
        layout: ((_h = (_g = (_f = (_e = definition === null || definition === void 0 ? void 0 : definition.options) === null || _e === void 0 ? void 0 : _e.exporter) === null || _f === void 0 ? void 0 : _f.supportedVariantProps) === null || _g === void 0 ? void 0 : _g.layout) !== null && _h !== void 0 ? _h : []).map(function (variantProperty) { return getComponentPropertyWithParams(variantProperty); }),
    };
}
function generateComponentId(variantProperties, isLayoutComponent) {
    var parts = isLayoutComponent ? [] : ['design'];
    variantProperties.forEach(function (val, variantProp) {
        parts.push("".concat(variantProp, "-").concat(val));
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
