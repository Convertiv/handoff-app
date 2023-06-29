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
var transformBackgroundTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'BACKGROUND'
        ? (_a = {},
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'background', options)] = {
                value: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.background).color,
                property: 'background',
                group: part,
            },
            _a) : {};
};
var transformSpacingTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'SPACING'
        ? (_a = {},
            // Padding
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-y', options)] = {
                value: "".concat((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2, "px"),
                property: 'padding-y',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-x', options)] = {
                value: "".concat((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2, "px"),
                property: 'padding-x',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-top', options)] = {
                value: "".concat(tokenSet.padding.TOP, "px"),
                property: 'padding-top',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-right', options)] = {
                value: "".concat(tokenSet.padding.RIGHT, "px"),
                property: 'padding-right',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-bottom', options)] = {
                value: "".concat(tokenSet.padding.BOTTOM, "px"),
                property: 'padding-bottom',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-left', options)] = {
                value: "".concat(tokenSet.padding.LEFT, "px"),
                property: 'padding-left',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-start', options)] = {
                value: "".concat(tokenSet.padding.LEFT, "px"),
                property: 'padding-start',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'padding-end', options)] = {
                value: "".concat(tokenSet.padding.RIGHT, "px"),
                property: 'padding-end',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'spacing', options)] = {
                value: "".concat(tokenSet.spacing, "px"),
                property: 'spacing',
                group: part,
            },
            _a) : {};
};
var transformBorderTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'BORDER'
        ? (_a = {},
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'border-width', options)] = {
                value: "".concat(tokenSet.weight, "px"),
                property: 'border-width',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'border-radius', options)] = {
                value: "".concat(tokenSet.radius, "px"),
                property: 'border-radius',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'border-color', options)] = {
                value: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.strokes).color,
                property: 'border-color',
                group: part,
            },
            _a) : {};
};
var transformTypographyTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'TYPOGRAPHY'
        ? (_a = {},
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'font-family', options)] = {
                value: "'".concat(tokenSet.fontFamily, "'"),
                property: 'font-family',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'font-size', options)] = {
                value: "".concat(tokenSet.fontSize, "px"),
                property: 'font-size',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'font-weight', options)] = {
                value: "".concat(tokenSet.fontWeight),
                property: 'font-weight',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'line-height', options)] = {
                value: "".concat(tokenSet.lineHeight),
                property: 'line-height',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'letter-spacing', options)] = {
                value: "".concat(tokenSet.letterSpacing, "px"),
                property: 'letter-spacing',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'text-align', options)] = {
                value: (0, convertColor_1.transformFigmaTextAlignToCss)(tokenSet.textAlignHorizontal),
                property: 'text-align',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'text-decoration', options)] = {
                value: (0, convertColor_1.transformFigmaTextDecorationToCss)(tokenSet.textDecoration),
                property: 'text-decoration',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'text-transform', options)] = {
                value: (0, convertColor_1.transformFigmaTextCaseToCssTextTransform)(tokenSet.textCase),
                property: 'text-transform',
                group: part,
            },
            _a) : {};
};
var transformFillTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'FILL'
        ? (_a = {},
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'color', options)] = {
                value: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.color).color,
                property: 'color',
                group: part,
            },
            _a) : {};
};
var transformEffectTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'EFFECT'
        ? (_a = {},
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'box-shadow', options)] = {
                value: tokenSet.effect.map(convertColor_1.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
                property: 'color',
                group: part,
            },
            _a) : {};
};
var transformOpacityTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    return tokenSet.name === 'OPACITY'
        ? (_a = {},
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'opacity', options)] = {
                value: "".concat(tokenSet.opacity),
                property: 'opacity',
                group: part,
            },
            _a) : {};
};
var transformSizeTokenSet = function (variableType, component, part, tokenSet, options) {
    var _a;
    var _b, _c, _d, _e;
    return tokenSet.name === 'SIZE'
        ? (_a = {},
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'width', options)] = {
                value: "".concat((_b = tokenSet.width) !== null && _b !== void 0 ? _b : '0', "px"),
                property: 'width',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'width-raw', options)] = {
                value: "".concat((_c = tokenSet.width) !== null && _c !== void 0 ? _c : '0'),
                property: 'width-raw',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'height', options)] = {
                value: "".concat((_d = tokenSet.height) !== null && _d !== void 0 ? _d : '0', "px"),
                property: 'height',
                group: part,
            },
            _a[(0, utils_1.formatVariableName)(variableType, component, part, 'height-raw', options)] = {
                value: "".concat((_e = tokenSet.height) !== null && _e !== void 0 ? _e : '0'),
                property: 'height-raw',
                group: part,
            },
            _a) : {};
};
