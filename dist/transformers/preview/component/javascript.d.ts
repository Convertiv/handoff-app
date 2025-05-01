import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
/**
 * Builds the JavaScript file for a single component if it exists.
 * Reads the component JavaScript file, bundles it using the buildJsBundle utility,
 * and adds both the original and compiled JavaScript to the transform result.
 *
 * @param data - The component transformation result containing the component data
 * @param handoff - The Handoff configuration object
 * @returns The updated component transformation result with JavaScript data
 */
export declare const buildComponentJs: (data: TransformComponentTokensResult, handoff: Handoff) => Promise<TransformComponentTokensResult>;
/**
 * Builds the main JavaScript bundle for the component preview.
 *
 * This function checks if there's a main JavaScript bundle defined in the integration,
 * and if the file exists, it builds the bundle and outputs it to the component's output path.
 *
 * @param handoff - The Handoff configuration object containing integration settings
 * @returns A Promise that resolves when the build process is complete
 * @throws May throw an error if the build process fails
 */
export declare const buildMainJS: (handoff: Handoff) => Promise<void>;
export default buildComponentJs;
