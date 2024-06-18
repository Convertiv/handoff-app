import { getTypeName } from "../../utils";
export default function transformTypography(typography) {
    var result = {};
    typography.forEach(function (type) {
        result["typography-".concat(getTypeName(type), "-font-family")] = "".concat(type.values.fontFamily);
        result["typography-".concat(getTypeName(type), "-font-size")] = "".concat(type.values.fontSize, "px");
        result["typography-".concat(getTypeName(type), "-font-weight")] = "".concat(type.values.fontWeight);
        result["typography-".concat(getTypeName(type), "-line-height")] = "".concat((type.values.lineHeightPx / type.values.fontSize).toFixed(1));
        result["typography-".concat(getTypeName(type), "-letter-spacing")] = "".concat(type.values.letterSpacing, "px");
        result["typography-".concat(getTypeName(type), "-paragraph-spacing")] = "".concat(type.values.paragraphSpacing | 20, "px");
    });
    return result;
}
