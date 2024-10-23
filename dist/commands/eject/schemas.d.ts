import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface EjectSchemasArgs extends SharedArgs {
}
declare const command: CommandModule<{}, EjectSchemasArgs>;
export default command;
