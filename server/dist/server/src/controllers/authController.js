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
const utils_1 = require("../utils");
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.isAuthenticated && req.isAuthenticated()) {
            throw new utils_1.BadRequestError("Already logged in");
        }
        const user = yield (0, authService_1.authenticate)(req);
        req.logIn(user, (err) => {
            if (err)
                throw new utils_1.InternalServerError("Login failed");
            res.json({ message: "Login successful", user });
        });
    });
}
function logout(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(req.isAuthenticated && req.isAuthenticated()) || !req.session) {
            throw new utils_1.BadRequestError("Already logged out");
        }
        req.logout((err) => {
            if (err)
                throw new utils_1.InternalServerError("Logout failed");
            req.session.destroy((err) => {
                if (err)
                    throw new utils_1.InternalServerError("Logout failed");
                res.json({ message: "Logged out" });
            });
        });
    });
}
function getSessionInfo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = (0, authService_1.getSession)(req);
        if (!user) {
            res.json({ authenticated: false });
            return;
        }
        res.json({ authenticated: true, user });
    });
}
