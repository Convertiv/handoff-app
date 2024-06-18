export function transformColorTypes(colors) {
    var stringBuilder = [];
    stringBuilder.push("$color-groups: ( ".concat(Array.from(new Set(colors.map(function (color) { return "\"".concat(color.group, "\""); }))).join(', '), " );"));
    stringBuilder.push("$color-names: ( ".concat(colors.map(function (color) { return "\"".concat(color.group, "-").concat(color.machineName, "\""); }).join(', '), " );"));
    stringBuilder.push("");
    return stringBuilder.join('\n');
}
export default function transformColors(colors) {
    var stringBuilder = [];
    colors.forEach(function (color) {
        stringBuilder.push("$color-".concat(color.group, "-").concat(color.machineName, ": ").concat(color.value, ";"));
    });
    return stringBuilder.join('\n');
}
