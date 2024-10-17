"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformTypographyTypes = void 0;
var utils_1 = require("../../utils");
function transformTypographyTypes(typography) {
    var stringBuilder = [];
    stringBuilder.push("$type-sizes: ( ".concat(typography.map(function (type) { return "\"".concat((0, utils_1.getTypeName)(type), "\""); }).join(', '), " );"));
    return stringBuilder.join('\n');
}
exports.transformTypographyTypes = transformTypographyTypes;
function transformTypography(typography) {
    var stringBuilder = [];
    typography.forEach(function (type) {
        stringBuilder.push([
            "$typography-".concat((0, utils_1.getTypeName)(type), "-font-family: '").concat(type.values.fontFamily, "';"),
            "$typography-".concat((0, utils_1.getTypeName)(type), "-font-size: ").concat(type.values.fontSize, "px;"),
            "$typography-".concat((0, utils_1.getTypeName)(type), "-font-weight: ").concat(type.values.fontWeight, ";"),
            "$typography-".concat((0, utils_1.getTypeName)(type), "-line-height: ").concat((type.values.lineHeightPx / type.values.fontSize).toFixed(1), ";"),
            "$typography-".concat((0, utils_1.getTypeName)(type), "-letter-spacing: ").concat(type.values.letterSpacing, "px;"),
            "$typography-".concat((0, utils_1.getTypeName)(type), "-paragraph-spacing: ").concat(type.values.paragraphSpacing | 20, "px;"),
        ].join('\n'));
    });
    // Get a unique list of font families
    var fontFamilies = typography.map(function (type) { return type.values.fontFamily; });
    var uniqueFontFamilies = Array.from(new Set(fontFamilies));
    // Add the font families to the top of the typography
    uniqueFontFamilies.forEach(function (fontFamily) {
        stringBuilder.unshift("$font-family-".concat(fontFamily.replace(/ /g, '-').toLowerCase(), ": '").concat(fontFamily, "';"));
    });
    return stringBuilder.join('\n');
}
exports.default = transformTypography;
