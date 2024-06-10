"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformColors(colors) {
    var stringBuilder = [];
    colors.forEach(function (color) {
        stringBuilder.push("\t--color-".concat(color.group, "-").concat(color.machineName, ": ").concat(color.value, ";"));
    });
    return ":root {\n".concat(stringBuilder.join('\n'), "\n}\n");
}
exports.default = transformColors;
