import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakeIntegrationStylesArgs extends SharedArgs {
}
declare const command: CommandModule<{}, MakeIntegrationStylesArgs>;
export default command;
