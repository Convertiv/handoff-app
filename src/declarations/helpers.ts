import {
  CsfDeclarationConfig,
  GenericDeclarationConfig,
  HandlebarsDeclarationConfig,
  ReactComponentType,
  ReactDeclarationConfig,
} from './types';

export const defineReactComponent = <TProps>(
  _component: ReactComponentType<TProps>,
  config: ReactDeclarationConfig<TProps>
): GenericDeclarationConfig => {
  return {
    ...config,
    renderer: 'react',
  };
};

export const defineHandlebarsComponent = (config: HandlebarsDeclarationConfig): GenericDeclarationConfig => {
  return {
    ...config,
    renderer: 'handlebars',
  };
};

export const defineCsfComponent = (config: CsfDeclarationConfig): GenericDeclarationConfig => {
  return {
    ...config,
    renderer: 'csf',
  };
};

export const defineComponent = (config: GenericDeclarationConfig): GenericDeclarationConfig => config;
