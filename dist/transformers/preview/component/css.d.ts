import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildComponentCss: (id: string, location: string, data: TransformComponentTokensResult, handoff: Handoff, sharedStyles: string) => Promise<{
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
    preview_options?: {
        group_by: boolean;
    };
    properties?: {
        [key: string]: import("../component").SlotMetadata;
    };
    variant?: Record<string, string>;
}>;
/**
 * Check to see if there's an entry point for the main JS file
 * build that javascript and write it to the output folder
 * @param handoff
 */
export declare const buildMainCss: (handoff: Handoff) => Promise<void>;
export default buildComponentCss;
