import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
declare const buildComponentJs: (id: string, location: string, data: TransformComponentTokensResult, handoff: Handoff) => Promise<TransformComponentTokensResult>;
export default buildComponentJs;
