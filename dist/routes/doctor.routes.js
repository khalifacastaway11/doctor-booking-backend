"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/doctor.routes.ts
const express_1 = require("express");
const doctor_controller_1 = require("../controllers/doctor.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.get("/", doctor_controller_1.getDoctors);
router.get('/cities', doctor_controller_1.getCities);
router.get("/:id", doctor_controller_1.getDoctorById);
router.post('/', auth_middleware_1.protect, (0, role_middleware_1.authorize)('DOCTOR'), doctor_controller_1.createDoctorProfile);
exports.default = router;
