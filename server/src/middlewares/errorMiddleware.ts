import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let errorName = "InternalServerError";
  let message = "An unexpected error occurred";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorName = err.constructor.name.replace("Error", "");
    message = err.message;
  } else {
    console.error("Unexpected error:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${statusCode}] ${errorName}: ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    code: statusCode,
    error: errorName,
    message: message,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
