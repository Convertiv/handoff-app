"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenSetTransformer = void 0;
var convertColor_1 = require("../utils/convertColor");
var utils_1 = require("./utils");
var getTokenSetTransformer = function (tokenSet) {
    switch (tokenSet.name) {
        case 'BACKGROUND':
            return transformBackgroundTokenSet;
        case 'SPACING':
            return transformSpacingTokenSet;
        case 'BORDER':
            return transformBorderTokenSet;
        case 'TYPOGRAPHY':
            return transformTypographyTokenSet;
        case 'FILL':
            return transformFillTokenSet;
        case 'EFFECT':
            return transformEffectTokenSet;
        case 'OPACITY':
            return transformOpacityTokenSet;
        case 'SIZE':
            return transformSizeTokenSet;
        default:
            return undefined;
    }
};
exports.getTokenSetTransformer = getTokenSetTransformer;
var transformBackgroundTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'BACKGROUND'
        ? (_a = {},
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'background', options)] = {
                value: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.background).color,
                property: 'background',
                part: part,
            },
            _a) : {};
};
var transformSpacingTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'SPACING'
        ? (_a = {},
            // Padding
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-y', options)] = {
                value: "".concat((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2, "px"),
                property: 'padding-y',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-x', options)] = {
                value: "".concat((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2, "px"),
                property: 'padding-x',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-top', options)] = {
                value: "".concat(tokenSet.padding.TOP, "px"),
                property: 'padding-top',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-right', options)] = {
                value: "".concat(tokenSet.padding.RIGHT, "px"),
                property: 'padding-right',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-bottom', options)] = {
                value: "".concat(tokenSet.padding.BOTTOM, "px"),
                property: 'padding-bottom',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-left', options)] = {
                value: "".concat(tokenSet.padding.LEFT, "px"),
                property: 'padding-left',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-start', options)] = {
                value: "".concat(tokenSet.padding.LEFT, "px"),
                property: 'padding-start',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'padding-end', options)] = {
                value: "".concat(tokenSet.padding.RIGHT, "px"),
                property: 'padding-end',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'spacing', options)] = {
                value: "".concat(tokenSet.spacing, "px"),
                property: 'spacing',
                part: part,
            },
            _a) : {};
};
var transformBorderTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'BORDER'
        ? (_a = {},
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'border-width', options)] = {
                value: "".concat(tokenSet.weight, "px"),
                property: 'border-width',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'border-radius', options)] = {
                value: "".concat(tokenSet.radius, "px"),
                property: 'border-radius',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'border-color', options)] = {
                value: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.strokes).color,
                property: 'border-color',
                part: part,
            },
            _a) : {};
};
var transformTypographyTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'TYPOGRAPHY'
        ? (_a = {},
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'font-family', options)] = {
                value: "'".concat(tokenSet.fontFamily, "'"),
                property: 'font-family',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'font-size', options)] = {
                value: "".concat(tokenSet.fontSize, "px"),
                property: 'font-size',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'font-weight', options)] = {
                value: "".concat(tokenSet.fontWeight),
                property: 'font-weight',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'line-height', options)] = {
                value: "".concat(tokenSet.lineHeight),
                property: 'line-height',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'letter-spacing', options)] = {
                value: "".concat(tokenSet.letterSpacing, "px"),
                property: 'letter-spacing',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'text-align', options)] = {
                value: (0, convertColor_1.transformFigmaTextAlignToCss)(tokenSet.textAlignHorizontal),
                property: 'text-align',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'text-decoration', options)] = {
                value: (0, convertColor_1.transformFigmaTextDecorationToCss)(tokenSet.textDecoration),
                property: 'text-decoration',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'text-transform', options)] = {
                value: (0, convertColor_1.transformFigmaTextCaseToCssTextTransform)(tokenSet.textCase),
                property: 'text-transform',
                part: part,
            },
            _a) : {};
};
var transformFillTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'FILL'
        ? (_a = {},
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'color', options)] = {
                value: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.color).color,
                property: 'color',
                part: part,
            },
            _a) : {};
};
var transformEffectTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'EFFECT'
        ? (_a = {},
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'box-shadow', options)] = {
                value: tokenSet.effect.map(convertColor_1.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
                property: 'color',
                part: part,
            },
            _a) : {};
};
var transformOpacityTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'OPACITY'
        ? (_a = {},
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'opacity', options)] = {
                value: "".concat(tokenSet.opacity),
                property: 'opacity',
                part: part,
            },
            _a) : {};
};
var transformSizeTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a;
    var _b, _c, _d, _e;
    return tokenSet.name === 'SIZE'
        ? (_a = {},
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'width', options)] = {
                value: "".concat((_b = tokenSet.width) !== null && _b !== void 0 ? _b : '0', "px"),
                property: 'width',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'width-raw', options)] = {
                value: "".concat((_c = tokenSet.width) !== null && _c !== void 0 ? _c : '0'),
                property: 'width-raw',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'height', options)] = {
                value: "".concat((_d = tokenSet.height) !== null && _d !== void 0 ? _d : '0', "px"),
                property: 'height',
                part: part,
            },
            _a[(0, utils_1.formatTokenName)(tokenType, component, part, 'height-raw', options)] = {
                value: "".concat((_e = tokenSet.height) !== null && _e !== void 0 ? _e : '0'),
                property: 'height-raw',
                part: part,
            },
            _a) : {};
};
