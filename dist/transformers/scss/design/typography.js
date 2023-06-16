export function transformTypographyTypes(typography) {
    var stringBuilder = [];
    stringBuilder.push("$type-sizes: ( ".concat(typography.map(function (type) { return "\"".concat(getTypeName(type), "\""); }).join(', '), " );"));
    return stringBuilder.join('\n');
}
export default function transformTypography(typography) {
    var stringBuilder = [];
    typography.forEach(function (type) {
        stringBuilder.push([
            "$typography-".concat(getTypeName(type), "-font-family: '").concat(type.values.fontFamily, "';"),
            "$typography-".concat(getTypeName(type), "-font-size: ").concat(type.values.fontSize, "px;"),
            "$typography-".concat(getTypeName(type), "-font-weight: ").concat(type.values.fontWeight, ";"),
            "$typography-".concat(getTypeName(type), "-line-height: ").concat((type.values.lineHeightPx / type.values.fontSize).toFixed(1), ";"),
            "$typography-".concat(getTypeName(type), "-letter-spacing: ").concat(type.values.letterSpacing, "px;"),
            "$typography-".concat(getTypeName(type), "-paragraph-spacing: ").concat(type.values.paragraphSpacing | 20, "px;"),
        ].join('\n'));
    });
    return stringBuilder.join('\n');
}
function getTypeName(type) {
    return type.group
        ? "".concat(type.group, "-").concat(type.machine_name)
        : "".concat(type.machine_name);
}
