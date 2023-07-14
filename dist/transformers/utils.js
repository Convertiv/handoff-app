"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTokenNameVariableValue = exports.getReducedTokenPropertyPath = exports.getReducedTokenName = exports.formatTokenName = exports.formatComponentCodeBlockComment = exports.getSizesFromComponents = exports.getThemesFromComponents = exports.getStatesFromComponents = exports.getTypesFromComponents = exports.getTypeName = void 0;
var capitalize_js_1 = __importDefault(require("lodash/capitalize.js"));
var utils_1 = require("../utils");
var constants_1 = require("./constants");
/**
 * Returns normalized type name
 * @param type
 * @returns
 */
var getTypeName = function (type) { return type.group
    ? "".concat(type.group, "-").concat(type.machine_name)
    : "".concat(type.machine_name); };
exports.getTypeName = getTypeName;
/**
 * Returns a distinct list of types found within the given list of components.
 * @param components
 * @returns
 */
var getTypesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.type; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getTypesFromComponents = getTypesFromComponents;
/**
 * Returns a distinct list of states found within the given list of components.
 * @param components
 * @returns
 */
var getStatesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.state; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getStatesFromComponents = getStatesFromComponents;
/**
 * Returns a distinct list of themes found within the given list of components.
 * @param components
 * @returns
 */
var getThemesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.theme; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getThemesFromComponents = getThemesFromComponents;
/**
 * Returns a distinct list of sizes found within the given list of components.
 * @param components
 * @returns
 */
var getSizesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.size; })
        .filter(utils_1.filterOutUndefined)));
};
exports.getSizesFromComponents = getSizesFromComponents;
/**
 * Generates a standardized component comment block.
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
    // Only CSS and SCSS token types support templates
    var tokenNameTemplate = tokenType === 'css' ?
        options === null || options === void 0 ? void 0 : options.cssVariableTemplate :
        tokenType === 'scss'
            ? options === null || options === void 0 ? void 0 : options.scssVariableTemplate
            : null;
    var variableName = tokenNameTemplate
        ? parseTokenNameTemplate(tokenNameTemplate, component, part, property, options)
        : (0, exports.getReducedTokenName)(component, part, property, options);
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
 * Returns a reduced token name in form of a string.
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
var getReducedTokenName = function (component, part, property, options) {
    return (0, exports.getReducedTokenPropertyPath)(component, part, property, options).join(constants_1.tokenNamePartsSeparator);
};
exports.getReducedTokenName = getReducedTokenName;
/**
 * Reduces the token property path to a fixed number of parts.
 * @param component
 * @param options
 * @returns
 */
var getReducedTokenPropertyPath = function (component, part, property, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var l3 = component.componentType === 'design'
        ? (_b = (0, exports.normalizeTokenNameVariableValue)('activity', ((_a = component.activity) !== null && _a !== void 0 ? _a : undefined), options)) !== null && _b !== void 0 ? _b : (0, exports.normalizeTokenNameVariableValue)('state', ((_c = component.state) !== null && _c !== void 0 ? _c : undefined), options)
        : undefined;
    var l2 = component.componentType === 'design' ? (0, exports.normalizeTokenNameVariableValue)('theme', ((_d = component.theme) !== null && _d !== void 0 ? _d : ''), options) : undefined;
    var l1 = component.componentType === 'design'
        ? (l3 && l3 === (0, exports.normalizeTokenNameVariableValue)('activity', ((_e = component.activity) !== null && _e !== void 0 ? _e : ''), options) ? (0, exports.normalizeTokenNameVariableValue)('state', ((_f = component.state) !== null && _f !== void 0 ? _f : ''), options) : (0, exports.normalizeTokenNameVariableValue)('type', ((_g = component.type) !== null && _g !== void 0 ? _g : ''), options))
        : (_j = (0, exports.normalizeTokenNameVariableValue)('layout', ((_h = component.layout) !== null && _h !== void 0 ? _h : undefined), options)) !== null && _j !== void 0 ? _j : (0, exports.normalizeTokenNameVariableValue)('size', ((_k = component.size) !== null && _k !== void 0 ? _k : undefined), options);
    return [
        component.name,
        l1 !== null && l1 !== void 0 ? l1 : '',
        normalizeComponentPartName(part),
        l2 !== null && l2 !== void 0 ? l2 : '',
        l3 !== null && l3 !== void 0 ? l3 : '',
        property,
    ].filter(function (part) { return part !== ''; });
};
exports.getReducedTokenPropertyPath = getReducedTokenPropertyPath;
/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the exportable
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the exportable shared options.
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
 * Replaces the template variables with actual values.
 * @param template
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
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
/**
 * Returns the normalized part name.
 * @param part
 * @returns
 */
var normalizeComponentPartName = function (part) {
    return part === '$' ? '' : part.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); });
};
