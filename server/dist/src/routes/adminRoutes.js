"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeProtection_1 = require("../middleware/routeProtection");
const municipalityController_1 = require("../controllers/municipalityController");
const router = (0, express_1.Router)();
router.use(routeProtection_1.requireAdmin);
// POST api/admin/municipality-users - Create a new municipality user
router.post('/municipality-users', municipalityController_1.createMunicipalityUserController);
// GET api/admin/municipality-users - List all municipality users
router.get('/municipality-users', municipalityController_1.listMunicipalityUsersController);
// GET api/admin/municipality-users/:userId - Get specific municipality user
router.get('/municipality-users/:userId', municipalityController_1.getMunicipalityUserController);
// DELETE api/admin/municipality-users/:userId - Delete specific municipality user
router.delete('/municipality-users/:userId', municipalityController_1.deleteMunicipalityUserController);
// GET api/admin/roles - List all roles
router.get('/roles', municipalityController_1.listRolesController);
exports.default = router;
