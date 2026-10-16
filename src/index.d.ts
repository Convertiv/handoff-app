
import 'dotenv/config';
import { ResolvedConfig } from './types/config';

declare module 'handoff-app';

declare class Handoff {
    config: ResolvedConfig;
    modulePath: string;
    workingPath: string;
    force: boolean;
    debug: boolean;
}