"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Build effects CSS var list
 * @param effects
 * @returns
 */
function transformEffects(effects) {
    var stringBuilder = [];
    var validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(function (effect) { return effect.effects && effect.effects.length > 0; });
    if (validEffects) {
        validEffects.forEach(function (effect) {
            stringBuilder.push("\t--effect-".concat(effect.group, "-").concat(effect.machineName, ": ").concat(effect.effects.map(function (effect) { return effect.value; }).join(', ') || 'none', ";"));
        });
    }
    return ":root {\n".concat(stringBuilder.join('\n'), "\n}\n");
}
exports.default = transformEffects;
