import { GradientObject, PositionObject } from "../types";
import { getAngle, getIntersection, rotateElipse } from "./math";

/**
 * Returns params (angle and stops) necessary for a linear gradient to be constructed. 
 * @param {GradientObject} gradient 
 * @returns {number[]}
 */
export function getLinearGradientParamsFromGradientObject(gradient: GradientObject): number[] {
  const gradientAngle = getAngle(gradient.handles[2], gradient.handles[0]);

  // this next section finds the linear gradient line segment -> https://stackoverflow.com/questions/51881307 creating-a-css-linear-gradient-based-on-two-points-relative-to-a-rectangle
  // calculating gradient line size (scalar) and change in x, y direction (coords)
  
  const lineChangeCoords = [(gradient.handles[1].x - gradient.handles[0].x), ((1 - gradient.handles[1].y) - (1 - gradient.handles[0].y))]
  const currentLineSize = Math.sqrt((lineChangeCoords[0] ** 2) + (lineChangeCoords[1] ** 2))

  // creating arbitrary gradient line 
  const desiredLength = 1;
  const scaleFactor = ((desiredLength - currentLineSize) / 2) / currentLineSize;

  const scaleCoords = {
      x: lineChangeCoords[0] * scaleFactor,
      y: lineChangeCoords[1] * scaleFactor,
  };

  const scaledArbGradientLine = [
      {x: gradient.handles[0].x - scaleCoords.x, y: gradient.handles[0].y + scaleCoords.y},
      {x: gradient.handles[1].x + scaleCoords.x, y: gradient.handles[1].y - scaleCoords.y}
  ]
  
  // getting relevant corners     
  const topCenter = gradientAngle > 90 && gradientAngle <= 180 || gradientAngle > 270 && gradientAngle <= 360 ?  {x: 0, y: 0} : {x: 1, y: 0};
  const bottomCenter = gradientAngle >= 0 && gradientAngle <= 90 || gradientAngle > 180 && gradientAngle <=270 ? {x: 0, y: 1} : {x: 1, y: 1};
  
  const topLine = [
      {x: topCenter.x - (desiredLength / 2), y: topCenter.y},
      {x: topCenter.x + (desiredLength / 2), y: topCenter.y}
  ]
  const rotatedTopLine = [
      rotateElipse(topCenter, topCenter.x - topLine[0].x, (topCenter.x - topLine[0].x), gradientAngle),
      rotateElipse(topCenter, topCenter.x - topLine[1].x, (topCenter.x - topLine[1].x), gradientAngle),
  ]
  const bottomLine = [
      {x: bottomCenter.x - (desiredLength / 2), y: bottomCenter.y},
      {x: bottomCenter.x + (desiredLength / 2), y: bottomCenter.y}
  ];
  const rotatedBottomLine = [
      rotateElipse(bottomCenter, bottomCenter.x - bottomLine[0].x, (bottomCenter.x - bottomLine[0].x), gradientAngle),
      rotateElipse(bottomCenter, bottomCenter.x - bottomLine[1].x, (bottomCenter.x - bottomLine[1].x), gradientAngle),
  ]

  // calculating relevant portion of gradient line (the actual gradient line -> taking POI of perpendicular lines w/ arbitrary gradient line)
  const topLineIntersection = getIntersection(rotatedTopLine[0], rotatedTopLine[1], scaledArbGradientLine[0], scaledArbGradientLine[1])
  const bottomLineIntersection = getIntersection(rotatedBottomLine[0], rotatedBottomLine[1], scaledArbGradientLine[0], scaledArbGradientLine[1])

  const gradientLineDistance = Math.sqrt(((bottomLineIntersection.y - topLineIntersection.y) ** 2) + ((bottomLineIntersection.x - topLineIntersection.x) ** 2))

  let params = [ gradientAngle ] as number[];

  gradient.stops.map((stop: any) => {
      let gradientStartPoint = { x: 0, y: 0 } as PositionObject

      if (gradient.handles[0].y < gradient.handles[1].y) {
          gradientStartPoint = topLineIntersection.y < bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection
      } else {
          gradientStartPoint = topLineIntersection.y > bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection 
      }
      
      const stopX = (stop.position * lineChangeCoords[0]) + gradient.handles[0].x;
      const stopY = gradient.handles[0].y - (stop.position * lineChangeCoords[1]);

      let colorDistance = Math.sqrt(((stopY - gradientStartPoint.y) ** 2) + ((stopX - gradientStartPoint.x) ** 2))

      let actualPercentage = colorDistance / gradientLineDistance;

      params.push(Number((Number(actualPercentage.toFixed(4)) * 100).toFixed(2)));
  })

  return params;
}

/**
 * Returns the values (shape and position) necessary for a radial gradient to be constructed. 
 * 
 * @param {PositionObject[]} handles 
 * @returns {number[]}
 */
export function getRadialGradientParamsFromGradientObject(gradient: GradientObject): number[] {
  return [
    Number((gradient.handles[1].x - gradient.handles[0].x).toFixed(4)) * 100,
    Number((gradient.handles[2].y - gradient.handles[0].y).toFixed(4)) * 100,
    Number(gradient.handles[0].x.toFixed(4)) * 100,
    Number(gradient.handles[0].y.toFixed(4)) * 100,
  ]
}