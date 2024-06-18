/**
 * Build effects style dictionary
 * @param effects
 * @returns
 */
export default function transformEffects(effects) {
    var sd = {};
    var validEffects = effects === null || effects === void 0 ? void 0 : effects.filter(function (effect) { return effect.effects && effect.effects.length > 0; });
    if (validEffects) {
        validEffects.forEach(function (effect) {
            var _a;
            var _b;
            (_a = sd[_b = effect.group]) !== null && _a !== void 0 ? _a : (sd[_b] = {});
            sd[effect.group][effect.machineName] = {
                value: effect.effects.map(function (effect) { return effect.value; }).join(', ') || 'none'
            };
        });
    }
    return JSON.stringify({ 'effect': sd }, null, 2);
}
