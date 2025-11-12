"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const citizenController_1 = require("../controllers/citizenController");
const reportController_1 = require("../controllers/reportController");
const UserDTO_1 = require("../interfaces/UserDTO");
const router = express_1.default.Router();
// POST /citizen/signup
router.post('/signup', (0, citizenController_1.signup)(UserDTO_1.Roles.CITIZEN));
// POST /citizen/reports
router.post('/reports', reportController_1.createReport);
exports.default = router;
