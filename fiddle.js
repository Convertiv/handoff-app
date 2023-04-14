interface PositionObject {
  x: number;
  y: number;
}

interface Paint {
  gradientHandlePositions: PositionObject[],
  gradientStops: {
      color: any;
      position: number;
  }[]
}

function getIntersection(p1: PositionObject, p2: PositionObject, p3: PositionObject, p4: PositionObject) {
  // usage: https://dirask.com/posts/JavaScript-how-to-calculate-intersection-point-of-two-lines-for-given-4-points-VjvnAj

  // down part of intersection point formula
  var d1 = (p1.x - p2.x) * (p3.y - p4.y); // (x1 - x2) * (y3 - y4)
  var d2 = (p1.y - p2.y) * (p3.x - p4.x); // (y1 - y2) * (x3 - x4)
  var d  = (d1) - (d2);

  if(d == 0) {
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
  
  var p = { x: px, y: py };

  return p;
}

function getAngle(first: PositionObject, second: PositionObject): number {
  first = {x: Number(first.x.toFixed(4)), y: Number(first.y.toFixed(4))}
  second = {x: Number(second.x.toFixed(4)), y: Number(second.y.toFixed(4))}

  const slope = (second.y - first.y) / (second.x - first.x);
  const radians = Math.atan(slope);
  let degrees = Number(((radians * 180) / Math.PI).toFixed(2));

  if (first.x < second.x) {
      degrees = degrees + 180;
  } else if (first.x > second.x) {
      if (first.y < second.y) {
          degrees = 360 - Math.abs(degrees);
      }
  } else if (first.x === second.x) {
      // horizontal line
      if (first.y < second.y) {
          degrees = 360 - Math.abs(degrees); // on negative y-axis
      } else {
          degrees = Math.abs(degrees); // on positive y-axis
      }
  }
  
  return degrees;
}

function rotateElipse(center: PositionObject, xRadius: number, yRadius: number, angle: number): PositionObject{
  'https://www.desmos.com/calculator/aqlhivzbvs' // -> rotated elipse equations
  'https://www.mathopenref.com/coordparamellipse.html' // -> good explanation about elipse parametric equations
  'https://math.stackexchange.com/questions/941490/whats-the-parametric-equation-for-the-general-form-of-an-ellipse-rotated-by-any?noredirect=1&lq=1&newreg=fd8890e3dad245b0b6a0f182ba22f7f3' // -> good explanation of rotated parametric elipse equations
  // rotates points[x, y] some degrees about an origin [cx, cy]
  xRadius = xRadius * 1.5
  yRadius = yRadius * 1.5

  const cosAngle = Math.cos((Math.PI / 180) * (angle+180));
  const sinAngle = Math.sin((Math.PI / 180) * (angle+180));

  return {
      x: (-xRadius * cosAngle) + center.x,
      y: (-yRadius * sinAngle) + center.y,
  }
}

function getLinearGradientParamsFromFill(fill: Paint) {
  const handles = fill.gradientHandlePositions;
  const stops = fill.gradientStops;
  const gradientAngle = getAngle(handles[0], handles[2]);

  // this next section finds the linear gradient line segment -> https://stackoverflow.com/questions/51881307 creating-a-css-linear-gradient-based-on-two-points-relative-to-a-rectangle
  // calculating gradient line size (scalar) and change in x, y direction (coords)
  
  const lineChangeCoords = [(handles[1].x - handles[0].x), ((1 - handles[1].y) - (1 - handles[0].y))]
  const currentLineSize = Math.sqrt((lineChangeCoords[0] ** 2) + (lineChangeCoords[1] ** 2))

  // creating arbitrary gradient line 
  const desiredLength = 1;
  const scaleFactor = ((desiredLength - currentLineSize) / 2) / currentLineSize;

  const scaleCoords = {
      x: lineChangeCoords[0] * scaleFactor,
      y: lineChangeCoords[1] * scaleFactor,
  };

  const scaledArbGradientLine = [
      {x: handles[0].x - scaleCoords.x, y: handles[0].y + scaleCoords.y},
      {x: handles[1].x + scaleCoords.x, y: handles[1].y - scaleCoords.y}
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

  stops.map((stop: any) => {
      let gradientStartPoint = { x: 0, y: 0 } as PositionObject

      if (handles[0].y < handles[1].y) {
          gradientStartPoint = topLineIntersection.y < bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection
      } else {
          gradientStartPoint = topLineIntersection.y > bottomLineIntersection.y ? topLineIntersection : bottomLineIntersection 
      }
      
      const stopX = (stop.position * lineChangeCoords[0]) + handles[0].x;
      const stopY = handles[0].y - (stop.position * lineChangeCoords[1]);

      let colorDistance = Math.sqrt(((stopY - gradientStartPoint.y) ** 2) + ((stopX - gradientStartPoint.x) ** 2))

      let actualPercentage = colorDistance / gradientLineDistance;

      params.push(Number((Number(actualPercentage.toFixed(4)) * 100).toFixed(2)));
  })

  return params;
}

console.log(getLinearGradientParamsFromFill({
 gradientHandlePositions: [
  { x: 0.2950000138449145, y: 0.21000000636758231 },
  { x: 0.38000000168580156, y: 0.2850000042167815 },
  { x: 0.37613192520054606, y: 0.11805052141350775 }
],
gradientStops: [
  { color: [Object], position: 0 },
  { color: [Object], position: 1 }
]
}));