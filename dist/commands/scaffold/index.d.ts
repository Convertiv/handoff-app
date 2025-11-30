import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface ScaffoldArgs extends SharedArgs {
}
declare const command: CommandModule<{}, ScaffoldArgs>;
export default command;
