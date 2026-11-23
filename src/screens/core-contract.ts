import type { ComponentContract as CoreContract } from '../custom-previews/contract';
import type { ComponentContract } from './types';

/**
 * The core form of a contract. Contracts come from the docs app, so they still carry the docgen
 * fields that the public type leaves out. Internal: no public entry point exports it.
 */
export const toCoreContract = (contract: ComponentContract | undefined): CoreContract | undefined => contract as CoreContract | undefined;
