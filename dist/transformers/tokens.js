import { transformFigmaEffectToCssBoxShadow, transformFigmaFillsToCssColor, transformFigmaTextAlignToCss, transformFigmaTextCaseToCssTextTransform, transformFigmaTextDecorationToCss } from '../utils/convertColor.js';
import { normalizeCssNumber } from '../utils/numbers.js';
export var getTokenSetTokens = function (tokenSet) {
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
    'background': transformFigmaFillsToCssColor(tokenSet.background).color
}); };
var getSpacingTokenSetTokens = function (tokenSet) { return ({
    'padding-y': ["".concat(normalizeCssNumber((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2), "px"), false],
    'padding-x': ["".concat(normalizeCssNumber((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2), "px"), false],
    'padding-top': "".concat(normalizeCssNumber(tokenSet.padding.TOP), "px"),
    'padding-right': "".concat(normalizeCssNumber(tokenSet.padding.RIGHT), "px"),
    'padding-bottom': "".concat(normalizeCssNumber(tokenSet.padding.BOTTOM), "px"),
    'padding-left': ["".concat(normalizeCssNumber(tokenSet.padding.LEFT), "px"), false],
    'padding-start': ["".concat(normalizeCssNumber(tokenSet.padding.LEFT), "px"), false],
    'padding-end': "".concat(normalizeCssNumber(tokenSet.padding.RIGHT), "px"),
    'spacing': ["".concat(normalizeCssNumber(tokenSet.spacing), "px"), false],
}); };
var getBorderTokenSetTokens = function (tokenSet) {
    var _a;
    return ({
        'border-width': "".concat(normalizeCssNumber(tokenSet.weight), "px"),
        'border-radius': "".concat(normalizeCssNumber(tokenSet.radius), "px"),
        'border-color': transformFigmaFillsToCssColor(tokenSet.strokes, true).color,
        'border-style': ((_a = tokenSet.dashes[0]) !== null && _a !== void 0 ? _a : 0) === 0 ? 'solid' : 'dashed',
    });
};
var getTypographyTokenSetTokens = function (tokenSet) { return ({
    'font-family': "'".concat(tokenSet.fontFamily, "'"),
    'font-size': "".concat(normalizeCssNumber(tokenSet.fontSize), "px"),
    'font-weight': "".concat(normalizeCssNumber(tokenSet.fontWeight)),
    'line-height': "".concat(normalizeCssNumber(tokenSet.lineHeight)),
    'letter-spacing': "".concat(normalizeCssNumber(tokenSet.letterSpacing), "px"),
    'text-align': transformFigmaTextAlignToCss(tokenSet.textAlignHorizontal),
    'text-decoration': transformFigmaTextDecorationToCss(tokenSet.textDecoration),
    'text-transform': transformFigmaTextCaseToCssTextTransform(tokenSet.textCase)
}); };
var getFillTokenSetTokens = function (tokenSet) { return ({
    'color': transformFigmaFillsToCssColor(tokenSet.color, true).color,
}); };
var getEffectTokenSetTokens = function (tokenSet) { return ({
    'box-shadow': tokenSet.effect.map(transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none'
}); };
var getOpacityTokenSetTokens = function (tokenSet) { return ({
    'opacity': "".concat(normalizeCssNumber(tokenSet.opacity)),
}); };
var getSizeTokenSetTokens = function (tokenSet) {
    var _a, _b, _c, _d;
    return ({
        'width': "".concat((_a = normalizeCssNumber(tokenSet.width)) !== null && _a !== void 0 ? _a : '0', "px"),
        'width-raw': ["".concat((_b = normalizeCssNumber(tokenSet.width)) !== null && _b !== void 0 ? _b : '0'), false],
        'height': "".concat((_c = normalizeCssNumber(tokenSet.height)) !== null && _c !== void 0 ? _c : '0', "px"),
        'height-raw': ["".concat((_d = normalizeCssNumber(tokenSet.height)) !== null && _d !== void 0 ? _d : '0'), false],
    });
};
