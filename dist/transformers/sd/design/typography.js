"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Build typography style dictionary
 * @param effects
 * @returns
 */
function transformTypography(typography) {
    var sd = {};
    typography.forEach(function (type) {
        var _a, _b, _c, _d, _e;
        var _f, _g, _h, _j, _k;
        (_a = sd[_f = getTypeName(type)]) !== null && _a !== void 0 ? _a : (sd[_f] = {});
        (_b = (_g = sd[getTypeName(type)])['font']) !== null && _b !== void 0 ? _b : (_g['font'] = {});
        sd[getTypeName(type)]['font']['family'] = { value: type.values.fontFamily };
        sd[getTypeName(type)]['font']['size'] = { value: "".concat(type.values.fontSize, "px") };
        sd[getTypeName(type)]['font']['weight'] = { value: type.values.fontWeight };
        (_c = (_h = sd[getTypeName(type)])['line']) !== null && _c !== void 0 ? _c : (_h['line'] = {});
        sd[getTypeName(type)]['line']['height'] = { value: (type.values.lineHeightPx / type.values.fontSize).toFixed(1) };
        (_d = (_j = sd[getTypeName(type)])['letter']) !== null && _d !== void 0 ? _d : (_j['letter'] = {});
        sd[getTypeName(type)]['letter']['spacing'] = { value: "".concat(type.values.letterSpacing, "px") };
        (_e = (_k = sd[getTypeName(type)])['paragraph']) !== null && _e !== void 0 ? _e : (_k['paragraph'] = {});
        sd[getTypeName(type)]['paragraph']['spacing'] = { value: "".concat(type.values.paragraphSpacing | 20, "px") };
    });
    return JSON.stringify({ 'typography': sd }, null, 2);
}
exports.default = transformTypography;
// TODO: Move to utils
function getTypeName(type) {
    return type.group
        ? "".concat(type.group, "-").concat(type.machine_name)
        : "".concat(type.machine_name);
}
