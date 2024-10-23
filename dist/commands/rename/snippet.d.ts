import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface RenameSnippetArgs extends SharedArgs {
    source: string;
    destination: string;
}
declare const command: CommandModule<{}, RenameSnippetArgs>;
export default command;
