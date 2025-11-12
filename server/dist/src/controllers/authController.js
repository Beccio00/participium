"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.getSessionInfo = getSessionInfo;
const authService_1 = require("../services/authService");
const InvalidCredentialsError_1 = require("../interfaces/errors/InvalidCredentialsError");
function login(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return res.status(400).json({
                error: 'BadRequest',
                message: 'Already logged in'
            });
        }
        try {
            const user = yield (0, authService_1.authenticate)(req);
            req.logIn(user, (err) => {
                if (err)
                    return next(err);
                return res.json({ message: "Login successful", user });
            });
        }
        catch (err) {
            if (err instanceof InvalidCredentialsError_1.InvalidCredentialsError) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Invalid username or password"
                });
            }
            else {
                return res.status(500).json({
                    error: "InternalServerError",
                    message: "An unexpected error occurred"
                });
            }
        }
    });
}
function logout(req, res) {
    if (!(req.isAuthenticated && req.isAuthenticated()) || !req.session) {
        return res.status(400).json({
            error: 'BadRequest',
            message: 'Already logged out'
        });
    }
    try {
        req.logout((err) => {
            if (err)
                throw err;
            req.session.destroy((err) => {
                if (err)
                    throw err;
                return res.json({ message: 'Logged out' });
            });
        });
    }
    catch (e) {
        return res.status(500).json({
            error: 'InternalServerError',
            message: 'Logout failed'
        });
    }
}
function getSessionInfo(req, res) {
    const user = (0, authService_1.getSession)(req);
    if (!user)
        return res.json({ authenticated: false });
    return res.json({ authenticated: true, user });
}
