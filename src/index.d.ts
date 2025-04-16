
import 'dotenv/config';
import { Config } from './types/config';

declare module 'handoff-app';

declare class Handoff {
    config: Config;
    modulePath: string;
    workingPath: string;
    force: boolean;
    debug: boolean;
}