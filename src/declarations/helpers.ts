import {
  CsfDeclarationConfig,
  GenericDeclarationConfig,
  GenericPatternDeclarationConfig,
  HandlebarsDeclarationConfig,
  ReactComponentType,
  ReactDeclarationConfig,
} from './types';

/** Name of the deprecated factory that produced a declaration. */
export const DEPRECATED_API_KEY = '__handoffDeprecatedApi';

/**
 * Records which deprecated factory built a declaration, so the loader can name it in one notice.
 * The property is non-enumerable, so it never reaches the normalized record or the published API.
 */
const markDeprecated = <T extends object>(declaration: T, api: string): T => {
  Object.defineProperty(declaration, DEPRECATED_API_KEY, { value: api, enumerable: false, configurable: true });
  return declaration;
};

/** Reads the deprecated factory name off a loaded declaration, if there is one. */
export const readDeprecatedApi = (declaration: unknown): string | undefined => {
  if (!declaration || typeof declaration !== 'object') return undefined;
  const api = (declaration as Record<string, unknown>)[DEPRECATED_API_KEY];
  return typeof api === 'string' ? api : undefined;
};

/**
 * @deprecated Use `defineCatalogItem` from `handoff-app/react`, passing the component as
 * `implementation`.
 */
export const defineReactComponent = <TProps>(
  _component: ReactComponentType<TProps>,
  config: ReactDeclarationConfig<TProps>
): GenericDeclarationConfig => {
  return markDeprecated(
    {
      ...config,
      renderer: 'react',
    },
    'defineReactComponent'
  );
};

/**
 * @deprecated Use `defineCatalogItem` from `handoff-app/handlebars`, passing the template path as
 * `implementation`.
 */
export const defineHandlebarsComponent = (config: HandlebarsDeclarationConfig): GenericDeclarationConfig => {
  return markDeprecated(
    {
      ...config,
      renderer: 'handlebars',
    },
    'defineHandlebarsComponent'
  );
};

/**
 * @deprecated Use `defineCatalogItem` from `handoff-app/react` with
 * `implementation: fromCSF('./Component.stories.tsx')`.
 */
export const defineCsfComponent = (config: CsfDeclarationConfig): GenericDeclarationConfig => {
  return markDeprecated(
    {
      ...config,
      renderer: 'csf',
    },
    'defineCsfComponent'
  );
};

/**
 * @deprecated Use `defineCatalogItem` from the entry point that matches the renderer.
 */
export const defineComponent = (config: GenericDeclarationConfig): GenericDeclarationConfig =>
  markDeprecated({ ...config }, 'defineComponent');

/**
 * @deprecated Use `defineCatalogItem` from `handoff-app` with a `composition` array.
 */
export const definePattern = (config: GenericPatternDeclarationConfig): GenericPatternDeclarationConfig =>
  markDeprecated({ ...config }, 'definePattern');
