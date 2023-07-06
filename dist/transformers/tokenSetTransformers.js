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
    return tokenSet.name === 'BACKGROUND'
        ? transformTokens({
            'background': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.background).color
        }, tokenType, component, part, options) : {};
};
var transformSpacingTokenSet = function (tokenType, component, part, tokenSet, options) {
    return tokenSet.name === 'SPACING'
        ? transformTokens({
            'padding-y': "".concat((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2, "px"),
            'padding-x': "".concat((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2, "px"),
            'padding-top': "".concat(tokenSet.padding.TOP, "px"),
            'padding-right': "".concat(tokenSet.padding.RIGHT, "px"),
            'padding-bottom': "".concat(tokenSet.padding.BOTTOM, "px"),
            'padding-left': "".concat(tokenSet.padding.LEFT, "px"),
            'padding-start': "".concat(tokenSet.padding.LEFT, "px"),
            'padding-end': "".concat(tokenSet.padding.RIGHT, "px"),
            'spacing': "".concat(tokenSet.spacing, "px"),
        }, tokenType, component, part, options) : {};
};
var transformBorderTokenSet = function (tokenType, component, part, tokenSet, options) {
    return tokenSet.name === 'BORDER'
        ? transformTokens({
            'border-width': "".concat(tokenSet.weight, "px"),
            'border-radius': "".concat(tokenSet.radius, "px"),
            'border-color': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.strokes).color,
        }, tokenType, component, part, options) : {};
};
var transformTypographyTokenSet = function (tokenType, component, part, tokenSet, options) {
    return tokenSet.name === 'TYPOGRAPHY'
        ? transformTokens({
            'font-family': "'".concat(tokenSet.fontFamily, "'"),
            'font-size': "".concat(tokenSet.fontSize, "px"),
            'font-weight': "".concat(tokenSet.fontWeight),
            'line-height': "".concat(tokenSet.lineHeight),
            'letter-spacing': "".concat(tokenSet.letterSpacing, "px"),
            'text-align': (0, convertColor_1.transformFigmaTextAlignToCss)(tokenSet.textAlignHorizontal),
            'text-decoration': (0, convertColor_1.transformFigmaTextDecorationToCss)(tokenSet.textDecoration),
            'text-transform': (0, convertColor_1.transformFigmaTextCaseToCssTextTransform)(tokenSet.textCase)
        }, tokenType, component, part, options) : {};
};
var transformFillTokenSet = function (tokenType, component, part, tokenSet, options) {
    return tokenSet.name === 'FILL'
        ? transformTokens({
            'color': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.color).color,
        }, tokenType, component, part, options) : {};
};
var transformEffectTokenSet = function (tokenType, component, part, tokenSet, options) {
    return tokenSet.name === 'EFFECT'
        ? transformTokens({
            'box-shadow': tokenSet.effect.map(convertColor_1.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none'
        }, tokenType, component, part, options) : {};
};
var transformOpacityTokenSet = function (tokenType, component, part, tokenSet, options) {
    return tokenSet.name === 'OPACITY'
        ? transformTokens({
            'opacity': "".concat(tokenSet.opacity),
        }, tokenType, component, part, options) : {};
};
var transformSizeTokenSet = function (tokenType, component, part, tokenSet, options) {
    var _a, _b, _c, _d;
    return tokenSet.name === 'SIZE'
        ? transformTokens({
            'width': "".concat((_a = tokenSet.width) !== null && _a !== void 0 ? _a : '0', "px"),
            'width-raw': "".concat((_b = tokenSet.width) !== null && _b !== void 0 ? _b : '0'),
            'height': "".concat((_c = tokenSet.height) !== null && _c !== void 0 ? _c : '0', "px"),
            'height-raw': "".concat((_d = tokenSet.height) !== null && _d !== void 0 ? _d : '0'),
        }, tokenType, component, part, options) : {};
};
var transformTokens = function (tokens, tokenType, component, part, options) {
    return Object.entries(tokens).reduce(function (acc, _a) {
        var _b;
        var property = _a[0], value = _a[1];
        return __assign(__assign({}, acc), (_b = {}, _b[(0, utils_1.formatTokenName)(tokenType, component, part, property, options)] = {
            value: value,
            property: property,
            part: part,
        }, _b));
    }, {});
};
