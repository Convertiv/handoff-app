"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRadialGradientParamsFromGradientObject = exports.getLinearGradientParamsFromGradientObject = exports.getGradientAngle = void 0;
const math_1 = require("./math");
/**
 * Returns the angle of the gradient
 *
 * @param {PositionObject[]} handles
 * @returns {number}
 */
function getGradientAngle(handles) {
    if (handles.length < 3) {
        throw new Error("Three handles are required to calculate the angle of the gradient");
    }
    let [pivotPoint, directionGuidePoint, angleGuidePoint] = [...handles];
    const refSlope = (directionGuidePoint.y - pivotPoint.y) / (directionGuidePoint.x - pivotPoint.x);
    const refAngle = Number(((Math.atan(refSlope) * 180) / Math.PI).toFixed(2));
    const normalizedDirectionGuidePoint = (0, math_1.rotate)(pivotPoint, directionGuidePoint, refAngle);
    const normalizedAngleGuidePoint = (0, math_1.rotate)(pivotPoint, angleGuidePoint, refAngle);
    if ((normalizedDirectionGuidePoint.x - pivotPoint.x > 0 && normalizedAngleGuidePoint.y - pivotPoint.y > 0) ||
        (normalizedDirectionGuidePoint.x - pivotPoint.x < 0 && normalizedAngleGuidePoint.y - pivotPoint.y < 0)) {
        // Since Figma allows the angle guide point to move to the either side
        // of the direction axis (defined by the pivot point and direction guide point) 
        // we will swap angle guide point and the pivot point to compensate for the fact
        // that the direction of the angle guide point is on the opposite side of the direction axis
        pivotPoint = handles[2];
        angleGuidePoint = handles[0];
    }
    const slope = (angleGuidePoint.y - pivotPoint.y) / (angleGuidePoint.x - pivotPoint.x);
    const radians = Math.atan(slope);
    let degrees = ((radians * 180) / Math.PI);
    if (pivotPoint.x < angleGuidePoint.x) {
        degrees = degrees + 180;
    }
    else if (pivotPoint.x > angleGuidePoint.x) {
        if (pivotPoint.y < angleGuidePoint.y) {
            degrees = 360 - Math.abs(degrees);
        }
    }
    else if (pivotPoint.x === angleGuidePoint.x) {
        // horizontal line
        if (pivotPoint.y < angleGuidePoint.y) {
            degrees = 360 - Math.abs(degrees); // on negative y-axis
        }
        else {
            degrees = Math.abs(degrees); // on positive y-axis
        }
    }
    return Number(degrees.toFixed(2));
}
exports.getGradientAngle = getGradientAngle;
/**
 * Returns params (angle and stops) necessary for a linear gradient to be constructed.
 * @param {GradientObject} gradient
 * @returns {number[]}
 */
