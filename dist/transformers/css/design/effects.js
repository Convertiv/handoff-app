"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Build effects CSS var list
 * @param effects
 * @returns
 */
function transformEffects(effects) {
    const stringBuilder = [];
    const validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(effect => effect.effects && effect.effects.length > 0);
    if (validEffects) {
        validEffects.forEach(effect => {
            stringBuilder.push(`	--effect-${effect.group}-${effect.machineName}: ${effect.effects.map(effect => effect.value).join(', ') || 'none'};`);
        });
    }
    return `:root {\n${stringBuilder.join('\n')}\n}\n`;
}
exports.default = transformEffects;
