import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface BuildIntegrationArgs extends SharedArgs {
}
declare const command: CommandModule<{}, BuildIntegrationArgs>;
export default command;
