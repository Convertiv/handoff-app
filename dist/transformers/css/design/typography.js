"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../utils");
function transformTypography(typography) {
    var stringBuilder = [];
    typography.forEach(function (type) {
        stringBuilder.push([
            "\t--typography-".concat((0, utils_1.getTypeName)(type), "-font-family: '").concat(type.values.fontFamily, "';"),
            "\t--typography-".concat((0, utils_1.getTypeName)(type), "-font-size: ").concat(type.values.fontSize, "px;"),
            "\t--typography-".concat((0, utils_1.getTypeName)(type), "-font-weight: ").concat(type.values.fontWeight, ";"),
            "\t--typography-".concat((0, utils_1.getTypeName)(type), "-line-height: ").concat((type.values.lineHeightPx / type.values.fontSize).toFixed(1), ";"),
            "\t--typography-".concat((0, utils_1.getTypeName)(type), "-letter-spacing: ").concat(type.values.letterSpacing, "px;"),
            "\t--typography-".concat((0, utils_1.getTypeName)(type), "-paragraph-spacing: ").concat(type.values.paragraphSpacing | 20, "px;"),
        ].join('\n'));
    });
    // Get a unique list of font families
    var fontFamilies = typography.map(function (type) { return type.values.fontFamily; });
    var uniqueFontFamilies = Array.from(new Set(fontFamilies));
    // Add the font families to the top of the typography
    uniqueFontFamilies.forEach(function (fontFamily) {
        stringBuilder.unshift("\t--font-family-".concat(fontFamily.replace(/ /g, '-').toLowerCase(), ": '").concat(fontFamily, "';"));
    });
    return ":root {\n".concat(stringBuilder.join('\n'), "\n}\n");
}
exports.default = transformTypography;
