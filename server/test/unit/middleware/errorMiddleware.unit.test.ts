import { Request, Response, NextFunction } from "express";
import { errorHandler, asyncHandler } from "../../../src/middlewares/errorMiddleware";
import { AppError } from "../../../src/utils/errors";
import { BadRequestError, UnprocessableEntityError } from "../../../src/utils";

describe("errorMiddleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {};
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();

    // Mock console.error per evitare spam nei test
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("errorHandler", () => {
    describe("Story 5 (PT05) - Error handling for report creation", () => {
      it("should handle BadRequestError for missing fields", () => {
        const error = new BadRequestError("Missing required fields");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 400,
          error: "BadRequest",
          message: "Missing required fields",
        });
      });

      it("should handle UnprocessableEntityError for invalid coordinates", () => {
        const error = new UnprocessableEntityError("Coordinates are outside Turin municipality boundaries");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(422);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 422,
          error: "UnprocessableEntity",
          message: "Coordinates are outside Turin municipality boundaries",
        });
      });

      it("should handle AppError instances correctly", () => {
        class CustomAppError extends AppError {
          constructor(message: string) {
            super(message, 418); // I'm a teapot
          }
        }

        const error = new CustomAppError("Custom error for testing");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(418);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 418,
          error: "App", // Il nome viene dalla logica che rimuove "Error" dal nome del costruttore
          message: "Custom error for testing",
        });
      });

      it("should handle HttpError from express-openapi-validator", () => {
        // Creare un oggetto che fallisce instanceof HttpError ma ha le proprietà
        const error = new Error("Request validation failed");
        Object.assign(error, {
          name: "ValidationError",
          status: 400,
        });

        errorHandler(error as any, mockReq as Request, mockRes as Response, mockNext);

        // L'oggetto viene trattato come Error generico perché non è instanceof HttpError
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 500,
          error: "InternalServerError",
          message: "An unexpected error occurred",
        });
      });

      it("should handle generic Error with 500 status", () => {
        const error = new Error("Database connection failed");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 500,
          error: "InternalServerError",
          message: "An unexpected error occurred",
        });
      });

      it("should log errors in non-production environment", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";

        const consoleSpy = jest.spyOn(console, 'error');
        const error = new BadRequestError("Test error");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(consoleSpy).toHaveBeenCalledWith("[400] BadRequest: Test error");

        process.env.NODE_ENV = originalEnv;
      });

      it("should not log errors in production environment", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";

        const consoleSpy = jest.spyOn(console, 'error');
        const error = new BadRequestError("Test error");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(consoleSpy).not.toHaveBeenCalled();

        process.env.NODE_ENV = originalEnv;
      });

      it("should handle errors without stack trace", () => {
        const error = new BadRequestError("Error without stack");
        delete error.stack;

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          code: 400,
          error: "BadRequest",
          message: "Error without stack",
        });
      });
    });

    describe("Error response format validation", () => {
      it("should always include required fields in error response", () => {
        const error = new BadRequestError("Test error");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        const responseCall = jsonMock.mock.calls[0][0];
        expect(responseCall).toHaveProperty('code');
        expect(responseCall).toHaveProperty('error');
        expect(responseCall).toHaveProperty('message');
        expect(typeof responseCall.code).toBe('number');
        expect(typeof responseCall.error).toBe('string');
        expect(typeof responseCall.message).toBe('string');
      });

      it("should not include errors array when not provided", () => {
        const error = new BadRequestError("Test error");

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        const responseCall = jsonMock.mock.calls[0][0];
        expect(responseCall).not.toHaveProperty('errors');
      });
    });
  });

  describe("asyncHandler", () => {
    describe("Story 5 (PT05) - Async error handling for report operations", () => {
      it("should handle successful async operations", async () => {
        const successfulAsyncFn = jest.fn().mockResolvedValue("success");
        const wrappedFn = asyncHandler(successfulAsyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(successfulAsyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should catch async errors and pass them to next", async () => {
        const error = new BadRequestError("Async operation failed");
        const failingAsyncFn = jest.fn().mockRejectedValue(error);
        const wrappedFn = asyncHandler(failingAsyncFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(failingAsyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(error);
      });

      it("should handle database errors in report creation", async () => {
        const dbError = new Error("Database connection failed");
        const createReportFn = jest.fn().mockRejectedValue(dbError);
        const wrappedFn = asyncHandler(createReportFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });

      it("should handle validation errors from coordinates", async () => {
        const validationError = new UnprocessableEntityError("Invalid Turin coordinates");
        const validateCoordinatesFn = jest.fn().mockRejectedValue(validationError);
        const wrappedFn = asyncHandler(validateCoordinatesFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });

      it("should handle photo upload errors", async () => {
        const uploadError = new BadRequestError("Photo format not supported");
        const uploadPhotoFn = jest.fn().mockRejectedValue(uploadError);
        const wrappedFn = asyncHandler(uploadPhotoFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(uploadError);
      });

      it("should handle Promise rejection with custom AppError", async () => {
        class ReportCreationError extends AppError {
          constructor(message: string) {
            super(message, 422);
          }
        }

        const reportError = new ReportCreationError("Failed to create report");
        const createReportFn = jest.fn().mockRejectedValue(reportError);
        const wrappedFn = asyncHandler(createReportFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(reportError);
      });

      it("should preserve original function parameters", async () => {
        const originalFn = jest.fn().mockResolvedValue("result");
        const wrappedFn = asyncHandler(originalFn);

        const testReq = { body: { test: "data" } };
        const testRes = { send: jest.fn() };
        const testNext = jest.fn();

        await wrappedFn(testReq as any, testRes as any, testNext);

        expect(originalFn).toHaveBeenCalledWith(testReq, testRes, testNext);
      });

      it("should return a function", () => {
        const asyncFn = jest.fn().mockResolvedValue("test");
        const result = asyncHandler(asyncFn);

        expect(typeof result).toBe("function");
        expect(result.length).toBe(3); // req, res, next parameters
      });
    });

    describe("Edge cases and error handling", () => {
      it("should handle null/undefined rejections", async () => {
        const nullRejectionFn = jest.fn().mockRejectedValue(null);
        const wrappedFn = asyncHandler(nullRejectionFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(null);
      });

      it("should handle non-Error rejections", async () => {
        const stringRejectionFn = jest.fn().mockRejectedValue("String error");
        const wrappedFn = asyncHandler(stringRejectionFn);

        await wrappedFn(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith("String error");
      });
    });
  });
});