function getLinearGradientParamsFromGradientObject(gradient) {
    const gradientAngle = getGradientAngle(gradient.handles);
    // this next section finds the linear gradient line segment -> https://stackoverflow.com/questions/51881307 creating-a-css-linear-gradient-based-on-two-points-relative-to-a-rectangle
    // calculating gradient line size (scalar) and change in x, y direction (coords)
    const lineChangeCoords = [(gradient.handles[1].x - gradient.handles[0].x), ((1 - gradient.handles[1].y) - (1 - gradient.handles[0].y))];
    const currentLineSize = Math.sqrt((Math.pow(lineChangeCoords[0], 2)) + (Math.pow(lineChangeCoords[1], 2)));
    // creating arbitrary gradient line 
    const desiredLength = 1;
    const scaleFactor = ((desiredLength - currentLineSize) / 2) / currentLineSize;
    const scaleCoords = {
        x: lineChangeCoords[0] * scaleFactor,
        y: lineChangeCoords[1] * scaleFactor,
    };
    const scaledArbGradientLine = [
        { x: gradient.handles[0].x - scaleCoords.x, y: gradient.handles[0].y + scaleCoords.y },
        { x: gradient.handles[1].x + scaleCoords.x, y: gradient.handles[1].y - scaleCoords.y }
    ];
    // getting relevant corners     
    const topCenter = gradientAngle > 90 && gradientAngle <= 180 || gradientAngle > 270 && gradientAngle <= 360 ? { x: 0, y: 0 } : { x: 1, y: 0 };
    const bottomCenter = gradientAngle >= 0 && gradientAngle <= 90 || gradientAngle > 180 && gradientAngle <= 270 ? { x: 0, y: 1 } : { x: 1, y: 1 };
    const topLine = [
        { x: topCenter.x - (desiredLength / 2), y: topCenter.y },
        { x: topCenter.x + (desiredLength / 2), y: topCenter.y }
    ];
    const rotatedTopLine = [
        (0, math_1.rotateElipse)(topCenter, topCenter.x - topLine[0].x, (topCenter.x - topLine[0].x), gradientAngle),
        (0, math_1.rotateElipse)(topCenter, topCenter.x - topLine[1].x, (topCenter.x - topLine[1].x), gradientAngle),
    ];
    const bottomLine = [
        { x: bottomCenter.x - (desiredLength / 2), y: bottomCenter.y },
        { x: bottomCenter.x + (desiredLength / 2), y: bottomCenter.y }
    ];
    const rotatedBottomLine = [
        (0, math_1.rotateElipse)(bottomCenter, bottomCenter.x - bottomLine[0].x, (bottomCenter.x - bottomLine[0].x), gradientAngle),
        (0, math_1.rotateElipse)(bottomCenter, bottomCenter.x - bottomLine[1].x, (bottomCenter.x - bottomLine[1].x), gradientAngle),
    ];
    // calculating relevant portion of gradient line (the actual gradient line -> taking POI of perpendicular lines w/ arbitrary gradient line)
    const topLineIntersection = (0, math_1.getIntersection)(rotatedTopLine[0], rotatedTopLine[1], scaledArbGradientLine[0], scaledArbGradientLine[1]);
    const bottomLineIntersection = (0, math_1.getIntersection)(rotatedBottomLine[0], rotatedBottomLine[1], scaledArbGradientLine[0], scaledArbGradientLine[1]);
    const gradientLineDistance = Math.sqrt((Math.pow((bottomLineIntersection.y - topLineIntersection.y), 2)) + (Math.pow((bottomLineIntersection.x - topLineIntersection.x), 2)));
    let params = [gradientAngle];
    gradient.stops.map((stop) => {
        let gradientStartPoint = { x: 0, y: 0 };
        if (gradient.handles[0].y < gradient.handles[1].y) {
            gradientStartPoint = topLineIntersection.y < bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection;
        }
        else {
            gradientStartPoint = topLineIntersection.y > bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection;
        }
        const stopX = (stop.position * lineChangeCoords[0]) + gradient.handles[0].x;
        const stopY = gradient.handles[0].y - (stop.position * lineChangeCoords[1]);
        let colorDistance = Math.sqrt((Math.pow((stopY - gradientStartPoint.y), 2)) + (Math.pow((stopX - gradientStartPoint.x), 2)));
        let actualPercentage = colorDistance / gradientLineDistance;
        params.push(Number((Number(actualPercentage.toFixed(4)) * 100).toFixed(2)));
    });
    return params;
}
exports.getLinearGradientParamsFromGradientObject = getLinearGradientParamsFromGradientObject;
/**
 * Returns the values (shape and position) necessary for a radial gradient to be constructed.
 *
 * @param {PositionObject[]} handles
 * @returns {number[]}
 */
function getRadialGradientParamsFromGradientObject(gradient) {
    return [
        Math.abs(Number((gradient.handles[1].x - gradient.handles[0].x).toFixed(4))) * 100,
        Math.abs(Number((gradient.handles[2].y - gradient.handles[0].y).toFixed(4))) * 100,
        Number(gradient.handles[0].x.toFixed(4)) * 100,
        Number(gradient.handles[0].y.toFixed(4)) * 100,
    ];
}
exports.getRadialGradientParamsFromGradientObject = getRadialGradientParamsFromGradientObject;
