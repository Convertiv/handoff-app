export default function transformColors(colors) {
    var stringBuilder = [];
    colors.forEach(function (color) {
        stringBuilder.push("  --color-".concat(color.group, "-").concat(color.machineName, ": ").concat(color.value, ";"));
    });
    return ":root {\n".concat(stringBuilder.join('\n'), "\n}\n");
}
