"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const routeProtection_1 = require("../middleware/routeProtection");
const router = (0, express_1.Router)();
router.post('/reports', routeProtection_1.isLoggedIn, reportController_1.createReport);
router.get('/reports', routeProtection_1.isLoggedIn, reportController_1.getReports);
exports.default = router;
