import { DocumentationObject } from '../../types';
interface CssTransformerOutput {
    components: Record<keyof DocumentationObject['components'], string>;
    design: Record<'colors' | 'typography' | 'effects', string>;
}
export default function cssTransformer(documentationObject: DocumentationObject): CssTransformerOutput;
export {};
