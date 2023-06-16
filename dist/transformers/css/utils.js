"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSizesFromComponents = exports.getThemesFromComponents = exports.getStatesFromComponents = exports.getTypesFromComponents = exports.transformFigmaTextCaseToCssTextTransform = exports.transformFigmaTextDecorationToCss = exports.transformFigmaTextAlignToCss = exports.transformFigmaFillsToCssColor = exports.transformFigmaColorToCssColor = exports.getCssVariableName = exports.getScssVariableName = void 0;
var index_1 = require("../../utils/index");
var convertColor_1 = require("../../utils/convertColor");
/**
 * Get the name of a SCSS variable from a token object
 * @param tokens
 * @returns string
 */
var getScssVariableName = function (tokens) {
    var component = tokens.component, property = tokens.property, part = tokens.part, _a = tokens.theme, theme = _a === void 0 ? 'light' : _a, _b = tokens.type, type = _b === void 0 ? 'default' : _b, _c = tokens.state, state = _c === void 0 ? 'default' : _c;
    var parts = [
        component,
        type === 'default' ? '' : type,
        part,
        theme === 'light' ? '' : theme,
        state === 'default' ? '' : state,
        property,
    ].filter(Boolean);
    return "$".concat(parts.join('-'));
};
exports.getScssVariableName = getScssVariableName;
/**
 * Get the name of a CSS variable from a token object
 * @param tokens
 * @returns
 */
var getCssVariableName = function (tokens) {
    var component = tokens.component, property = tokens.property, part = tokens.part, _a = tokens.theme, theme = _a === void 0 ? 'light' : _a, _b = tokens.type, type = _b === void 0 ? 'default' : _b, _c = tokens.state, state = _c === void 0 ? 'default' : _c;
    var parts = [
        component,
        type === 'default' ? '' : type,
        part,
        theme === 'light' ? '' : theme,
        state === 'default' ? '' : state,
        property,
    ].filter(Boolean);
    return "--".concat(parts.join('-'));
};
exports.getCssVariableName = getCssVariableName;
/**
 * Transform a Figma color to a CSS color
 * @param color
 * @returns string
 */
var transformFigmaColorToCssColor = function (color) {
    var r = color.r, g = color.g, b = color.b, a = color.a;
    if (a === 1) {
        // transform to hex
        return (0, convertColor_1.transformFigmaColorToHex)(color);
    }
    return "rgba(".concat(r * 255, ", ").concat(g * 255, ", ").concat(b * 255, ", ").concat(a, ")");
};
exports.transformFigmaColorToCssColor = transformFigmaColorToCssColor;
/**
 * Transform a Figma fill color to a CSS color
 * @param paint
 * @returns
 */
var transformFigmaFillsToCssColor = function (paint) {
    var _a;
    if (paint.visible === false || paint.opacity === 0) {
        return '';
    }
    if (paint.type === 'SOLID') {
        var _b = paint.color || { r: 0, g: 0, b: 0, a: 0 }, r = _b.r, g = _b.g, b = _b.b, a = _b.a;
        return (0, exports.transformFigmaColorToCssColor)({ r: r, g: g, b: b, a: a * ((_a = paint.opacity) !== null && _a !== void 0 ? _a : 1) });
    }
    // TODO: Liner Gradient
    return '';
};
exports.transformFigmaFillsToCssColor = transformFigmaFillsToCssColor;
/**
 *
 * @param textAlign
 * @returns
 */
var transformFigmaTextAlignToCss = function (textAlign) {
    return ['left', 'center', 'right', 'justify'].includes(textAlign.toLowerCase()) ? textAlign.toLowerCase() : 'left';
};
exports.transformFigmaTextAlignToCss = transformFigmaTextAlignToCss;
var transformFigmaTextDecorationToCss = function (textDecoration) {
    if (textDecoration === 'UNDERLINE') {
        return 'underline';
    }
    if (textDecoration === 'STRIKETHROUGH') {
        return 'line-through';
    }
    return 'none';
};
exports.transformFigmaTextDecorationToCss = transformFigmaTextDecorationToCss;
var transformFigmaTextCaseToCssTextTransform = function (textCase) {
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
exports.transformFigmaTextCaseToCssTextTransform = transformFigmaTextCaseToCssTextTransform;
var getTypesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.type; })
        .filter(index_1.filterOutUndefined)));
};
exports.getTypesFromComponents = getTypesFromComponents;
var getStatesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.state; })
        .filter(index_1.filterOutUndefined)));
};
exports.getStatesFromComponents = getStatesFromComponents;
var getThemesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.theme; })
        .filter(index_1.filterOutUndefined)));
};
exports.getThemesFromComponents = getThemesFromComponents;
var getSizesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.size; })
        .filter(index_1.filterOutUndefined)));
};
exports.getSizesFromComponents = getSizesFromComponents;
