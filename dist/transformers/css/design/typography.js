import { getTypeName } from "../../utils";
export default function transformTypography(typography) {
    var stringBuilder = [];
    typography.forEach(function (type) {
        stringBuilder.push([
            "\t--typography-".concat(getTypeName(type), "-font-family: '").concat(type.values.fontFamily, "';"),
            "\t--typography-".concat(getTypeName(type), "-font-size: ").concat(type.values.fontSize, "px;"),
            "\t--typography-".concat(getTypeName(type), "-font-weight: ").concat(type.values.fontWeight, ";"),
            "\t--typography-".concat(getTypeName(type), "-line-height: ").concat((type.values.lineHeightPx / type.values.fontSize).toFixed(1), ";"),
            "\t--typography-".concat(getTypeName(type), "-letter-spacing: ").concat(type.values.letterSpacing, "px;"),
            "\t--typography-".concat(getTypeName(type), "-paragraph-spacing: ").concat(type.values.paragraphSpacing | 20, "px;"),
        ].join('\n'));
    });
    return ":root {\n".concat(stringBuilder.join('\n'), "\n}\n");
}
