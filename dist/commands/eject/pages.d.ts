import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface EjectPagesArgs extends SharedArgs {
}
declare const command: CommandModule<{}, EjectPagesArgs>;
export default command;
