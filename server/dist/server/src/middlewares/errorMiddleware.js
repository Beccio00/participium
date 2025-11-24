"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const errors_1 = require("../utils/errors");
function errorHandler(err, req, res, next) {
    let statusCode = 500;
    let errorName = "InternalServerError";
    let message = "An unexpected error occurred";
    if (err instanceof errors_1.AppError) {
        statusCode = err.statusCode;
        errorName = err.constructor.name.replace("Error", "");
        message = err.message;
    }
    else {
        console.error("Unexpected error:", err);
    }
    if (process.env.NODE_ENV !== "production") {
        console.error(`[${statusCode}] ${errorName}: ${message}`);
        if (err.stack)
            console.error(err.stack);
    }
    res.status(statusCode).json({
        code: statusCode,
        error: errorName,
        message: message,
    });
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
