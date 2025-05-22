import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildComponentCss: (data: TransformComponentTokensResult, handoff: Handoff, sharedStyles: string) => Promise<{
    id: string;
    source?: "figma" | "custom";
    type?: import("../types").ComponentType;
    image?: string;
    group?: string;
    categories?: string[];
    figma?: string;
    tags?: string[];
    should_do?: string[];
    should_not_do?: string[];
    code: string;
    html?: string;
    preview: string;
    js?: string;
    css?: string;
    sass?: string;
    sharedStyles?: string;
    title?: string;
    description?: string;
    previews?: {
        [key: string]: import("../types").OptionalPreviewRender;
    };
    properties?: {
        [key: string]: import("../component").SlotMetadata;
    };
    variant?: Record<string, string>;
    entries?: {
        js?: string;
        scss?: string;
        template?: string;
    };
    options?: {
        preview?: {
            groupBy?: string;
        };
    };
    validations?: Record<string, import("../../../types").ValidationResult>;
}>;
/**
 * Build the main CSS file using Vite
 */
export declare const buildMainCss: (handoff: Handoff) => Promise<void>;
export default buildComponentCss;
