"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformColorTypes = void 0;
function transformColorTypes(colors) {
    var stringBuilder = [];
    stringBuilder.push("$color-groups: ( ".concat(Array.from(new Set(colors.map(function (color) { return "\"".concat(color.group, "\""); }))).join(', '), " );"));
    stringBuilder.push("$color-names: ( ".concat(colors.map(function (color) { return "\"".concat(color.group, "-").concat(color.machineName, "\""); }).join(', '), " );"));
    stringBuilder.push("");
    return stringBuilder.join('\n');
}
exports.transformColorTypes = transformColorTypes;
function transformColors(colors) {
    var stringBuilder = [];
    colors.forEach(function (color) {
        stringBuilder.push("$color-".concat(color.group, "-").concat(color.machineName, ": ").concat(color.value, ";"));
    });
    return stringBuilder.join('\n');
}
exports.default = transformColors;
