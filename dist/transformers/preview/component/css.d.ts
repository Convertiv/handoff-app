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
    previewOptions?: {
        group_by: boolean;
    };
    properties?: {
        [key: string]: import("../component").SlotMetadata;
    };
    variant?: Record<string, string>;
}>;
export default buildComponentCss;
