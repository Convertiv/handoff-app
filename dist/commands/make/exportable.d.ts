import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakeExportableArgs extends SharedArgs {
    type: string;
    name: string;
}
declare const command: CommandModule<{}, MakeExportableArgs>;
export default command;
