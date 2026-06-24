//src/controllers/slot.controller.ts
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const createSlot = async (req: AuthRequest, res: Response) => {
    
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const { date,startTime, endTime } = req.body;
        
        if (!date||!startTime || !endTime) {
            return res.status(400).json({
                message: "date,start time and end time are required",
            });
        }
        //get doctorprofile related to the user
        const doctorProfile = await prisma.doctorProfile.findUnique({
            where: {
                userId: req.user.userId,
            },
        });

        if (!doctorProfile) {
            return res.status(404).json({
                message: "Doctor profile not found",
            });
        }
       const start=new Date(`${date}T${startTime}`)
       const end = new Date(`${date}T${endTime}`)
        
        if (start >= end) {
            return res.status(400).json({
                message: "Start time must be before end time",
            });
        }
        const slot = await prisma.slot.create({
            data: {
                doctorId: doctorProfile.id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
            },
            
        });

        return res.status(201).json({
            message: "Slot is created successfully",
            slot,
        });
    } catch (error) {
        console.error("createSlot error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const getDoctorSlots = async (req: AuthRequest, res: Response) => {
  try {
    const doctorIdParam = req.params.doctorId;
    const doctorId = Array.isArray(doctorIdParam) ? doctorIdParam[0] : doctorIdParam;

    if (!doctorId) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const slots = await prisma.slot.findMany({
      where: {
        doctorId,
        isBooked: false,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return res.status(200).json({
      slots,
    });
  } catch (error) {
    console.error("GET SLOTS ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




    