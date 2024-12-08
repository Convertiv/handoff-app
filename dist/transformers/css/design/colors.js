"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformColors(colors) {
    const stringBuilder = [];
    colors.forEach(color => {
        stringBuilder.push(`	--color-${color.group}-${color.machineName}: ${color.value};`);
    });
    return `:root {\n${stringBuilder.join('\n')}\n}\n`;
}
exports.default = transformColors;
