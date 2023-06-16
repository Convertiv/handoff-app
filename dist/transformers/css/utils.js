import { filterOutUndefined } from '../../utils/index';
import { transformFigmaColorToHex } from '../../utils/convertColor';
/**
 * Get the name of a SCSS variable from a token object
 * @param tokens
 * @returns string
 */
export var getScssVariableName = function (tokens) {
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
/**
 * Get the name of a CSS variable from a token object
 * @param tokens
 * @returns
 */
export var getCssVariableName = function (tokens) {
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
/**
 * Transform a Figma color to a CSS color
 * @param color
 * @returns string
 */
export var transformFigmaColorToCssColor = function (color) {
    var r = color.r, g = color.g, b = color.b, a = color.a;
    if (a === 1) {
        // transform to hex
        return transformFigmaColorToHex(color);
    }
    return "rgba(".concat(r * 255, ", ").concat(g * 255, ", ").concat(b * 255, ", ").concat(a, ")");
};
/**
 * Transform a Figma fill color to a CSS color
 * @param paint
 * @returns
 */
export var transformFigmaFillsToCssColor = function (paint) {
    var _a;
    if (paint.visible === false || paint.opacity === 0) {
        return '';
    }
    if (paint.type === 'SOLID') {
        var _b = paint.color || { r: 0, g: 0, b: 0, a: 0 }, r = _b.r, g = _b.g, b = _b.b, a = _b.a;
        return transformFigmaColorToCssColor({ r: r, g: g, b: b, a: a * ((_a = paint.opacity) !== null && _a !== void 0 ? _a : 1) });
    }
    // TODO: Liner Gradient
    return '';
};
/**
 *
 * @param textAlign
 * @returns
 */
export var transformFigmaTextAlignToCss = function (textAlign) {
    return ['left', 'center', 'right', 'justify'].includes(textAlign.toLowerCase()) ? textAlign.toLowerCase() : 'left';
};
export var transformFigmaTextDecorationToCss = function (textDecoration) {
    if (textDecoration === 'UNDERLINE') {
        return 'underline';
    }
    if (textDecoration === 'STRIKETHROUGH') {
        return 'line-through';
    }
    return 'none';
};
export var transformFigmaTextCaseToCssTextTransform = function (textCase) {
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
export var getTypesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.type; })
        .filter(filterOutUndefined)));
};
export var getStatesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.state; })
        .filter(filterOutUndefined)));
};
export var getThemesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.theme; })
        .filter(filterOutUndefined)));
};
export var getSizesFromComponents = function (components) {
    return Array.from(new Set(components
        .map(function (component) { return component.size; })
        .filter(filterOutUndefined)));
};
