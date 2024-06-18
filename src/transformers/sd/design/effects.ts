import { EffectObject } from "../../../types.js";

/**
 * Build effects style dictionary
 * @param effects
 * @returns
 */
export default function transformEffects(effects: EffectObject[]): string {
  const sd = {} as any;
  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);

  if (validEffects) {
    validEffects.forEach(effect => {
      sd[effect.group] ??= {};
      sd[effect.group][effect.machineName] = {
        value: effect.effects.map(effect => effect.value).join(', ') || 'none'
      };
    });
  }

  return JSON.stringify({ 'effect': sd }, null, 2);
}
