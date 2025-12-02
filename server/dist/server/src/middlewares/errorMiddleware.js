"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const errors_1 = require("../utils/errors");
const types_1 = require("express-openapi-validator/dist/framework/types");
function errorHandler(err, req, res, next) {
    let statusCode = 500;
    let errorName = "InternalServerError";
    let message = "An unexpected error occurred";
    let errors;
    if (err instanceof types_1.HttpError) {
        statusCode = err.status;
        errorName = err.name;
        message = err.message;
    }
    else if (err instanceof errors_1.AppError) {
        statusCode = err.statusCode;
        errorName = err.constructor.name.replace("Error", "");
        message = err.message;
    }
    // Logga sempre l'errore, anche in produzione
    console.error(`[${statusCode}] ${errorName}: ${message}`);
    if (err.stack)
        console.error(err.stack);
    const response = {
        code: statusCode,
        error: errorName,
        message: message,
    };
    if (errors && errors.length > 0) {
        response.errors = errors;
    }
    res.status(statusCode).json(response);
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
