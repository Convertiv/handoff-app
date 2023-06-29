import { GradientObject, PositionObject } from "../types";
/**
 * Returns the angle of the gradient
 *
 * @param {PositionObject[]} handles
 * @returns {number}
 */
export declare function getGradientAngle(handles: PositionObject[]): number;
/**
 * Returns params (angle and stops) necessary for a linear gradient to be constructed.
 * @param {GradientObject} gradient
 * @returns {number[]}
 */
export declare function getLinearGradientParamsFromGradientObject(gradient: GradientObject): number[];
/**
 * Returns the values (shape and position) necessary for a radial gradient to be constructed.
 *
 * @param {PositionObject[]} handles
 * @returns {number[]}
 */
export declare function getRadialGradientParamsFromGradientObject(gradient: GradientObject): number[];
