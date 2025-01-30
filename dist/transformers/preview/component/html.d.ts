import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildPreviews: (data: TransformComponentTokensResult, id: string, custom: string, publicPath: string, handoff: Handoff) => Promise<TransformComponentTokensResult>;
export default buildPreviews;
