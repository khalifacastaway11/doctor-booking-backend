"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeAppointment = exports.cancelAppointment = exports.getMyAppointments = exports.bookAppointment = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("../generated/prisma/client");
const bookAppointment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const { slotId, notes } = req.body;
        if (!slotId) {
            return res.status(400).json({
                message: "slotId is required",
            });
        }
        const patient = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!patient || patient.role !== "PATIENT") {
            return res.status(403).json({
                message: "Only patients can book appointments",
            });
        }
        const slot = await prisma_1.prisma.slot.findUnique({
            where: { id: slotId },
            include: {
                doctor: true,
            },
        });
        if (!slot) {
            return res.status(404).json({
                message: "Slot not found",
            });
        }
        if (slot.isBooked) {
            return res.status(409).json({
                message: "Slot already booked",
            });
        }
        const [, appointment] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.slot.update({
                where: {
                    id: slotId,
                },
                data: {
                    isBooked: true,
                },
            }),
            prisma_1.prisma.appointment.create({
                data: {
                    patientId: req.user.userId,
                    doctorId: slot.doctor.userId,
                    slotId: slot.id,
                    notes,
                    status: client_1.AppointmentStatus.BOOKED,
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    doctor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    slot: true,
                },
            }),
        ]);
        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment,
        });
    }
    catch (error) {
        console.error("BOOK APPOINTMENT ERROR:", error);
        if ((error === null || error === void 0 ? void 0 : error.code) === "P2002") {
            return res.status(409).json({
                message: "This slot already has an appointement",
            });
        }
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.bookAppointment = bookAppointment;
const getMyAppointments = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const appointments = await prisma_1.prisma.appointment.findMany({
            where: {
                patientId: req.user.userId,
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                slot: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            appointments,
        });
    }
    catch (error) {
        console.error("GET MY APPOINTMENTS ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.getMyAppointments = getMyAppointments;
const cancelAppointment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const appointmentIdParam = req.params.id;
        const appointmentId = Array.isArray(appointmentIdParam)
            ? appointmentIdParam[0]
            : appointmentIdParam;
        if (!appointmentId) {
            return res.status(400).json({ message: "Invalid appointment id" });
        }
        const appointment = await prisma_1.prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            include: {
                slot: true,
            },
        });
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found",
            });
        }
        if (appointment.patientId !== req.user.userId) {
            return res.status(403).json({
                message: "You can only cancel your own appointments",
            });
        }
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.appointment.delete({
                where: {
                    id: appointmentId,
                },
            }),
            prisma_1.prisma.slot.update({
                where: {
                    id: appointment.slotId,
                },
                data: {
                    isBooked: false,
                },
            }),
        ]);
        return res.status(200).json({
            message: "Appointment cancelled successfully",
        });
    }
    catch (error) {
        console.error("CANCEL APPOINTMENT ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.cancelAppointment = cancelAppointment;
//for test review feature and we will delete it
const completeAppointment = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id)
            return res.status(400).json({ message: "Invalid appointment id" });
        const appointment = await prisma_1.prisma.appointment.update({
            where: { id },
            data: { status: "COMPLETED" },
        });
        res.json({ message: "Appointment completed", appointment });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.completeAppointment = completeAppointment;
