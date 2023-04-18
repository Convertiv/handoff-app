import { PositionObject } from "../types";
/**
 * Returns a position object where 2 lines (represented by 4 position objects) intersect.
 * Throws a error if the lines do not intersect.
 *
 * @param {PositionObject} p1
 * @param {PositionObject} p2
 * @param {PositionObject} p3
 * @param {PositionObject} p4
 * @returns {PositionObject}
 */
export declare function getIntersection(p1: PositionObject, p2: PositionObject, p3: PositionObject, p4: PositionObject): PositionObject;
/**
 * Returns the handle position object when rotated around the pivot point (position object) by the given angle (in degrees).
 *
 * @param {PositionObject} pivot
 * @param {PositionObject} handle
 * @param {number} angle
 * @returns
 */
export declare function rotate(pivot: PositionObject, handle: PositionObject, angle: number): PositionObject;
/**
 * Returns a resulting position object of a elipse rotation around a pivot position object with the given angle and radius (x, y).
 *
 * @param {PositionObject} pivot
 * @param {number} xRadius
 * @param {number} yRadius
 * @param {number} angle
 * @returns
 */
export declare function rotateElipse(pivot: PositionObject, xRadius: number, yRadius: number, angle: number): PositionObject;
