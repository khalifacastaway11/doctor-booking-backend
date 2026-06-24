//src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes";
import doctorRoutes from "./doctor.routes";

import slotRoutes from "./slot.routes";
import appointmentRoutes from "./appointment.routes";
import reviewRoutes from "./review.routes";
const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/slots", slotRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/reviews", reviewRoutes);
export default router;
