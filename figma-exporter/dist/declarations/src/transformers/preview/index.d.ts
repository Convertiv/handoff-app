import { DocumentationObject } from '../../types';
/**
 * Transforms the documentation object components into a preview and code
 */
export default function previewTransformer(documentationObject: DocumentationObject): Promise<{
    components: {
        buttons: {
            id: any;
            preview: string;
            code: string;
        }[];
        selects: {
            id: any;
            preview: string;
            code: string;
        }[];
        checkboxes: {
            id: any;
            preview: string;
            code: string;
        }[];
        inputs: {
            id: any;
            preview: string;
            code: string;
        }[];
        tooltips: {
            id: any;
            preview: string;
            code: string;
        }[];
        modal: {
            id: any;
            preview: string;
            code: string;
        }[];
        alerts: {
            id: any;
            preview: string;
            code: string;
        }[];
        switches: {
            id: any;
            preview: string;
            code: string;
        }[];
        pagination: {
            id: any;
            preview: string;
            code: string;
        }[];
        radios: {
            id: any;
            preview: string;
            code: string;
        }[];
    };
}>;
