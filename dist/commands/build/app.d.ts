import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface BuildAppArgs extends SharedArgs {
}
declare const command: CommandModule<{}, BuildAppArgs>;
export default command;
