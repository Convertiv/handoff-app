import { PatternListObject } from '../../transformers/preview/types';

type RawPatternDeclaration = Record<string, any>;

type NormalizePatternOptions = {
  declarationPath: string;
  fallbackId: string;
  warn: (message: string) => void;
};

export const normalizePatternDeclaration = (
  raw: RawPatternDeclaration,
  options: NormalizePatternOptions
): PatternListObject => {
  if (!raw.name || typeof raw.name !== 'string') {
    throw new Error(
      `[handoff] Pattern "${options.fallbackId}" in "${options.declarationPath}" is missing a required "name" field.`
    );
  }

  if (!Array.isArray(raw.components) || raw.components.length === 0) {
    throw new Error(
      `[handoff] Pattern "${options.fallbackId}" in "${options.declarationPath}" must define a non-empty "components" array.`
    );
  }

  const components = raw.components.map((ref: any, index: number) => {
    if (!ref || typeof ref.id !== 'string' || ref.id.trim().length === 0) {
      throw new Error(
        `[handoff] Pattern "${options.fallbackId}" in "${options.declarationPath}" has an invalid component reference at index ${index}: missing "id".`
      );
    }

    const preview = typeof ref.preview === 'string' ? ref.preview.trim() : undefined;

    if (!preview && !ref.args) {
      options.warn(
        `[handoff] Pattern "${options.fallbackId}" component ref "${ref.id}" at index ${index} has neither "preview" nor "args". The component's default preview will be used.`
      );
    }

    return {
      id: ref.id.trim(),
      preview,
      args: ref.args && typeof ref.args === 'object' ? { ...ref.args } : undefined,
    };
  });

  const explicitId =
    typeof raw.id === 'string' && raw.id.trim().length > 0
      ? raw.id.trim()
      : undefined;

  return {
    id: explicitId || options.fallbackId,
    title: raw.name,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    group: typeof raw.group === 'string' ? raw.group : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t: any) => typeof t === 'string') : undefined,
    components,
    path: '',
  };
};
