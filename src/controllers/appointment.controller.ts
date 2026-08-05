//src/controllers/appointment.controller.ts
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppointmentStatus } from "../generated/prisma/client";
import{ scheduleReminder } from "../services/reminder.service";
import { cancelReminder } from "../services/reminder.service";
export const bookAppointment = async (req: AuthRequest, res: Response) => {
  
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

    const patient = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!patient || patient.role !== "PATIENT") {
      return res.status(403).json({
        message: "Only patients can book appointments",
      });
    }

    const slot = await prisma.slot.findUnique({
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

    const [, appointment] = await prisma.$transaction([
      prisma.slot.update({
        where: {
          id: slotId,
        },
        data: {
          isBooked: true,
        },
      }),

      prisma.appointment.create({
        data: {
          patientId: req.user!.userId,
          doctorId: slot.doctor.userId,
          slotId: slot.id,
          notes,
          status: AppointmentStatus.BOOKED,
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
    
    await scheduleReminder(appointment.id);
    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error: any) {
    console.error("BOOK APPOINTMENT ERROR:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({
        message: "This slot already has an appointement",
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const appointments = await prisma.appointment.findMany({
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
  } catch (error) {
    console.error("GET MY APPOINTMENTS ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {

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

    const appointment = await prisma.appointment.findUnique({
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
    await cancelReminder(appointment.id);

    await prisma.$transaction([
      prisma.appointment.delete({
        where: {
          id: appointmentId,
        },
      }),

      prisma.slot.update({
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
  } catch (error) {
    console.error("CANCEL APPOINTMENT ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//for test review feature and we will delete it
export const completeAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ message: "Invalid appointment id" });

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
    res.json({ message: "Appointment completed", appointment });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
