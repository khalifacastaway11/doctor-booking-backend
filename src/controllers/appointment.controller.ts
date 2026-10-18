// src/controllers/appointment.controller.ts
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppointmentStatus } from "@prisma/client";
import { scheduleReminder, cancelReminder } from "../services/reminder.service";
import logger from "../lib/logger";
import { buildPagination } from "../schemas/common.schema";
import { serializeError } from "../utils/serialize-error";

export const bookAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { slotId, notes } = req.body;

    const patient = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!patient || patient.role !== "PATIENT") {
      return res.status(403).json({ message: "Only patients can book appointments" });
    }

    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { doctor: true },
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.isBooked) {
      return res.status(409).json({ message: "Slot already booked" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSlot = await tx.slot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      const appointment = await tx.appointment.create({
        data: {
          patientId: req.user!.userId,
          doctorId: slot.doctor.userId,
          slotId: slot.id,
          notes,
          status: AppointmentStatus.BOOKED,
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          doctor: { select: { id: true, name: true, email: true } },
          slot: true,
        },
      });

      return { updatedSlot, appointment };
    });

    // ✅ Log only primitive fields — never the object
    logger.info("Appointment booked successfully", {
      appointmentId: result.appointment.id,
      patientId: result.appointment.patientId,
      doctorId: result.appointment.doctorId,
      slotId: result.appointment.slotId,
    });

    try {
      await scheduleReminder(result.appointment.id);
    } catch (reminderErr) {
      // ✅ Use the correct variable name
      logger.warn("Reminder scheduling failed (non-fatal)", {
        error: serializeError(reminderErr),
      });
    }

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: result.appointment,
    });
  } catch (error: any) {
    logger.error("BOOK APPOINTMENT ERROR", { error: serializeError(error) });
    if (error?.code === "P2002") {
      return res.status(409).json({ message: "This slot already has an appointment" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const where = { patientId: req.user.userId };

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          doctor: { select: { id: true, name: true, email: true } },
          slot: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      appointments,
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    logger.error("GET MY APPOINTMENTS ERROR", { error: serializeError(error) });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const appointmentIdParam = req.params.id;
    const appointmentId = Array.isArray(appointmentIdParam)
      ? appointmentIdParam[0]
      : appointmentIdParam;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // ✅ Check ownership based on role
    if (req.user.role === "PATIENT") {
      if (appointment.patientId !== req.user.userId) {
        return res.status(403).json({
          message: "You can only cancel your own appointments",
        });
      }
    } else if (req.user.role === "DOCTOR") {
      if (appointment.doctorId !== req.user.userId) {
        return res.status(403).json({
          message: "You can only cancel your own appointments",
        });
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (appointment.status === "CANCELLED") {
      return res.status(400).json({ message: "Appointment is already cancelled" });
    }

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({ message: "Cannot cancel a completed appointment" });
    }

    // ✅ Cancel reminder (non-fatal if it fails)
    try {
      await cancelReminder(appointment.id);
    } catch (reminderError) {
      logger.warn("Reminder cancel failed (non-fatal)", {
        error: serializeError(reminderError),
      });
    }

    // ✅ Then do the transaction
    await prisma.$transaction([
      prisma.appointment.delete({ where: { id: appointmentId } }),
      prisma.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      }),
    ]);

    return res.status(200).json({
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    logger.error("CANCEL APPOINTMENT ERROR", { error: serializeError(error) });
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Mark an appointment as completed (doctor only)
export const completeAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can complete appointments" });
    }

    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.doctorId !== req.user.userId) {
      return res.status(403).json({ message: "This is not your appointment" });
    }

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({ message: "Appointment already completed" });
    }
    if (appointment.status === "CANCELLED") {
      return res.status(400).json({ message: "Cannot complete a cancelled appointment" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    return res.status(200).json({
      message: "Appointment marked as completed",
      appointment: updated,
    });
  } catch (error) {
    logger.error("COMPLETE APPOINTMENT ERROR", { error: serializeError(error) });
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Doctors see all their bookings with patient details
export const getDoctorAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can access this" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const where = { doctorId: req.user.userId };

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, email: true } },
          slot: true,
        },
        orderBy: { slot: { startTime: "asc" } },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      appointments,
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    logger.error("GET DOCTOR APPOINTMENTS ERROR", { error: serializeError(error) });
    return res.status(500).json({ message: "Internal server error" });
  }
};