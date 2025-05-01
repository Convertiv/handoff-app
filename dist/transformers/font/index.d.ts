import Handoff from '../../index';
import { DocumentationObject } from '../../types';
/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
export default function fontTransformer(handoff: Handoff, documentationObject: DocumentationObject): Promise<void>;
