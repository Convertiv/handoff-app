import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface EjectExportablesArgs extends SharedArgs {
}
declare const command: CommandModule<{}, EjectExportablesArgs>;
export default command;
