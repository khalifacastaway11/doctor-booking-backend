"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/slot.routes.ts
const express_1 = require("express");
const slot_controller_1 = require("../controllers/slot.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.protect, (0, role_middleware_1.authorize)("DOCTOR"), slot_controller_1.createSlot);
router.get("/doctor/:doctorId", slot_controller_1.getDoctorSlots);
router.get("/my", auth_middleware_1.protect, (0, role_middleware_1.authorize)("DOCTOR"), slot_controller_1.getMyDoctorSlots);
exports.default = router;
