"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../utils");
function transformTypography(typography) {
    var stringBuilder = [];
    typography.forEach(function (type) {
        stringBuilder.push([
            "  --typography-".concat((0, utils_1.getTypeName)(type), "-font-family: '").concat(type.values.fontFamily, "';"),
            "  --typography-".concat((0, utils_1.getTypeName)(type), "-font-size: ").concat(type.values.fontSize, "px;"),
            "  --typography-".concat((0, utils_1.getTypeName)(type), "-font-weight: ").concat(type.values.fontWeight, ";"),
            "  --typography-".concat((0, utils_1.getTypeName)(type), "-line-height: ").concat((type.values.lineHeightPx / type.values.fontSize).toFixed(1), ";"),
            "  --typography-".concat((0, utils_1.getTypeName)(type), "-letter-spacing: ").concat(type.values.letterSpacing, "px;"),
            "  --typography-".concat((0, utils_1.getTypeName)(type), "-paragraph-spacing: ").concat(type.values.paragraphSpacing | 20, "px;"),
        ].join('\n'));
    });
    return ":root {\n".concat(stringBuilder.join('\n'), "\n}\n");
}
exports.default = transformTypography;
