"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformColorTypes = void 0;
function transformColorTypes(colors) {
    const stringBuilder = [];
    stringBuilder.push(`$color-groups: ( ${Array.from(new Set(colors.map(color => `"${color.group}"`))).join(', ')} );`);
    stringBuilder.push(`$color-names: ( ${colors.map(color => `"${color.group}-${color.machineName}"`).join(', ')} );`);
    stringBuilder.push(``);
    return stringBuilder.join('\n');
}
exports.transformColorTypes = transformColorTypes;
function transformColors(colors) {
    const stringBuilder = [];
    colors.forEach(color => {
        stringBuilder.push(`$color-${color.group}-${color.machineName}: ${color.value};`);
    });
    return stringBuilder.join('\n');
}
exports.default = transformColors;
