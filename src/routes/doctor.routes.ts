//src/routes/doctor.routes.ts
import { Router } from "express";
import { getDoctorById, getDoctors,createDoctorProfile,getCities, updateDoctorProfile} from "../controllers/doctor.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import {validate} from "../middleware/validate.middleware"
import {createDoctorProfileSchema,
    UpdateDoctorProfileSchema,
    getDoctorsQuerySchema,
    doctorIdParamsSchema,
    } from "../schemas/doctor.schema"

const router = Router();

router.get("/", validate({query: getDoctorsQuerySchema}), getDoctors);
router.get('/cities',getCities)
router.put("/me",protect,authorize('DOCTOR'),validate({body:UpdateDoctorProfileSchema}),updateDoctorProfile)
router.get("/:id", validate({params:doctorIdParamsSchema}),getDoctorById);
router.post('/', protect, authorize('DOCTOR'), validate({body: createDoctorProfileSchema}), createDoctorProfile)

export default router;
