import { z } from "zod";

export const createSlotSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const doctorIdParamsSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor ID"),
});

export const slotIdParamsSchema = z.object({
  id: z.string().uuid("Invalid slot ID"),
});