"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformTypographyTypes = void 0;
const utils_1 = require("../../utils");
function transformTypographyTypes(typography) {
    const stringBuilder = [];
    stringBuilder.push(`$type-sizes: ( ${typography.map(type => `"${(0, utils_1.getTypeName)(type)}"`).join(', ')} );`);
    return stringBuilder.join('\n');
}
exports.transformTypographyTypes = transformTypographyTypes;
function transformTypography(typography) {
    const stringBuilder = [];
    typography.forEach(type => {
        stringBuilder.push([
            `$typography-${(0, utils_1.getTypeName)(type)}-font-family: '${type.values.fontFamily}';`,
            `$typography-${(0, utils_1.getTypeName)(type)}-font-size: ${type.values.fontSize}px;`,
            `$typography-${(0, utils_1.getTypeName)(type)}-font-weight: ${type.values.fontWeight};`,
            `$typography-${(0, utils_1.getTypeName)(type)}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`,
            `$typography-${(0, utils_1.getTypeName)(type)}-letter-spacing: ${type.values.letterSpacing}px;`,
            `$typography-${(0, utils_1.getTypeName)(type)}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`,
        ].join('\n'));
    });
    // Get a unique list of font families
    const fontFamilies = typography.map(type => type.values.fontFamily);
    const uniqueFontFamilies = Array.from(new Set(fontFamilies));
    // Add the font families to the top of the typography
    uniqueFontFamilies.forEach(fontFamily => {
        stringBuilder.unshift(`$font-family-${fontFamily.replace(/ /g, '-').toLowerCase()}: '${fontFamily}';`);
    });
    return stringBuilder.join('\n');
}
exports.default = transformTypography;
