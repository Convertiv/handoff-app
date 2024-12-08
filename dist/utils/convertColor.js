"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.figmaColorToWebRGB = exports.transformFigmaEffectToCssBoxShadow = exports.transformFigmaTextCaseToCssTextTransform = exports.transformFigmaTextDecorationToCss = exports.transformFigmaTextAlignToCss = exports.transformFigmaFillsToCssColor = exports.transformFigmaPaintToCssColor = exports.transformFigmaColorToCssColor = exports.transformFigmaColorToHex = exports.transformFigmaPaintToGradient = exports.transformGradientToCss = void 0;
const utils_1 = require("../exporters/utils");
const gradients_1 = require("./gradients");
const numbers_1 = require("./numbers");
/**
 * Generate a CSS gradient from a color gradient object

 * @todo Support other kinds of gradients
 * @param color
 * @returns
 */
function transformGradientToCss(color, paintType = 'GRADIENT_LINEAR') {
    // generate the rgbs) {}
    let params = [];
    let colors = [];
    if (paintType === 'SOLID') {
        params = (0, gradients_1.getLinearGradientParamsFromGradientObject)(color);
        colors = color.stops.map((stop) => `rgba(${figmaColorToWebRGB(stop.color)
            .map((val) => (0, numbers_1.normalizeCssNumber)(val))
            .join(', ')})`);
        return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
    }
    if (paintType === 'GRADIENT_LINEAR') {
        params = (0, gradients_1.getLinearGradientParamsFromGradientObject)(color);
        colors = color.stops.map((stop, i) => `rgba(${figmaColorToWebRGB(stop.color)
            .map((val) => (0, numbers_1.normalizeCssNumber)(val))
            .join(', ')}) ${params[i + 1]}%`);
        return `linear-gradient(${params[0]}deg, ${colors.join(', ')})`;
    }
    if (paintType === 'GRADIENT_RADIAL') {
        const params = (0, gradients_1.getRadialGradientParamsFromGradientObject)(color);
        colors = color.stops.map((stop) => {
            var _a;
            return `rgba(${figmaColorToWebRGB(stop.color)
                .map((val) => (0, numbers_1.normalizeCssNumber)(val))
                .join(', ')}) ${(0, numbers_1.normalizeCssNumber)(Number(Number(((_a = stop.position) !== null && _a !== void 0 ? _a : 0).toFixed(4)) * 100))}%`;
        });
        return `radial-gradient(${(0, numbers_1.normalizeCssNumber)(params[0])}% ${(0, numbers_1.normalizeCssNumber)(params[1])}% at ${(0, numbers_1.normalizeCssNumber)(params[2])}% ${(0, numbers_1.normalizeCssNumber)(params[3])}%, ${colors.join(', ')})`;
    }
    return ``;
}
exports.transformGradientToCss = transformGradientToCss;
function transformFigmaPaintToGradient(paint) {
    var _a, _b;
    if (paint.type === 'SOLID') {
        // Process solid as gradient
        const gradientColor = paint.color && paint.opacity ? Object.assign(Object.assign({}, paint.color), { a: paint.opacity }) : paint.color;
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
    let hex = '#';
    const rgb = figmaColorToWebRGB(color);
    hex += ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    if (rgb[3] !== undefined) {
        const a = Math.round(rgb[3] * 255).toString(16);
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
const transformFigmaColorToCssColor = (color) => {
    const { r, g, b, a } = color;
    if (a === 1) {
        // transform to hex
        return transformFigmaColorToHex(color);
    }
    return `rgba(${(0, numbers_1.normalizeCssNumber)(r * 255)}, ${(0, numbers_1.normalizeCssNumber)(g * 255)}, ${(0, numbers_1.normalizeCssNumber)(b * 255)}, ${(0, numbers_1.normalizeCssNumber)(a)})`;
};
exports.transformFigmaColorToCssColor = transformFigmaColorToCssColor;
function transformFigmaPaintToCssColor(paint, asLinearGradient = false) {
    var _a;
    if (paint.type === 'SOLID' && !asLinearGradient) {
        if (!paint.color) {
            return null;
        }
        const { r, g, b, a } = paint.color || { r: 0, g: 0, b: 0, a: 0 };
        return (0, exports.transformFigmaColorToCssColor)({ r, g, b, a: a * ((_a = paint.opacity) !== null && _a !== void 0 ? _a : 1) });
    }
    const gradient = transformFigmaPaintToGradient(paint);
    return gradient ? transformGradientToCss(gradient, paint.type) : null;
}
exports.transformFigmaPaintToCssColor = transformFigmaPaintToCssColor;
const transformFigmaFillsToCssColor = (fills, forceHexOrRgbaValue = false) => {
    var _a;
    const count = (_a = fills === null || fills === void 0 ? void 0 : fills.length) !== null && _a !== void 0 ? _a : 0;
    const hasLayers = count > 0;
    const hasMultipleLayers = count > 1;
    const shouldForceHexOrRgbaValue = forceHexOrRgbaValue && fills.filter((f) => f.type !== 'SOLID').length === 0;
    let colorValue = 'transparent';
    let blendValue = 'normal';
    if (hasLayers) {
        if (shouldForceHexOrRgbaValue && hasMultipleLayers) {
            colorValue = (0, exports.transformFigmaColorToCssColor)(blendFigmaColors(fills.map(fill => {
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
            fills = [...fills].reverse();
            colorValue = fills.map((fill, i) => transformFigmaPaintToCssColor(fill, hasMultipleLayers && i !== (count - 1))).filter(Boolean).join(', ');
            blendValue = fills.map(fill => fill.blendMode.toLowerCase().replaceAll('_', '-')).filter(Boolean).join(', ');
        }
    }
    return {
        color: colorValue,
        blend: blendValue
    };
};
exports.transformFigmaFillsToCssColor = transformFigmaFillsToCssColor;
const transformFigmaTextAlignToCss = (textAlign) => {
    return ['left', 'center', 'right', 'justify'].includes(textAlign.toLowerCase()) ? textAlign.toLowerCase() : 'left';
};
exports.transformFigmaTextAlignToCss = transformFigmaTextAlignToCss;
const transformFigmaTextDecorationToCss = (textDecoration) => {
    if (textDecoration === 'UNDERLINE') {
        return 'underline';
    }
    if (textDecoration === 'STRIKETHROUGH') {
        return 'line-through';
    }
    return 'none';
};
exports.transformFigmaTextDecorationToCss = transformFigmaTextDecorationToCss;
const transformFigmaTextCaseToCssTextTransform = (textCase) => {
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
const transformFigmaEffectToCssBoxShadow = (effect) => {
    const { type, color, offset, radius, visible, spread } = effect;
    if (!visible) {
        return '';
    }
    if ((0, utils_1.isShadowEffectType)(type) && color && offset) {
        const { x, y } = offset;
        return `${x}px ${y}px ${radius !== null && radius !== void 0 ? radius : 0}px ${spread ? spread + 'px ' : ''}${(0, exports.transformFigmaColorToCssColor)(color)}${type === 'INNER_SHADOW' ? ' inset' : ''}`;
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
    let base = [0, 0, 0, 0];
    let mix, added;
    const colors = figmaColors.map(color => figmaColorToWebRGB(color));
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
