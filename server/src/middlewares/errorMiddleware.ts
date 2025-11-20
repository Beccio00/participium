import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { HttpError } from "express-openapi-validator/dist/framework/types";

export function errorHandler(
  err: Error | AppError | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let errorName = "InternalServerError";
  let message = "An unexpected error occurred";
  let errors: any[] | undefined;

  if (err instanceof HttpError) {
    statusCode = err.status;
    errorName = err.name;
    message = err.message;
  } 
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorName = err.constructor.name.replace("Error", "");
    message = err.message;
  } 

  if (process.env.NODE_ENV !== "production") {
    console.error(`[${statusCode}] ${errorName}: ${message}`);
    if (err.stack) console.error(err.stack);
  }

  const response: any = {
    code: statusCode,
    error: errorName,
    message: message,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}