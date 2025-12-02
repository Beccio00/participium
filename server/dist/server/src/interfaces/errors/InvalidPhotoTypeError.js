"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPhotoTypeError = void 0;
class InvalidPhotoTypeError extends Error {
    constructor(message = "Invalid photo type") {
        super(message);
        this.name = "InvalidPhotoTypeError";
    }
}
exports.InvalidPhotoTypeError = InvalidPhotoTypeError;
