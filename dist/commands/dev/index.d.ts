import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface DevArgs extends SharedArgs {
}
declare const command: CommandModule<{}, DevArgs>;
export default command;
