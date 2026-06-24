//src/routes/slot.routes.ts
import { Router } from "express";
import { createSlot, getDoctorSlots, getMyDoctorSlots } from "../controllers/slot.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post("/", protect, authorize("DOCTOR"), createSlot);
router.get("/doctor/:doctorId", getDoctorSlots);
router.get("/my", protect, authorize("DOCTOR"), getMyDoctorSlots);
export default router;
