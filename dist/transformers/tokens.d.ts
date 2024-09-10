import { TokenDict } from './types';
import { TokenSet } from '../exporters/components/types';
import { Exportable } from '../types';
export declare const getTokenSetTokens: (tokenSet: TokenSet) => TokenDict | undefined;
export declare const getTokenSetNameByProperty: (cssProp: string) => Exportable | undefined;
