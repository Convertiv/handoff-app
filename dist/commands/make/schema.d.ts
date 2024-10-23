import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakeSchemaArgs extends SharedArgs {
    type: string;
    name: string;
}
declare const command: CommandModule<{}, MakeSchemaArgs>;
export default command;
