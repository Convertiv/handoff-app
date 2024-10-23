import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface EjectThemeArgs extends SharedArgs {
}
declare const command: CommandModule<{}, EjectThemeArgs>;
export default command;
