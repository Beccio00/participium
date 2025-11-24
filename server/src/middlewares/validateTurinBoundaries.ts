import { Request, Response, NextFunction } from "express";
import { UnprocessableEntityError } from "../utils";

//TODO: update this polygon with accurate turin boundaries coordinates
const TURIN_POLYGON: [number, number][] = [
  [7.5809, 45.1241],
  [7.5862, 45.0923],
  [7.5995, 45.0665],
  [7.6234, 45.0371],
  [7.6542, 45.0198],
  [7.6891, 45.0087],
  [7.7234, 45.0165],
  [7.7498, 45.0342],
  [7.7687, 45.0587],
  [7.7812, 45.0876],
  [7.7854, 45.1154],
  [7.7765, 45.1398],
  [7.7543, 45.1587],
  [7.7234, 45.1698],
  [7.6854, 45.1754],
  [7.6487, 45.1721],
  [7.6154, 45.1598],
  [7.5912, 45.1432],
  [7.5809, 45.1241]
];

function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  return inside;
}

export function validateTurinBoundaries(req: Request, res: Response, next: NextFunction) {
  const { latitude, longitude } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    return next();
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return next();
  }

  if (!isPointInPolygon(lat, lng, TURIN_POLYGON)) {
    throw new UnprocessableEntityError("Coordinates are outside Turin municipality boundaries");
  }

  next();
}
