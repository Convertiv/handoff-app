import { Arguments } from 'yargs';
export interface SharedArgs extends Arguments {
    force?: boolean;
    debug?: boolean;
    integration?: string;
}
