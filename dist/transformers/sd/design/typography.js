"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
/**
 * Build typography style dictionary
 * @param effects
 * @returns
 */
function transformTypography(typography) {
    return JSON.stringify({
        'typography': typography.reduce((obj, type) => (Object.assign(Object.assign({}, obj), { [(0, utils_1.getTypeName)(type)]: {
                'font': {
                    'family': { value: type.values.fontFamily },
                    'size': { value: `${type.values.fontSize}px` },
                    'weight': { value: type.values.fontWeight },
                },
                'line': {
                    'height': { value: (type.values.lineHeightPx / type.values.fontSize).toFixed(1) },
                },
                'letter': {
                    'spacing': { value: `${type.values.letterSpacing}px` },
                },
                'paragraph': {
                    'spacing': { value: `${type.values.paragraphSpacing | 20}px` },
                },
            } })), {})
    }, null, 2);
}
exports.default = transformTypography;
