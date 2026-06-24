//src/routes/doctor.routes.ts
import { Router } from "express";
import { getDoctorById, getDoctors,createDoctorProfile,getCities } from "../controllers/doctor.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
const router = Router();

router.get("/", getDoctors);
router.get('/cities',getCities)
router.get("/:id", getDoctorById);
router.post('/', protect, authorize('DOCTOR'), createDoctorProfile)

export default router;
