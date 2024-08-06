import { Exportable } from "../types";
export declare type ComponentIntegrationRecipePart = {
    name: string;
    require: Exportable[];
};
export declare type ComponentIntegrationRecipe = {
    cssRootClass?: string;
    parts?: ComponentIntegrationRecipePart[] | string[];
    defaults?: {
        [key: string]: string;
    };
    replaceRules?: {
        [key: string]: {
            [key: string]: string;
        };
    };
    tokenNameSegments?: string[];
    require?: {
        variantProps?: string[];
        variantValues?: {
            [key: string]: string[];
        };
    };
};
export declare type ComponentIntegrationCommon = Pick<ComponentIntegrationRecipe, "cssRootClass" | "parts">;
export declare type ComponentIntegration = {
    name: string;
    common?: ComponentIntegrationCommon;
    recipes?: ComponentIntegrationRecipe[];
};
export declare type ComponentIntegrations = {
    components: ComponentIntegration[];
};
