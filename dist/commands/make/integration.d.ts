import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakeIntegrationArgs extends SharedArgs {
}
declare const command: CommandModule<{}, MakeIntegrationArgs>;
export default command;
