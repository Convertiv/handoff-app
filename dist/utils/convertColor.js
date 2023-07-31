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
Object.defineProperty(exports, "__esModule", { value: true });
exports.figmaColorToWebRGB = exports.transformFigmaEffectToCssBoxShadow = exports.transformFigmaTextCaseToCssTextTransform = exports.transformFigmaTextDecorationToCss = exports.transformFigmaTextAlignToCss = exports.transformFigmaFillsToCssColor = exports.transformFigmaPaintToCssColor = exports.transformFigmaColorToCssColor = exports.transformFigmaColorToHex = exports.transformFigmaPaintToGradient = exports.transformGradientToCss = void 0;
var utils_1 = require("../exporters/utils");
var gradients_1 = require("./gradients");
/**
 * Generate a CSS gradient from a color gradient object
 
 * @todo Support other kinds of gradients
 * @param color
 * @returns
 */
function transformGradientToCss(color, paintType) {
    if (paintType === void 0) { paintType = 'GRADIENT_LINEAR'; }
    // generate the rgbs) {}
    var params = [];
    var colors = [];
    if (paintType === 'SOLID') {
        params = (0, gradients_1.getLinearGradientParamsFromGradientObject)(color);
        colors = color.stops.map(function (stop) { return "rgba(".concat(figmaColorToWebRGB(stop.color).join(', '), ")"); });
        return "linear-gradient(".concat(params[0], "deg, ").concat(colors.join(', '), ")");
    }
    if (paintType === 'GRADIENT_LINEAR') {
        params = (0, gradients_1.getLinearGradientParamsFromGradientObject)(color);
        colors = color.stops.map(function (stop, i) { return "rgba(".concat(figmaColorToWebRGB(stop.color).join(', '), ") ").concat(params[i + 1], "%"); });
        return "linear-gradient(".concat(params[0], "deg, ").concat(colors.join(', '), ")");
    }
    if (paintType === 'GRADIENT_RADIAL') {
        var params_1 = (0, gradients_1.getRadialGradientParamsFromGradientObject)(color);
        colors = color.stops.map(function (stop) { var _a; return "rgba(".concat(figmaColorToWebRGB(stop.color).join(', '), ") ").concat((Number(Number(((_a = stop.position) !== null && _a !== void 0 ? _a : 0).toFixed(4)) * 100).toFixed(2)), "%"); });
        return "radial-gradient(".concat(params_1[0], "% ").concat(params_1[1], "% at ").concat(params_1[2], "% ").concat(params_1[3], "%, ").concat(colors.join(', '), ")");
    }
    return "";
}
exports.transformGradientToCss = transformGradientToCss;
function transformFigmaPaintToGradient(paint) {
    var _a, _b;
    if (paint.type === 'SOLID') {
        // Process solid as gradient
        var gradientColor = paint.color && paint.opacity ? __assign(__assign({}, paint.color), { a: paint.opacity }) : paint.color;
        return {
            blend: paint.blendMode,
            handles: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
            stops: [{ color: gradientColor, position: null }, { color: gradientColor, position: null }],
        };
    }
    if ((0, utils_1.isValidGradientType)(paint.type)) {
        return {
            blend: paint.blendMode,
            handles: (_a = paint.gradientHandlePositions) !== null && _a !== void 0 ? _a : [],
            stops: (_b = paint.gradientStops) !== null && _b !== void 0 ? _b : [],
        };
    }
    return null;
}
exports.transformFigmaPaintToGradient = transformFigmaPaintToGradient;
/**
 * Converts figma color to a hex (string) value.
 *
 * @param {FigmaTypes.Color} color
 * @returns {string}
 *
 * @example
 * // returns #001aff
 * figmaRGBToHex({ r: 0, g: 0.1, b: 1, a: 1 })
 */
