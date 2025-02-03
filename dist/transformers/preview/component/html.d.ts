import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildPreviews: (id: string, location: string, data: TransformComponentTokensResult, handoff: Handoff) => Promise<TransformComponentTokensResult>;
export default buildPreviews;
