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
exports.getApiInfo = getApiInfo;
const constants_1 = require("../config/constants");
function getApiInfo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.json({
            message: constants_1.CONFIG.API.NAME,
            version: constants_1.CONFIG.API.VERSION,
            description: constants_1.CONFIG.API.DESCRIPTION,
            endpoints: {
                auth: constants_1.CONFIG.ROUTES.SESSION,
                citizens: constants_1.CONFIG.ROUTES.CITIZEN,
                admin: constants_1.CONFIG.ROUTES.ADMIN,
                reports: constants_1.CONFIG.ROUTES.REPORTS,
                docs: constants_1.CONFIG.ROUTES.SWAGGER,
            },
        });
    });
}
