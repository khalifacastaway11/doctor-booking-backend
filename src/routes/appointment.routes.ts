//src/routes/appointment.routes.ts
import { Router } from "express";
import {
  bookAppointment,
  cancelAppointment,
  completeAppointment,
  getMyAppointments,
  getDoctorAppointments,
} from "../controllers/appointment.controller";
import { protect } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import {validate} from "../middleware/validate.middleware"
import {bookAppointmentSchema,appointmentIdParamsSchema} from "../schemas/appointment.schma"
import { PaginationQuery, paginationQuerySchema } from "../schemas/common.schema";
const router = Router();

router.post("/", protect, authorize("PATIENT"),validate({body:bookAppointmentSchema}),bookAppointment);
router.get("/my", protect, authorize("PATIENT"), validate({query:paginationQuerySchema}),getMyAppointments);
router.get("/doctor",protect, authorize("DOCTOR"),validate({query:paginationQuerySchema}),getDoctorAppointments)
router.patch("/:id/cancel", protect, authorize("PATIENT","DOCTOR"), validate({params:appointmentIdParamsSchema}),cancelAppointment);
router.patch("/:id/complete",protect,authorize("DOCTOR"),validate({params:appointmentIdParamsSchema}),completeAppointment)

export default router;
