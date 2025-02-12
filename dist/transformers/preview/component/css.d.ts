import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildComponentCss: (id: string, location: string, data: TransformComponentTokensResult, handoff: Handoff, sharedStyles: string) => Promise<{
    id: string;
    type?: import("../types").ComponentType;
    image?: string;
    group?: string;
    categories?: string[];
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
}>;
export default buildComponentCss;
