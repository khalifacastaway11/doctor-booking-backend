import { Router } from "express";
import {
  createSlot,
  getDoctorSlots,
  getMyDoctorSlots,
  deleteSlot,
} from "../controllers/slot.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createSlotSchema,
  doctorIdParamsSchema,
  slotIdParamsSchema,
} from "../schemas/slot.schema";

const router = Router();

// ✅ POST — create slot (this is what's missing)
router.post("/", protect, authorize("DOCTOR"), validate({ body: createSlotSchema }), createSlot);

// ✅ GET — doctor's own slots
router.get("/my", protect, authorize("DOCTOR"), getMyDoctorSlots);

// ✅ GET — patient viewing a doctor's slots
router.get("/doctor/:doctorId", validate({ params: doctorIdParamsSchema }), getDoctorSlots);

// ✅ DELETE — remove a slot
router.delete("/:id", protect, authorize("DOCTOR"), validate({ params: slotIdParamsSchema }), deleteSlot);

export default router;