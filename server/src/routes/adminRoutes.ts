import { Router } from "express";
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
router.post('/municipality-users', createMunicipalityUserController);

// GET api/admin/municipality-users - List all municipality users
router.get('/municipality-users', listMunicipalityUsersController);

// GET api/admin/municipality-users/:userId - Get specific municipality user
router.get('/municipality-users/:userId', getMunicipalityUserController);

// DELETE api/admin/municipality-users/:userId - Delete specific municipality user
router.delete('/municipality-users/:userId', deleteMunicipalityUserController);

// GET api/admin/roles - List all roles
router.get('/roles', listRolesController);

export default router;