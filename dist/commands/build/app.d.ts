import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface BuildAppArgs extends SharedArgs {
    skipComponents?: boolean;
}
declare const command: CommandModule<{}, BuildAppArgs>;
export default command;
