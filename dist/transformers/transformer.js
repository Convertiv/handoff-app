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
exports.transform = void 0;
var convertColor_1 = require("../utils/convertColor");
var utils_1 = require("./utils");
/**
 * Performs the transformation of the component tokens.
 *
 * @param component
 * @param options
 * @returns
 */
var transform = function (tokenType, component, options) {
    var result = {};
    for (var part in component.parts) {
        var tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            continue;
        }
        for (var _i = 0, tokenSets_1 = tokenSets; _i < tokenSets_1.length; _i++) {
            var tokenSet = tokenSets_1[_i];
            var tokens = getTokenSetTokens(tokenSet);
            result = __assign(__assign({}, result), transformTokens(tokens, tokenType, component, part, options));
        }
    }
    return result;
};
exports.transform = transform;
var getTokenSetTokens = function (tokenSet) {
    switch (tokenSet.name) {
        case 'BACKGROUND':
            return getBackgroundTokenSetTokens(tokenSet);
        case 'SPACING':
            return getSpacingTokenSetTokens(tokenSet);
        case 'BORDER':
            return getBorderTokenSetTokens(tokenSet);
        case 'TYPOGRAPHY':
            return getTypographyTokenSetTokens(tokenSet);
        case 'FILL':
            return getFillTokenSetTokens(tokenSet);
        case 'EFFECT':
            return getEffectTokenSetTokens(tokenSet);
        case 'OPACITY':
            return getOpacityTokenSetTokens(tokenSet);
        case 'SIZE':
            return getSizeTokenSetTokens(tokenSet);
        default:
            return undefined;
    }
};
var getBackgroundTokenSetTokens = function (tokenSet) { return ({
    background: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.background).color,
}); };
var getSpacingTokenSetTokens = function (tokenSet) { return ({
    'padding-y': "".concat((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2, "px"),
    'padding-x': "".concat((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2, "px"),
    'padding-top': "".concat(tokenSet.padding.TOP, "px"),
    'padding-right': "".concat(tokenSet.padding.RIGHT, "px"),
    'padding-bottom': "".concat(tokenSet.padding.BOTTOM, "px"),
    'padding-left': "".concat(tokenSet.padding.LEFT, "px"),
    'padding-start': "".concat(tokenSet.padding.LEFT, "px"),
    'padding-end': "".concat(tokenSet.padding.RIGHT, "px"),
    spacing: "".concat(tokenSet.spacing, "px"),
}); };
var getBorderTokenSetTokens = function (tokenSet) { return ({
    'border-width': "".concat(tokenSet.weight, "px"),
    'border-radius': "".concat(tokenSet.radius, "px"),
    'border-color': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.strokes).color,
}); };
var getTypographyTokenSetTokens = function (tokenSet) { return ({
    'font-family': "'".concat(tokenSet.fontFamily, "'"),
    'font-size': "".concat(tokenSet.fontSize, "px"),
    'font-weight': "".concat(tokenSet.fontWeight),
    'line-height': "".concat(tokenSet.lineHeight),
    'letter-spacing': "".concat(tokenSet.letterSpacing, "px"),
    'text-align': (0, convertColor_1.transformFigmaTextAlignToCss)(tokenSet.textAlignHorizontal),
    'text-decoration': (0, convertColor_1.transformFigmaTextDecorationToCss)(tokenSet.textDecoration),
    'text-transform': (0, convertColor_1.transformFigmaTextCaseToCssTextTransform)(tokenSet.textCase),
}); };
var getFillTokenSetTokens = function (tokenSet) { return ({
    color: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.color).color,
}); };
var getEffectTokenSetTokens = function (tokenSet) { return ({
    'box-shadow': tokenSet.effect.map(convertColor_1.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
}); };
var getOpacityTokenSetTokens = function (tokenSet) { return ({
    opacity: "".concat(tokenSet.opacity),
}); };
var getSizeTokenSetTokens = function (tokenSet) {
    var _a, _b, _c, _d;
    return ({
        width: "".concat((_a = tokenSet.width) !== null && _a !== void 0 ? _a : '0', "px"),
        'width-raw': "".concat((_b = tokenSet.width) !== null && _b !== void 0 ? _b : '0'),
        height: "".concat((_c = tokenSet.height) !== null && _c !== void 0 ? _c : '0', "px"),
        'height-raw': "".concat((_d = tokenSet.height) !== null && _d !== void 0 ? _d : '0'),
    });
};
var transformTokens = function (tokens, tokenType, component, part, options) {
    return tokens
        ? Object.entries(tokens).reduce(function (record, _a) {
            var _b;
            var property = _a[0], value = _a[1];
            return (__assign(__assign({}, record), (_b = {}, _b[(0, utils_1.formatTokenName)(tokenType, component, part, property, options)] = {
                value: value,
                property: property,
                part: part,
                metadata: __assign(__assign({}, (0, utils_1.getTokenMetadata)(component, part, options)), { propertyPath: (0, utils_1.getReducedTokenPropertyPath)(component, part, property, options) }),
            }, _b)));
        }, {})
        : {};
};
