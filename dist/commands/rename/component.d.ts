import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface RenameComponentArgs extends SharedArgs {
    source: string;
    destination: string;
}
declare const command: CommandModule<{}, RenameComponentArgs>;
export default command;
