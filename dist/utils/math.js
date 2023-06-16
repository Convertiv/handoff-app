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
export function getIntersection(p1, p2, p3, p4) {
    // usage: https://dirask.com/posts/JavaScript-how-to-calculate-intersection-point-of-two-lines-for-given-4-points-VjvnAj
    // down part of intersection point formula
    var d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
    var d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
    var d = (d1) - (d2);
    if (d === 0) {
        throw new Error('Number of intersection points is zero or infinity.');
    }
    // upper part of intersection point formula
    var u1 = (p1.x * p2.y - p1.y * p2.x); // (x1 * y2 - y1 * x2)
    var u4 = (p3.x * p4.y - p3.y * p4.x); // (x3 * y4 - y3 * x4)
    var u2x = p3.x - p4.x; // (x3 - x4)
    var u3x = p1.x - p2.x; // (x1 - x2)
    var u2y = p3.y - p4.y; // (y3 - y4)
    var u3y = p1.y - p2.y; // (y1 - y2)
    // intersection point formula
    var px = (u1 * u2x - u3x * u4) / d;
    var py = (u1 * u2y - u3y * u4) / d;
    return {
        x: px,
        y: py
    };
}
/**
 * Returns the handle position object when rotated around the pivot point (position object) by the given angle (in degrees).
 *
 * @param {PositionObject} pivot
 * @param {PositionObject} handle
 * @param {number} angle
 * @returns
 */
export function rotate(pivot, handle, angle) {
    var radians = (Math.PI / 180) * angle;
    var cos = Math.cos(radians);
    var sin = Math.sin(radians);
    return {
        x: (cos * (handle.x - pivot.x)) + (sin * (handle.y - pivot.y)) + pivot.x,
        y: (cos * (handle.y - pivot.y)) - (sin * (handle.x - pivot.x)) + pivot.y
    };
}
/**
 * Returns a resulting position object of a elipse rotation around a pivot position object with the given angle and radius (x, y).
 *
 * @param {PositionObject} pivot
 * @param {number} xRadius
 * @param {number} yRadius
 * @param {number} angle
 * @returns
 */
export function rotateElipse(pivot, xRadius, yRadius, angle) {
    'https://www.desmos.com/calculator/aqlhivzbvs'; // -> rotated elipse equations
    'https://www.mathopenref.com/coordparamellipse.html'; // -> good explanation about elipse parametric equations
    'https://math.stackexchange.com/questions/941490/whats-the-parametric-equation-for-the-general-form-of-an-ellipse-rotated-by-any?noredirect=1&lq=1&newreg=fd8890e3dad245b0b6a0f182ba22f7f3'; // -> good explanation of rotated parametric elipse equations
    // rotates points[x, y] some degrees about an origin [cx, cy]
    xRadius = xRadius * 1.5;
    yRadius = yRadius * 1.5;
    var cosAngle = Math.cos((Math.PI / 180) * (angle + 180));
    var sinAngle = Math.sin((Math.PI / 180) * (angle + 180));
    return {
        x: (-xRadius * cosAngle) + pivot.x,
        y: (-yRadius * sinAngle) + pivot.y,
    };
}
