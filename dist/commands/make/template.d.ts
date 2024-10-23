import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
export interface MakeTemplateArgs extends SharedArgs {
    component: string;
    state?: string;
}
declare const command: CommandModule<{}, MakeTemplateArgs>;
export default command;
