import { EffectObject } from "../../../types";

export default function transformEffects(effects: EffectObject[]): string {
  const stringBuilder: Array<string> = [];

  const validEffects = effects?.filter(effect => effect.effects && effect.effects.length > 0);

  if (validEffects) {
    validEffects.forEach(effect => {
      stringBuilder.push(`$effect-${effect.group}-${effect.machineName}: ${effect.effects.map(effect => effect.value).join(', ') || 'none'};`)
    })
  }

  return stringBuilder.join('\n');
}