function transformFigmaColorToHex(color) {
    var hex = '#';
    var rgb = figmaColorToWebRGB(color);
    hex += ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    if (rgb[3] !== undefined) {
        var a = Math.round(rgb[3] * 255).toString(16);
        if (a.length == 1) {
            hex += '0' + a;
        }
        else {
            if (a !== 'ff')
                hex += a;
        }
    }
    return hex;
}
exports.transformFigmaColorToHex = transformFigmaColorToHex;
var transformFigmaColorToCssColor = function (color) {
    var r = color.r, g = color.g, b = color.b, a = color.a;
    if (a === 1) {
        // transform to hex
        return transformFigmaColorToHex(color);
    }
    return "rgba(".concat(r * 255, ", ").concat(g * 255, ", ").concat(b * 255, ", ").concat(parseFloat(a.toFixed(3)), ")");
};
exports.transformFigmaColorToCssColor = transformFigmaColorToCssColor;
function transformFigmaPaintToCssColor(paint, asLinearGradient) {
    var _a;
    if (asLinearGradient === void 0) { asLinearGradient = false; }
    if (paint.type === 'SOLID' && !asLinearGradient) {
        if (!paint.color) {
            return null;
        }
        var _b = paint.color || { r: 0, g: 0, b: 0, a: 0 }, r = _b.r, g = _b.g, b = _b.b, a = _b.a;
        return (0, exports.transformFigmaColorToCssColor)({ r: r, g: g, b: b, a: a * ((_a = paint.opacity) !== null && _a !== void 0 ? _a : 1) });
    }
    var gradient = transformFigmaPaintToGradient(paint);
    return gradient ? transformGradientToCss(gradient, paint.type) : null;
}
exports.transformFigmaPaintToCssColor = transformFigmaPaintToCssColor;
var transformFigmaFillsToCssColor = function (fills, forceHexOrRgbaValue) {
    var _a;
    if (forceHexOrRgbaValue === void 0) { forceHexOrRgbaValue = false; }
    var count = (_a = fills === null || fills === void 0 ? void 0 : fills.length) !== null && _a !== void 0 ? _a : 0;
    var hasLayers = count > 0;
    var hasMultipleLayers = count > 1;
    var colorValue = 'transparent';
    var blendValue = 'normal';
    if (hasLayers) {
        if (forceHexOrRgbaValue && hasMultipleLayers) {
            colorValue = (0, exports.transformFigmaColorToCssColor)(blendFigmaColors(fills.map(function (fill) {
                var _a;
                return ({
                    r: fill.color.r,
                    g: fill.color.g,
                    b: fill.color.b,
                    a: fill.color.a * ((_a = fill.opacity) !== null && _a !== void 0 ? _a : 1)
                });
            })));
        }
        else {
            fills = __spreadArray([], fills, true).reverse();
            colorValue = fills.map(function (fill, i) { return transformFigmaPaintToCssColor(fill, hasMultipleLayers && i !== (count - 1)); }).filter(Boolean).join(', ');
            blendValue = fills.map(function (fill) { return fill.blendMode.toLowerCase().replaceAll('_', '-'); }).filter(Boolean).join(', ');
        }
    }
    return {
        color: colorValue,
        blend: blendValue
    };
};
exports.transformFigmaFillsToCssColor = transformFigmaFillsToCssColor;
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
var transformFigmaEffectToCssBoxShadow = function (effect) {
    var type = effect.type, color = effect.color, offset = effect.offset, radius = effect.radius, visible = effect.visible, spread = effect.spread;
    if (!visible) {
        return '';
    }
    if ((0, utils_1.isShadowEffectType)(type) && color && offset) {
        var x = offset.x, y = offset.y;
        return "".concat(x, "px ").concat(y, "px ").concat(radius !== null && radius !== void 0 ? radius : 0, "px ").concat(spread ? spread + 'px ' : '').concat((0, exports.transformFigmaColorToCssColor)(color)).concat(type === 'INNER_SHADOW' ? ' inset' : '');
    }
    return '';
};
exports.transformFigmaEffectToCssBoxShadow = transformFigmaEffectToCssBoxShadow;
/**
 * Converts figma color to a RGB(A) in form of a array.
 *
 * @param {FigmaTypes.Color} color
 * @returns {string}
 *
 * @example
 * // returns [226, 18, 17]
 * figmaRGBToWebRGB({r: 0.887499988079071, g: 0.07058823853731155, b: 0.0665624737739563, a: 1})
 */
function figmaColorToWebRGB(color) {
    if ('a' in color && color.a !== 1) {
        return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), Math.round(color.a * 100) / 100];
    }
    return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)];
}
exports.figmaColorToWebRGB = figmaColorToWebRGB;
/**
 * Blends multiple Figma colors into a single Figma color.
 * Based on the JordanDelcros's JavaScript implementation https://gist.github.com/JordanDelcros/518396da1c13f75ee057
 *
 * @param {FigmaTypes.Color[]} figmaColors
 * @returns
 */
function blendFigmaColors(figmaColors) {
    var _a;
    var base = [0, 0, 0, 0];
    var mix, added;
    var colors = figmaColors.map(function (color) { return figmaColorToWebRGB(color); });
    while (added = colors.shift()) {
        (_a = added[3]) !== null && _a !== void 0 ? _a : (added[3] = 1);
        if (base[3] && added[3]) {
            mix = [0, 0, 0, 0];
            mix[3] = 1 - (1 - added[3]) * (1 - base[3]); // A
            mix[0] = Math.round((added[0] * added[3] / mix[3]) + (base[0] * base[3] * (1 - added[3]) / mix[3])); // R
            mix[1] = Math.round((added[1] * added[3] / mix[3]) + (base[1] * base[3] * (1 - added[3]) / mix[3])); // G
            mix[2] = Math.round((added[2] * added[3] / mix[3]) + (base[2] * base[3] * (1 - added[3]) / mix[3])); // B
        }
        else if (added) {
            mix = added;
        }
        else {
            mix = base;
        }
        base = mix;
    }
    return {
        r: mix[0] / 255,
        g: mix[1] / 255,
        b: mix[2] / 255,
        a: mix[3],
    };
}
