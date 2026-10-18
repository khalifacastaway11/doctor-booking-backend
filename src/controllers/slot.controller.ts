// src/controllers/slot.controller.ts
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import {convertToUTC} from "../utils/timezone"
import logger from "../lib/logger";
import { serializeError } from "../utils/serialize-error";

export const createSlot = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { date, startTime, endTime } = req.body;

    

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.userId },
      include:{ user: true },
    });

    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const doctorTimeZone = doctorProfile.user.timeZone || "UTC"; 

    const start = convertToUTC(date, startTime, doctorTimeZone);
    const end = convertToUTC(date, endTime, doctorTimeZone);

    if (start >= end) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    const slot = await prisma.slot.create({
      data: {
        doctorId: doctorProfile.id,
        startTime: start, 
        endTime: end,  
      }
    });

    return res.status(201).json({
      message: "Slot created successfully",
      slot,
      
    });
  } catch (error) {
    logger.error("createSlot error:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
  }
};

// هذه الدالة تعيد المواعيد المتاحة فقط (للمرضى)
//for patients only future available slots
// For patients: only future available slots
export const getDoctorSlots = async (req: AuthRequest, res: Response) => {
  try {
    const doctorIdParam = req.params.doctorId;
    const doctorId = Array.isArray(doctorIdParam) ? doctorIdParam[0] : doctorIdParam;

    
    const slots = await prisma.slot.findMany({
      where: {
        doctorId,
        isBooked: false,
        endTime: { gt: new Date() }, // Only future slots
      },
      orderBy: { startTime: "asc" },
    });

    return res.status(200).json({ slots });
  } catch (error) {
    logger.error("GET SLOTS ERROR:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
  }
};

// For doctor dashboard: also hide expired slots (clean view)
export const getMyDoctorSlots = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const slots = await prisma.slot.findMany({
      where: {
        doctorId: doctorProfile.id,
        endTime: { gt: new Date() }, //  Hide expired slots from dashboard
      },
      orderBy: { startTime: "asc" },
    });

    return res.status(200).json({ slots });
  } catch (error) {
    logger.error("GET MY SLOTS ERROR:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a slot (doctor only, own slots, not booked)
export const deleteSlot = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can delete slots" });
    }

    const idParam = req.params.id;
    const slotId = Array.isArray(idParam) ? idParam[0] : idParam;
    

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { appointment: true },
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.doctorId !== doctorProfile.id) {
      return res.status(403).json({ message: "This is not your slot" });
    }

    

    await prisma.slot.delete({ where: { id: slotId } });

    return res.status(200).json({ message: "Slot deleted successfully" });
  } catch (error) {
    logger.error("DELETE SLOT ERROR:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
  }
};
