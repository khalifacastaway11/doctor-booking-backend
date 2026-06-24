"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/routes/index.ts
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const doctor_routes_1 = __importDefault(require("./doctor.routes"));
const slot_routes_1 = __importDefault(require("./slot.routes"));
const appointment_routes_1 = __importDefault(require("./appointment.routes"));
const review_routes_1 = __importDefault(require("./review.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/doctors", doctor_routes_1.default);
router.use("/slots", slot_routes_1.default);
router.use("/appointments", appointment_routes_1.default);
router.use("/reviews", review_routes_1.default);
exports.default = router;
