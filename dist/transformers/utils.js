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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTokenNameVariableValue = exports.formatTokenName = exports.formatComponentCodeBlockComment = exports.transformComponentTokens = exports.getSizesFromComponents = exports.getThemesFromComponents = exports.getStatesFromComponents = exports.getTypesFromComponents = void 0;
var capitalize_js_1 = __importDefault(require("lodash/capitalize.js"));
var tokenSetTransformers_1 = require("./tokenSetTransformers");
var utils_1 = require("../utils");
var getTypesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.type; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getTypesFromComponents = getTypesFromComponents;
var getStatesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.state; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getStatesFromComponents = getStatesFromComponents;
var getThemesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.theme; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getThemesFromComponents = getThemesFromComponents;
var getSizesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.size; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getSizesFromComponents = getSizesFromComponents;
/**
 * Performs the transformation of the component tokens.
 *
 * @param component
 * @param options
 * @returns
 */
var transformComponentTokens = function (component, options) {
    var result = {};
    for (var part in component.parts) {
        var tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            continue;
        }
        for (var _i = 0, tokenSets_1 = tokenSets; _i < tokenSets_1.length; _i++) {
            var tokenSet = tokenSets_1[_i];
            var transformer = (0, tokenSetTransformers_1.getTokenSetTransformer)(tokenSet);
            if (!transformer) {
                continue;
            }
            result = __assign(__assign({}, result), transformer('sd', component, part, tokenSet, options));
        }
    }
    return result;
};
exports.transformComponentTokens = transformComponentTokens;
/**
 * Generates a standardized component comment block.
 *
 * @param type
 * @param component
 * @returns
 */
var formatComponentCodeBlockComment = function (type, component, format) {
    var str = type;
    if (component.componentType === 'design') {
        str = (component.type !== undefined) ? "".concat((0, capitalize_js_1.default)(component.type), " ").concat(str) : "".concat((0, capitalize_js_1.default)(str));
        str += (component.theme !== undefined) ? ", theme: ".concat(component.theme) : "";
        str += (component.state !== undefined) ? ", state: ".concat(component.state) : "";
        str += (component.activity !== undefined) ? ", activity: ".concat(component.activity) : "";
    }
    if (component.componentType === 'layout') {
        str = "".concat((0, capitalize_js_1.default)(str));
        str += (component.layout !== undefined) ? ", layout: ".concat(component.layout) : "";
        str += (component.size !== undefined) ? ", size: ".concat(component.size) : "";
    }
    return format === "/**/" ? "/* ".concat(str, " */") : "// ".concat(str);
};
exports.formatComponentCodeBlockComment = formatComponentCodeBlockComment;
/**
 * Formats the component token name for the given token type
 * @param tokenType
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
var formatTokenName = function (tokenType, component, part, property, options) {
    var _a = getReducedTokenNameParts(component, options), theme = _a.theme, type = _a.type, state = _a.state;
    // Only CSS and SCSS token types support templates
    var tokenNameTemplate = tokenType === 'css' ?
        options === null || options === void 0 ? void 0 : options.cssVariableTemplate :
        tokenType === 'scss'
            ? options === null || options === void 0 ? void 0 : options.scssVariableTemplate
            : null;
    var variableName = tokenNameTemplate
        ? parseTokenNameTemplate(tokenNameTemplate, component, part, property, options)
        : [
            component.name,
            type,
            normalizeComponentPartName(part),
            theme,
            state,
            property,
        ].filter(Boolean).join('//');
    if (tokenType === 'css') {
        return "--".concat(variableName);
    }
    if (tokenType === 'scss') {
        return "$".concat(variableName);
    }
    return variableName;
};
exports.formatTokenName = formatTokenName;
/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the exportable
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the exportable shared options.
 *
 * @param variable
 * @param value
 * @param options
 * @returns
 */
