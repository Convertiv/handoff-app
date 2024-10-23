import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakePageArgs extends SharedArgs {
    name: string;
    parent?: string;
}
declare const command: CommandModule<{}, MakePageArgs>;
export default command;
