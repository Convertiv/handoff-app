import * as FigmaTypes from '../../figma/types';
import { ButtonComponents } from './component_sets/button';
import { SelectComponents } from './component_sets/select';
import { TooltipComponents } from './component_sets/tooltip';
import { InputComponents } from './component_sets/input';
import { AlertComponents } from './component_sets/alert';
import { CheckboxComponents } from './component_sets/checkbox';
import { SwitchComponents } from './component_sets/switch';
import { PaginationComponents } from './component_sets/pagination';
import { RadioComponents } from './component_sets/radio';
import { ModalComponents } from './component_sets/modal';
export interface DocumentComponentsObject {
    [key: string]: any;
    buttons: ButtonComponents;
    selects: SelectComponents;
    tooltips: TooltipComponents;
    modal: ModalComponents;
    inputs: InputComponents;
    alerts: AlertComponents;
    checkboxes: CheckboxComponents;
    radios: RadioComponents;
    switches: SwitchComponents;
    pagination: PaginationComponents;
}
export interface GetComponentSetComponentsResult {
    components: FigmaTypes.Component[];
    metadata: {
        [k: string]: FigmaTypes.ComponentMetadata;
    };
}
declare const getFileComponentTokens: (fileId: string, accessToken: string) => Promise<DocumentComponentsObject>;
export default getFileComponentTokens;
