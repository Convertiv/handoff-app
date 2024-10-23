import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakeSnippetArgs extends SharedArgs {
    name: string;
}
declare const command: CommandModule<{}, MakeSnippetArgs>;
export default command;
