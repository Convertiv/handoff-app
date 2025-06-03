"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformColors(colors) {
    const result = {};
    colors.forEach(color => {
        result[`color-${color.group}-${color.machineName}`] = `${color.value}`;
    });
    return result;
}
exports.default = transformColors;
