import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { requireAdmin } from "../middleware/routeProtection";
import {
  createMunicipalityUserController,
  listMunicipalityUsersController,
  getMunicipalityUserController,
  deleteMunicipalityUserController,
  listRolesController
} from "../controllers/municipalityController";

const router = Router();

router.use(requireAdmin);

// POST api/admin/municipality-users - Create a new municipality user
router.post('/municipality-users', asyncHandler(createMunicipalityUserController));

// GET api/admin/municipality-users - List all municipality users
router.get('/municipality-users', asyncHandler(listMunicipalityUsersController));

// GET api/admin/municipality-users/:userId - Get specific municipality user
router.get('/municipality-users/:userId', asyncHandler(getMunicipalityUserController));

// DELETE api/admin/municipality-users/:userId - Delete specific municipality user
router.delete('/municipality-users/:userId', asyncHandler(deleteMunicipalityUserController));

// GET api/admin/roles - List all roles
router.get('/roles', asyncHandler(listRolesController));

export default router;