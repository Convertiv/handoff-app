import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakeComponentArgs extends SharedArgs {
    name: string;
}
declare const command: CommandModule<{}, MakeComponentArgs>;
export default command;
