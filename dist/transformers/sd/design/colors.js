"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Build colors style dictionary
 * @param effects
 * @returns
 */
function transformColors(colors) {
    var sd = {};
    colors.forEach(function (color) {
        var _a;
        var _b;
        (_a = sd[_b = color.group]) !== null && _a !== void 0 ? _a : (sd[_b] = {});
        sd[color.group][color.machineName] = {
            value: color.value
        };
    });
    return JSON.stringify({ 'color': sd }, null, 2);
}
exports.default = transformColors;
