"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenSetTokens = void 0;
var convertColor_1 = require("../utils/convertColor");
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
exports.getTokenSetTokens = getTokenSetTokens;
var getBackgroundTokenSetTokens = function (tokenSet) { return ({
    'background': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.background).color
}); };
var getSpacingTokenSetTokens = function (tokenSet) { return ({
    'padding-y': ["".concat((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2, "px"), false],
    'padding-x': ["".concat((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2, "px"), false],
    'padding-top': "".concat(tokenSet.padding.TOP, "px"),
    'padding-right': "".concat(tokenSet.padding.RIGHT, "px"),
    'padding-bottom': "".concat(tokenSet.padding.BOTTOM, "px"),
    'padding-left': ["".concat(tokenSet.padding.LEFT, "px"), false],
    'padding-start': ["".concat(tokenSet.padding.LEFT, "px"), false],
    'padding-end': "".concat(tokenSet.padding.RIGHT, "px"),
    'spacing': ["".concat(tokenSet.spacing, "px"), false],
}); };
var getBorderTokenSetTokens = function (tokenSet) {
    var _a;
    return ({
        'border-width': "".concat(tokenSet.weight, "px"),
        'border-radius': "".concat(tokenSet.radius, "px"),
        'border-color': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.strokes, true).color,
        'border-style': ((_a = tokenSet.dashes[0]) !== null && _a !== void 0 ? _a : 0) === 0 ? 'solid' : 'dashed',
    });
};
var getTypographyTokenSetTokens = function (tokenSet) { return ({
    'font-family': "'".concat(tokenSet.fontFamily, "'"),
    'font-size': "".concat(tokenSet.fontSize, "px"),
    'font-weight': "".concat(tokenSet.fontWeight),
    'line-height': "".concat(tokenSet.lineHeight),
    'letter-spacing': "".concat(tokenSet.letterSpacing, "px"),
    'text-align': (0, convertColor_1.transformFigmaTextAlignToCss)(tokenSet.textAlignHorizontal),
    'text-decoration': (0, convertColor_1.transformFigmaTextDecorationToCss)(tokenSet.textDecoration),
    'text-transform': (0, convertColor_1.transformFigmaTextCaseToCssTextTransform)(tokenSet.textCase)
}); };
var getFillTokenSetTokens = function (tokenSet) { return ({
    'color': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.color, true).color,
}); };
var getEffectTokenSetTokens = function (tokenSet) { return ({
    'box-shadow': tokenSet.effect.map(convertColor_1.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none'
}); };
var getOpacityTokenSetTokens = function (tokenSet) { return ({
    'opacity': "".concat(tokenSet.opacity),
}); };
var getSizeTokenSetTokens = function (tokenSet) {
    var _a, _b, _c, _d;
    return ({
        'width': "".concat((_a = tokenSet.width) !== null && _a !== void 0 ? _a : '0', "px"),
        'width-raw': ["".concat((_b = tokenSet.width) !== null && _b !== void 0 ? _b : '0'), false],
        'height': "".concat((_c = tokenSet.height) !== null && _c !== void 0 ? _c : '0', "px"),
        'height-raw': ["".concat((_d = tokenSet.height) !== null && _d !== void 0 ? _d : '0'), false],
    });
};
