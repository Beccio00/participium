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
exports.configurePassport = configurePassport;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const UserDTO_1 = require("../interfaces/UserDTO");
const passwordService_1 = require("../services/passwordService");
const userService_1 = require("../services/userService");
function configurePassport() {
    passport_1.default.use(new passport_local_1.Strategy({ usernameField: "email" }, (email, password, done) => __awaiter(this, void 0, void 0, function* () {
        try {
            const dbUser = yield (0, userService_1.findByEmail)(email);
            if (!dbUser)
                return done(null, false);
            const valid = yield (0, passwordService_1.verifyPassword)(dbUser, password);
            if (!valid)
                return done(null, false);
            const publicUser = (0, UserDTO_1.toUserDTO)(dbUser);
            return done(null, publicUser);
        }
        catch (err) {
            return done(err);
        }
    })));
    passport_1.default.serializeUser((user, done) => {
        const u = user;
        done(null, u.id);
    });
    passport_1.default.deserializeUser((id, done) => __awaiter(this, void 0, void 0, function* () {
        try {
            const dbUser = yield (0, userService_1.findById)(id);
            if (!dbUser)
                return done(null, false);
            const publicUser = (0, UserDTO_1.toUserDTO)(dbUser);
            done(null, publicUser);
        }
        catch (err) {
            done(err);
        }
    }));
}
