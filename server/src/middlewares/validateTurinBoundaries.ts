import { Request, Response, NextFunction } from "express";
import { UnprocessableEntityError } from "../utils";
import { isPointInTurin } from "../../../shared/TurinBoundaries";

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

  if (!isPointInTurin(lat, lng)) {
    throw new UnprocessableEntityError("Coordinates are outside Turin municipality boundaries");
  }

  next();
}
