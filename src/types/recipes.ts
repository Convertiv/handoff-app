import { Exportable } from "../types";

export type ComponentIntegrationRecipePart = {
  name: string,
  require: Exportable[],
};

export type ComponentIntegrationRecipe = {
  cssRootClass?: string;
  parts?: ComponentIntegrationRecipePart[];
  defaults?: {
    [key: string]: string;
  };
  replaceRules?: {
    [key: string]: { [key: string]: string };
  };
  tokenNameSegments?: string[];
  require?: {
    variantProps?: string[];
    variantValues?: {
      [key: string]: string[];
    };
  };
};

export type ComponentIntegrationCommon = Pick<ComponentIntegrationRecipe, "cssRootClass" | "parts">

export type ComponentIntegration = {
  name: string;
  common?: ComponentIntegrationCommon;
  recipes?: ComponentIntegrationRecipe[];
};

export type ComponentIntegrations = { components: ComponentIntegration[] };