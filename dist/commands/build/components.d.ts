import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface BuildComponentsArgs extends SharedArgs {
    component?: string;
}
declare const command: CommandModule<{}, BuildComponentsArgs>;
export default command;
