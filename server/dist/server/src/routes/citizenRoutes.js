"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const citizenController_1 = require("../controllers/citizenController");
const UserDTO_1 = require("../interfaces/UserDTO");
const routeProtection_1 = require("../middlewares/routeProtection");
const validationMiddlewere_1 = require("../middlewares/validationMiddlewere");
const uploadsMiddleware_1 = require("../middlewares/uploadsMiddleware");
const router = (0, express_1.Router)();
// POST api/citizen/signup
router.post("/signup", validationMiddlewere_1.ApiValidationMiddleware, (0, errorMiddleware_1.asyncHandler)((0, citizenController_1.signup)(UserDTO_1.Roles.CITIZEN)));
router.use(routeProtection_1.requireCitizen);
// POST api/citizen/me/photo
router.post("/me/photo", uploadsMiddleware_1.upload.array('photo', 1), (0, errorMiddleware_1.asyncHandler)(citizenController_1.uploadCitizenPhoto));
router.use(validationMiddlewere_1.ApiValidationMiddleware);
// GET api/citizen/me
router.get("/me", (0, errorMiddleware_1.asyncHandler)(citizenController_1.getCitizenProfile));
// PATCH api/citizen/me
router.patch("/me", (0, errorMiddleware_1.asyncHandler)(citizenController_1.updateCitizenProfile));
// DELETE api/citizen/me/photo
router.delete("/me/photo", (0, errorMiddleware_1.asyncHandler)(citizenController_1.deleteCitizenPhoto));
exports.default = router;
