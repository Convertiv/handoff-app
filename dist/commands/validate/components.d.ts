import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface ValidateComponentsArgs extends SharedArgs {
}
declare const command: CommandModule<{}, ValidateComponentsArgs>;
export default command;
