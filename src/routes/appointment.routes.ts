//src/routes/appointment.routes.ts
import { Router } from "express";
import {
  bookAppointment,
  cancelAppointment,
  completeAppointment,
  getMyAppointments,
} from "../controllers/appointment.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";


const router = Router();

router.post("/", protect, authorize("PATIENT"),bookAppointment);
router.get("/my", protect, authorize("PATIENT"), getMyAppointments);
router.patch("/:id/cancel", protect, authorize("PATIENT"), cancelAppointment);
router.patch("/:id/complete",protect,completeAppointment)

export default router;
