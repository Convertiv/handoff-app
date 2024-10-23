import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface EjectConfigArgs extends SharedArgs {
}
declare const command: CommandModule<{}, EjectConfigArgs>;
export default command;
