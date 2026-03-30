import type React from 'react';
import type { ComponentObject } from '../transformers/preview/types';

export type RendererKind = 'react' | 'handlebars' | 'csf';

export type DeclarationPreview<TArgs = Record<string, any>> = {
  title: string;
  args?: TArgs;
  values?: TArgs;
  url?: string;
  usage?: string;
};

type BaseDeclarationEntries = NonNullable<ComponentObject['entries']> & {
  component?: string;
  story?: string;
  templates?: string;
};

type OptionalComponentMetadata = Partial<Omit<ComponentObject, 'previews' | 'entries' | 'title' | 'should_do' | 'should_not_do'>>;

export type BaseDeclarationConfig = OptionalComponentMetadata & {
  id?: string;
  name: string;
  renderer?: RendererKind;
  entries?: BaseDeclarationEntries;
  previews: Record<string, DeclarationPreview>;
  shouldDo?: string[];
  shouldNotDo?: string[];
};

export type ReactDeclarationConfig<TProps> = Omit<BaseDeclarationConfig, 'renderer' | 'entries' | 'previews'> & {
  entries: BaseDeclarationEntries & { component: string };
  previews: Record<string, DeclarationPreview<Partial<TProps>>>;
};

export type HandlebarsDeclarationConfig = Omit<BaseDeclarationConfig, 'renderer' | 'entries'> & {
  entries: BaseDeclarationEntries & { template: string };
};

export type CsfDeclarationConfig = Omit<BaseDeclarationConfig, 'renderer' | 'entries'> & {
  entries: BaseDeclarationEntries & { story: string };
};

export type GenericDeclarationConfig = Omit<BaseDeclarationConfig, 'renderer'> & {
  renderer: RendererKind;
};

export type ReactComponentType<TProps = any> = React.ComponentType<TProps>;
