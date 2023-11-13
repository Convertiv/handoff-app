import { EffectObject } from "../../../types";

export default function transformEffects(effects: EffectObject[]) {
  const result: Record<string, string> = {};

  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);

  if (validEffects) {
    validEffects.forEach(effect => {
      result[`effect-${effect.group}-${effect.machineName}`] = `${effect.effects.map(effect => effect.value).join(', ') || 'none'}`;
    })
  }

  return result;
}