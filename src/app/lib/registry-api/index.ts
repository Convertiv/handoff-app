/** Route facing registry API helpers. Internal validation and persistence stay in their own modules. */

export { ensureRegistryMode, handleRegistryRoute } from './handler';
export { sendRegistryError } from './errors';
