"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function transformEffects(effects) {
    const result = {};
    const validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(effect => effect.effects && effect.effects.length > 0);
    if (validEffects) {
        validEffects.forEach(effect => {
            result[`effect-${effect.group}-${effect.machineName}`] = `${effect.effects.map(effect => effect.value).join(', ') || 'none'}`;
        });
    }
    return result;
}
exports.default = transformEffects;
