import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface BuildRecipeArgs extends SharedArgs {
}
declare const command: CommandModule<{}, BuildRecipeArgs>;
export default command;
