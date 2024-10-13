import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface StartArgs extends SharedArgs {
}
declare const command: CommandModule<{}, StartArgs>;
export default command;
