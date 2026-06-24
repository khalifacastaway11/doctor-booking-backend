"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyDoctorSlots = exports.getDoctorSlots = exports.createSlot = void 0;
const prisma_1 = require("../lib/prisma");
const createSlot = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { date, startTime, endTime } = req.body;
        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                message: "date, startTime and endTime are required",
            });
        }
        const doctorProfile = await prisma_1.prisma.doctorProfile.findUnique({
            where: { userId: req.user.userId },
        });
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        // دمج التاريخ مع الوقت
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);
        if (start >= end) {
            return res.status(400).json({
                message: "End time must be after start time",
            });
        }
        const slot = await prisma_1.prisma.slot.create({
            data: {
                doctorId: doctorProfile.id,
                startTime: start, // ✅ استخدم المتغير الصحيح
                endTime: end, // ✅ استخدم المتغير الصحيح
            },
        });
        return res.status(201).json({
            message: "Slot created successfully",
            slot,
        });
    }
    catch (error) {
        console.error("createSlot error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createSlot = createSlot;
// هذه الدالة تعيد المواعيد المتاحة فقط (للمرضى)
//for patients only future available slots
// For patients: only future available slots
const getDoctorSlots = async (req, res) => {
    try {
        const doctorIdParam = req.params.doctorId;
        const doctorId = Array.isArray(doctorIdParam) ? doctorIdParam[0] : doctorIdParam;
        if (!doctorId) {
            return res.status(400).json({ message: "Invalid doctor id" });
        }
        const slots = await prisma_1.prisma.slot.findMany({
            where: {
                doctorId,
                isBooked: false,
                endTime: { gt: new Date() }, // ✅ Only future slots
            },
            orderBy: { startTime: "asc" },
        });
        return res.status(200).json({ slots });
    }
    catch (error) {
        console.error("GET SLOTS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getDoctorSlots = getDoctorSlots;
// For doctor dashboard: also hide expired slots (clean view)
const getMyDoctorSlots = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const doctorProfile = await prisma_1.prisma.doctorProfile.findUnique({
            where: { userId: req.user.userId },
        });
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const slots = await prisma_1.prisma.slot.findMany({
            where: {
                doctorId: doctorProfile.id,
                endTime: { gt: new Date() }, // ✅ Hide expired slots from dashboard
            },
            orderBy: { startTime: "asc" },
        });
        return res.status(200).json({ slots });
    }
    catch (error) {
        console.error("GET MY SLOTS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getMyDoctorSlots = getMyDoctorSlots;
