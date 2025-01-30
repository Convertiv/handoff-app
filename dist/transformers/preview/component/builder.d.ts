import Handoff from 'handoff/index';
import { ComponentType } from '../types';
/**
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
export declare function processComponent(handoff: Handoff, file: string, sharedStyles: string | null, version?: string): Promise<{
    id: string;
    type?: ComponentType;
    group?: string;
    tags?: string[];
    code: string;
    html?: string;
    preview: string;
    js?: string;
    css?: string;
    sass?: string;
    sharedStyles?: string;
    title?: string;
    description?: string;
    previews?: import("../types").OptionalPreviewRender[];
    properties?: {
        [key: string]: import("../component").SlotMetadata;
    };
}>;
export default processComponent;
