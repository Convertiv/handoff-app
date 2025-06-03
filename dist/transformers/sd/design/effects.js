"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Build effects style dictionary
 * @param effects
 * @returns
 */
function transformEffects(effects) {
    const sd = {};
    const validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(effect => effect.effects && effect.effects.length > 0);
    if (validEffects) {
        validEffects.forEach(effect => {
            var _a;
            var _b;
            (_a = sd[_b = effect.group]) !== null && _a !== void 0 ? _a : (sd[_b] = {});
            sd[effect.group][effect.machineName] = {
                value: effect.effects.map(effect => effect.value).join(', ') || 'none'
            };
        });
    }
    return JSON.stringify({ 'effect': sd }, null, 2);
}
exports.default = transformEffects;
