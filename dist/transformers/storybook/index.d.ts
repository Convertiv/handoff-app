import Handoff from 'handoff/index.js';
import { DocumentationObject } from 'handoff/types.js';
export declare const buildStorybookPreview: (handoff: Handoff) => Promise<void>;
declare const storybookPreviewTransformer: (handoff: Handoff, documentation: DocumentationObject) => Promise<void>;
export default storybookPreviewTransformer;
