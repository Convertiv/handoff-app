var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { getTypeName } from "../../utils.js";
/**
 * Build typography style dictionary
 * @param effects
 * @returns
 */
export default function transformTypography(typography) {
    return JSON.stringify({
        'typography': typography.reduce(function (obj, type) {
            var _a;
            return (__assign(__assign({}, obj), (_a = {}, _a[getTypeName(type)] = {
                'font': {
                    'family': { value: type.values.fontFamily },
                    'size': { value: "".concat(type.values.fontSize, "px") },
                    'weight': { value: type.values.fontWeight },
                },
                'line': {
                    'height': { value: (type.values.lineHeightPx / type.values.fontSize).toFixed(1) },
                },
                'letter': {
                    'spacing': { value: "".concat(type.values.letterSpacing, "px") },
                },
                'paragraph': {
                    'spacing': { value: "".concat(type.values.paragraphSpacing | 20, "px") },
                },
            }, _a)));
        }, {})
    }, null, 2);
}
