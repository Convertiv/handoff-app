"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformEffectTypes = void 0;
function transformEffectTypes(effects) {
    var stringBuilder = [];
    var validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(function (effect) { return effect.effects && effect.effects.length > 0; });
    if (validEffects) {
        stringBuilder.push("$effects: ( ".concat(validEffects.map(function (effect) { return "\"".concat(effect.group, "-").concat(effect.machineName, "\""); }).join(', '), " );"));
        stringBuilder.push("");
    }
    return stringBuilder.join('\n');
}
exports.transformEffectTypes = transformEffectTypes;
function transformEffects(effects) {
    var stringBuilder = [];
    var validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(function (effect) { return effect.effects && effect.effects.length > 0; });
    if (validEffects) {
        validEffects.forEach(function (effect) {
            stringBuilder.push("$effect-".concat(effect.group, "-").concat(effect.machineName, ": ").concat(effect.effects.map(function (effect) { return effect.value; }).join(', ') || 'none', ";"));
        });
    }
    return stringBuilder.join('\n');
}
exports.default = transformEffects;
