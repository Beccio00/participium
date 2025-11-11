import { Router } from "express";
import { requireAdmin } from "../middleware/routeProtection";
import {
  createMunicipalityUserController,
  listMunicipalityUsersController,
  getMunicipalityUserController,
  updateMunicipalityUserController,
  deleteMunicipalityUserController
} from "../controllers/municipalityController";

const router = Router();

router.use(requireAdmin);

// POST /admin/municipality-users - Create a new municipality user
router.post('/municipality-users', createMunicipalityUserController);

// GET /admin/municipality-users - List all municipality users
router.get('/municipality-users', listMunicipalityUsersController);

// GET /admin/municipality-users/:userId - Get specific municipality user
router.get('/municipality-users/:userId', getMunicipalityUserController);

// PUT /admin/municipality-users/:userId - Update specific municipality user
router.put('/municipality-users/:userId', updateMunicipalityUserController);

// DELETE /admin/municipality-users/:userId - Delete specific municipality user
router.delete('/municipality-users/:userId', deleteMunicipalityUserController);

export default router;