var normalizeTokenNameVariableValue = function (variable, value, options) {
    var _a, _b, _c, _d, _e;
    var replace = (_a = options === null || options === void 0 ? void 0 : options.replace) !== null && _a !== void 0 ? _a : {};
    var defaults = (_b = options === null || options === void 0 ? void 0 : options.defaults) !== null && _b !== void 0 ? _b : {};
    if (variable in (replace !== null && replace !== void 0 ? replace : {}) && value && value in ((_c = replace[variable]) !== null && _c !== void 0 ? _c : {})) {
        return (_d = replace[variable][value]) !== null && _d !== void 0 ? _d : '';
    }
    if (variable in (defaults !== null && defaults !== void 0 ? defaults : {}) && value === ((_e = defaults[variable]) !== null && _e !== void 0 ? _e : '')) {
        return '';
    }
    return value;
};
exports.normalizeTokenNameVariableValue = normalizeTokenNameVariableValue;
/**
 * Reduces the number of the token name parts to just 3 items.
 *
 * @param component
 * @param options
 * @returns
 */
var getReducedTokenNameParts = function (component, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var theme = component.componentType === 'design' ? (0, exports.normalizeTokenNameVariableValue)('theme', ((_a = component.theme) !== null && _a !== void 0 ? _a : ''), options) : undefined;
    var state = component.componentType === 'design'
        ? (_c = (0, exports.normalizeTokenNameVariableValue)('activity', ((_b = component.activity) !== null && _b !== void 0 ? _b : undefined), options)) !== null && _c !== void 0 ? _c : (0, exports.normalizeTokenNameVariableValue)('state', ((_d = component.state) !== null && _d !== void 0 ? _d : undefined), options)
        : undefined;
    var type = component.componentType === 'design'
        ? (state && state === (0, exports.normalizeTokenNameVariableValue)('activity', ((_e = component.activity) !== null && _e !== void 0 ? _e : ''), options) ? (0, exports.normalizeTokenNameVariableValue)('state', ((_f = component.state) !== null && _f !== void 0 ? _f : ''), options) : (0, exports.normalizeTokenNameVariableValue)('type', ((_g = component.type) !== null && _g !== void 0 ? _g : ''), options))
        : (_j = (0, exports.normalizeTokenNameVariableValue)('layout', ((_h = component.layout) !== null && _h !== void 0 ? _h : undefined), options)) !== null && _j !== void 0 ? _j : (0, exports.normalizeTokenNameVariableValue)('size', ((_k = component.size) !== null && _k !== void 0 ? _k : undefined), options);
    return { theme: theme, type: type, state: state };
};
var parseTokenNameTemplate = function (template, component, part, property, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return template
        .replaceAll('{$theme}', component.componentType === 'design' ? (_b = (0, exports.normalizeTokenNameVariableValue)('theme', ((_a = component.theme) !== null && _a !== void 0 ? _a : ''), options)) !== null && _b !== void 0 ? _b : '' : '')
        .replaceAll('{$type}', component.componentType === 'design' ? (_d = (0, exports.normalizeTokenNameVariableValue)('type', ((_c = component.type) !== null && _c !== void 0 ? _c : ''), options)) !== null && _d !== void 0 ? _d : '' : '')
        .replaceAll('{$state}', component.componentType === 'design' ? (_f = (0, exports.normalizeTokenNameVariableValue)('state', ((_e = component.state) !== null && _e !== void 0 ? _e : ''), options)) !== null && _f !== void 0 ? _f : '' : '')
        .replaceAll('{$activity}', component.componentType === 'design' ? (_h = (0, exports.normalizeTokenNameVariableValue)('activity', ((_g = component.activity) !== null && _g !== void 0 ? _g : ''), options)) !== null && _h !== void 0 ? _h : '' : '')
        .replaceAll('{$layout}', component.componentType === 'layout' ? (_k = (0, exports.normalizeTokenNameVariableValue)('layout', ((_j = component.layout) !== null && _j !== void 0 ? _j : ''), options)) !== null && _k !== void 0 ? _k : '' : '')
        .replaceAll('{$size}', component.componentType === 'layout' ? (_m = (0, exports.normalizeTokenNameVariableValue)('size', ((_l = component.size) !== null && _l !== void 0 ? _l : ''), options)) !== null && _m !== void 0 ? _m : '' : '')
        .replaceAll('{$part}', normalizeComponentPartName(part))
        .replaceAll('{$property}', property)
        .replace(/-+/g, '-');
};
var normalizeComponentPartName = function (part) {
    return part === '$' ? '' : part.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
};
