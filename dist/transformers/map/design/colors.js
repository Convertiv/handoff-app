"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformColors(colors) {
    var result = {};
    colors.forEach(function (color) {
        result["color-".concat(color.group, "-").concat(color.machineName)] = "".concat(color.value);
    });
    return JSON.stringify(result, null, 2);
}
exports.default = transformColors;
