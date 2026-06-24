"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/appointment.routes.ts
const express_1 = require("express");
const appointment_controller_1 = require("../controllers/appointment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.protect, (0, role_middleware_1.authorize)("PATIENT"), appointment_controller_1.bookAppointment);
router.get("/my", auth_middleware_1.protect, (0, role_middleware_1.authorize)("PATIENT"), appointment_controller_1.getMyAppointments);
router.patch("/:id/cancel", auth_middleware_1.protect, (0, role_middleware_1.authorize)("PATIENT"), appointment_controller_1.cancelAppointment);
router.patch("/:id/complete", auth_middleware_1.protect, appointment_controller_1.completeAppointment);
exports.default = router;
