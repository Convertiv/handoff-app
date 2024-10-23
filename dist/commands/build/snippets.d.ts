import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface BuildSnippetsArgs extends SharedArgs {
    snippet?: string;
}
declare const command: CommandModule<{}, BuildSnippetsArgs>;
export default command;
