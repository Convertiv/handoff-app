import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface EjectIntegrationArgs extends SharedArgs {
}
declare const command: CommandModule<{}, EjectIntegrationArgs>;
export default command;
