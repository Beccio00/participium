"use strict";
// errore 401 per credenziali non valide
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCredentialsError = void 0;
class InvalidCredentialsError extends Error {
    constructor(message = "Invalid username or password") {
        super(message);
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
exports.default = InvalidCredentialsError;
