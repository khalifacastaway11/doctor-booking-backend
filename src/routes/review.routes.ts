import { Router } from "express"
import { createReview, getDoctorReviews,getMyReviewForDoctor } from "../controllers/review.controller"
import { protect } from "../middleware/auth.middleware"
import { authorize } from "../middleware/role.middleware"
import{validate} from "../middleware/validate.middleware"
import { createReviewSchema,doctorIdParamsSchema } from "../schemas/review.schema"

const router = Router();

router.post("/", protect, authorize("PATIENT"),validate({body:createReviewSchema}), createReview)
router.get("/doctor/:doctorId", validate({params:doctorIdParamsSchema}),getDoctorReviews)
router.get("/my/:doctorId", protect, authorize("PATIENT"),validate({params:doctorIdParamsSchema}),getMyReviewForDoctor);

export default router;
