"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../utils");
function transformTypography(typography) {
    var result = {};
    typography.forEach(function (type) {
        result["typography-".concat((0, utils_1.getTypeName)(type), "-font-family")] = "".concat(type.values.fontFamily);
        result["typography-".concat((0, utils_1.getTypeName)(type), "-font-size")] = "".concat(type.values.fontSize, "px");
        result["typography-".concat((0, utils_1.getTypeName)(type), "-font-weight")] = "".concat(type.values.fontWeight);
        result["typography-".concat((0, utils_1.getTypeName)(type), "-line-height")] = "".concat((type.values.lineHeightPx / type.values.fontSize).toFixed(1));
        result["typography-".concat((0, utils_1.getTypeName)(type), "-letter-spacing")] = "".concat(type.values.letterSpacing, "px");
        result["typography-".concat((0, utils_1.getTypeName)(type), "-paragraph-spacing")] = "".concat(type.values.paragraphSpacing | 20, "px");
    });
    return result;
}
exports.default = transformTypography;
