"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
function transformTypography(typography) {
    const result = {};
    typography.forEach(type => {
        result[`typography-${(0, utils_1.getTypeName)(type)}-font-family`] = `${type.values.fontFamily}`;
        result[`typography-${(0, utils_1.getTypeName)(type)}-font-size`] = `${type.values.fontSize}px`;
        result[`typography-${(0, utils_1.getTypeName)(type)}-font-weight`] = `${type.values.fontWeight}`;
        result[`typography-${(0, utils_1.getTypeName)(type)}-line-height`] = `${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)}`;
        result[`typography-${(0, utils_1.getTypeName)(type)}-letter-spacing`] = `${type.values.letterSpacing}px`;
        result[`typography-${(0, utils_1.getTypeName)(type)}-paragraph-spacing`] = `${type.values.paragraphSpacing | 20}px`;
    });
    return result;
}
exports.default = transformTypography;
