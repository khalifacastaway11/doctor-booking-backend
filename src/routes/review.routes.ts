import { Router } from "express"
import { createReview, getDoctorReviews,getMyReviewForDoctor } from "../controllers/review.controller"
import { protect } from "../middleware/auth.middleware"
import { authorize } from "../middleware/role.middleware"

console.log("Imported functions:", { createReview, getDoctorReviews, getMyReviewForDoctor })
const router = Router();

router.post("/", protect, authorize("PATIENT"), createReview)
router.get("/doctor/:doctorId", getDoctorReviews)
router.get("/my/:doctorId", protect, authorize("PATIENT"),getMyReviewForDoctor);

export default router;