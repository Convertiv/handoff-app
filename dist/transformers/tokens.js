"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenSetNameByProperty = exports.getTokenSetTokens = void 0;
const convertColor_1 = require("../utils/convertColor");
const numbers_1 = require("../utils/numbers");
const getTokenSetTokens = (tokenSet) => {
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
const getTokenSetNameByProperty = (cssProp) => {
    return keyToTokenSetMap[cssProp];
};
exports.getTokenSetNameByProperty = getTokenSetNameByProperty;
const getBackgroundTokenSetTokens = (tokenSet) => ({
    background: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.background).color,
});
const getSpacingTokenSetTokens = (tokenSet) => ({
    'padding-y': [`${(0, numbers_1.normalizeCssNumber)((tokenSet.padding.TOP + tokenSet.padding.BOTTOM) / 2)}px`, false],
    'padding-x': [`${(0, numbers_1.normalizeCssNumber)((tokenSet.padding.LEFT + tokenSet.padding.RIGHT) / 2)}px`, false],
    'padding-top': `${(0, numbers_1.normalizeCssNumber)(tokenSet.padding.TOP)}px`,
    'padding-right': `${(0, numbers_1.normalizeCssNumber)(tokenSet.padding.RIGHT)}px`,
    'padding-bottom': `${(0, numbers_1.normalizeCssNumber)(tokenSet.padding.BOTTOM)}px`,
    'padding-left': [`${(0, numbers_1.normalizeCssNumber)(tokenSet.padding.LEFT)}px`, false],
    'padding-start': [`${(0, numbers_1.normalizeCssNumber)(tokenSet.padding.LEFT)}px`, false],
    'padding-end': `${(0, numbers_1.normalizeCssNumber)(tokenSet.padding.RIGHT)}px`,
    spacing: [`${(0, numbers_1.normalizeCssNumber)(tokenSet.spacing)}px`, false],
});
const getBorderTokenSetTokens = (tokenSet) => {
    var _a;
    return ({
        'border-width': `${(0, numbers_1.normalizeCssNumber)(tokenSet.weight)}px`,
        'border-radius': `${(0, numbers_1.normalizeCssNumber)(tokenSet.radius)}px`,
        'border-color': (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.strokes, true).color,
        'border-style': ((_a = tokenSet.dashes[0]) !== null && _a !== void 0 ? _a : 0) === 0 ? 'solid' : 'dashed',
    });
};
const getTypographyTokenSetTokens = (tokenSet) => ({
    'font-family': `'${tokenSet.fontFamily}'`,
    'font-size': `${(0, numbers_1.normalizeCssNumber)(tokenSet.fontSize)}px`,
    'font-weight': `${(0, numbers_1.normalizeCssNumber)(tokenSet.fontWeight)}`,
    'line-height': `${(0, numbers_1.normalizeCssNumber)(tokenSet.lineHeight)}`,
    'letter-spacing': `${(0, numbers_1.normalizeCssNumber)(tokenSet.letterSpacing)}px`,
    'text-align': (0, convertColor_1.transformFigmaTextAlignToCss)(tokenSet.textAlignHorizontal),
    'text-decoration': (0, convertColor_1.transformFigmaTextDecorationToCss)(tokenSet.textDecoration),
    'text-transform': (0, convertColor_1.transformFigmaTextCaseToCssTextTransform)(tokenSet.textCase),
});
const getFillTokenSetTokens = (tokenSet) => ({
    color: (0, convertColor_1.transformFigmaFillsToCssColor)(tokenSet.color, true).color,
});
const getEffectTokenSetTokens = (tokenSet) => ({
    'box-shadow': tokenSet.effect.map(convertColor_1.transformFigmaEffectToCssBoxShadow).filter(Boolean).join(', ') || 'none',
});
const getOpacityTokenSetTokens = (tokenSet) => ({
    opacity: `${(0, numbers_1.normalizeCssNumber)(tokenSet.opacity)}`,
});
const getSizeTokenSetTokens = (tokenSet) => {
    var _a, _b, _c, _d;
    return ({
        width: `${(_a = (0, numbers_1.normalizeCssNumber)(tokenSet.width)) !== null && _a !== void 0 ? _a : '0'}px`,
        'width-raw': [`${(_b = (0, numbers_1.normalizeCssNumber)(tokenSet.width)) !== null && _b !== void 0 ? _b : '0'}`, false],
        height: `${(_c = (0, numbers_1.normalizeCssNumber)(tokenSet.height)) !== null && _c !== void 0 ? _c : '0'}px`,
        'height-raw': [`${(_d = (0, numbers_1.normalizeCssNumber)(tokenSet.height)) !== null && _d !== void 0 ? _d : '0'}`, false],
    });
};
const keyToTokenSetMap = {
    // Background tokens
    background: 'BACKGROUND',
    // Spacing tokens
    'padding-y': 'SPACING',
    'padding-x': 'SPACING',
    'padding-top': 'SPACING',
    'padding-right': 'SPACING',
    'padding-bottom': 'SPACING',
    'padding-left': 'SPACING',
    'padding-start': 'SPACING',
    'padding-end': 'SPACING',
    spacing: 'SPACING',
    // Border tokens
    'border-width': 'BORDER',
    'border-radius': 'BORDER',
    'border-color': 'BORDER',
    'border-style': 'BORDER',
    // Typography tokens
    'font-family': 'TYPOGRAPHY',
    'font-size': 'TYPOGRAPHY',
    'font-weight': 'TYPOGRAPHY',
    'line-height': 'TYPOGRAPHY',
    'letter-spacing': 'TYPOGRAPHY',
    'text-align': 'TYPOGRAPHY',
    'text-decoration': 'TYPOGRAPHY',
    'text-transform': 'TYPOGRAPHY',
    // Fill tokens
    color: 'FILL',
    // Effect tokens
    'box-shadow': 'EFFECT',
    // Opacity tokens
    opacity: 'OPACITY',
    // Size tokens
    width: 'SIZE',
    'width-raw': 'SIZE',
    height: 'SIZE',
    'height-raw': 'SIZE',
};
