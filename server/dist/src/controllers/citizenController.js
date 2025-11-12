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
exports.signup = signup;
const userService_1 = require("../services/userService");
const passwordService_1 = require("../services/passwordService");
const UserDTO_1 = require("../interfaces/UserDTO");
function signup(role) {
    return function (req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { firstName, lastName, email, password } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
            if (!firstName || !lastName || !email || !password) {
                let missedFields = [];
                if (!firstName)
                    missedFields.push('firstName');
                if (!lastName)
                    missedFields.push('lastName');
                if (!email)
                    missedFields.push('email');
                if (!password)
                    missedFields.push('password');
                return res.status(400).json({
                    error: 'BadRequest',
                    message: `Missing required fields: ${missedFields.join(', ')}`
                });
            }
            if (!(0, UserDTO_1.isValidRole)(role)) {
                return res.status(400).json({ error: 'BadRequest', message: 'Invalid role' });
            }
            try {
                const existing = yield (0, userService_1.findByEmail)(email);
                if (existing) {
                    return res.status(409).json({
                        error: 'Conflict',
                        message: 'Email already in use'
                    });
                }
                const { hashedPassword, salt } = yield (0, passwordService_1.hashPassword)(password);
                const created = yield (0, userService_1.createUser)({
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    password: hashedPassword,
                    salt,
                    role: role
                });
                return res.status(201).json((0, UserDTO_1.toUserDTO)(created));
            }
            catch (err) {
                return res.status(500).json({
                    error: 'InternalServerError',
                    message: 'Unable to create user'
                });
            }
        });
    };
}
