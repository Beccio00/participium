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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.getSession = getSession;
const passport_1 = __importDefault(require("passport"));
const InvalidCredentialsError_1 = require("../interfaces/errors/InvalidCredentialsError");
function authenticate(req) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            passport_1.default.authenticate("local", (err, user) => {
                if (err)
                    return reject(err);
                if (!user)
                    return reject(new InvalidCredentialsError_1.InvalidCredentialsError());
                resolve(user);
            })(req);
        });
    });
}
function getSession(req) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return req.user;
    }
    return null;
}
