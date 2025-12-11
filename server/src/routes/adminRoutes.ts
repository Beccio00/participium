import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { requireAdmin } from "../middlewares/routeProtection";
import {
  createMunicipalityUserController,
  listMunicipalityUsersController,
  getMunicipalityUserController,
  deleteMunicipalityUserController,
  listRolesController
} from "../controllers/municipalityController";
import {
  createExternalCompanyController,
  listExternalCompaniesController,
  createExternalMaintainerController,
  listExternalMaintainersController,
  getExternalMaintainerController,
  deleteExternalMaintainerController,
  getExternalCompaniesWithAccessController,
  deleteExternalCompanyController
} from "../controllers/externalController";

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

// POST api/admin/external-companies - Create a new external company
router.post('/external-companies', asyncHandler(createExternalCompanyController));

// GET api/admin/external-companies - List all external companies with their maintainers
router.get('/external-companies', asyncHandler(listExternalCompaniesController));

// GET api/admin/external-companies/platform-access - Get companies with platform access (for maintainer creation)
router.get('/external-companies/platform-access', asyncHandler(getExternalCompaniesWithAccessController));

// DELETE api/admin/external-companies/:id - Delete an external company
router.delete('/external-companies/:id', asyncHandler(deleteExternalCompanyController));

// POST api/admin/external-maintainers - Create a new external maintainer
router.post('/external-maintainers', asyncHandler(createExternalMaintainerController));

// GET api/admin/external-maintainers - List all external maintainers
router.get('/external-maintainers', asyncHandler(listExternalMaintainersController));

// GET api/admin/external-maintainers/:id - Get specific external maintainer
router.get('/external-maintainers/:id', asyncHandler(getExternalMaintainerController));

// DELETE api/admin/external-maintainers/:id - Delete specific external maintainer
router.delete('/external-maintainers/:id', asyncHandler(deleteExternalMaintainerController));

export default router;