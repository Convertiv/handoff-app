"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformEffects(effects) {
    var result = {};
    var validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(function (effect) { return effect.effects && effect.effects.length > 0; });
    if (validEffects) {
        validEffects.forEach(function (effect) {
            result["effect-".concat(effect.group, "-").concat(effect.machineName)] = "".concat(effect.effects.map(function (effect) { return effect.value; }).join(', ') || 'none');
        });
    }
    return result;
}
exports.default = transformEffects;
