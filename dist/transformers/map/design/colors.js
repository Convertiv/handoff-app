"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformColors(colors) {
    var result = {};
    colors.forEach(function (color) {
        result["color-".concat(color.group, "-").concat(color.machineName)] = "".concat(color.value);
    });
    return result;
}
exports.default = transformColors;
