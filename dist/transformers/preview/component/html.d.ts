import { FileComponentsObject } from '../../../exporters/components/types';
import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildPreviews: (id: string, location: string, data: TransformComponentTokensResult, handoff: Handoff, components?: FileComponentsObject) => Promise<TransformComponentTokensResult>;
export default buildPreviews;
