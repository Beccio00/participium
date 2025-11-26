import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { signup, getCitizenProfile, updateCitizenProfile, uploadCitizenPhoto, deleteCitizenPhoto } from "../controllers/citizenController";
import { Roles } from "../interfaces/UserDTO";
import { requireCitizen } from "../middlewares/routeProtection";
import { ApiValidationMiddleware } from "../middlewares/validationMiddlewere";
import { upload } from "../middlewares/uploadsMiddleware";


const router = Router();

// POST api/citizen/signup
router.post("/signup", ApiValidationMiddleware, asyncHandler(signup(Roles.CITIZEN)));

router.use(requireCitizen);

// POST api/citizen/me/photo
router.post("/me/photo", upload.array('photo', 1), asyncHandler(uploadCitizenPhoto));

router.use(ApiValidationMiddleware);

// GET api/citizen/me
router.get("/me", asyncHandler(getCitizenProfile));

// PATCH api/citizen/me
router.patch("/me", asyncHandler(updateCitizenProfile));

// DELETE api/citizen/me/photo
router.delete("/me/photo", asyncHandler(deleteCitizenPhoto));

export default router;
