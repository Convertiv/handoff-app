import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface FetchArgs extends SharedArgs {
}
declare const command: CommandModule<{}, FetchArgs>;
export default command;
