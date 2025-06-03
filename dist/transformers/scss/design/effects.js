"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformEffectTypes = void 0;
function transformEffectTypes(effects) {
    const stringBuilder = [];
    const validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(effect => effect.effects && effect.effects.length > 0);
    if (validEffects) {
        stringBuilder.push(`$effects: ( ${validEffects.map(effect => `"${effect.group}-${effect.machineName}"`).join(', ')} );`);
        stringBuilder.push(``);
    }
    return stringBuilder.join('\n');
}
exports.transformEffectTypes = transformEffectTypes;
function transformEffects(effects) {
    const stringBuilder = [];
    const validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(effect => effect.effects && effect.effects.length > 0);
    if (validEffects) {
        validEffects.forEach(effect => {
            stringBuilder.push(`$effect-${effect.group}-${effect.machineName}: ${effect.effects.map(effect => effect.value).join(', ') || 'none'};`);
        });
    }
    return stringBuilder.join('\n');
}
exports.default = transformEffects;
