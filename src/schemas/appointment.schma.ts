import {z} from "zod";

export const bookAppointmentSchema=z.object({
    slotId:z.string().uuid("Invalid Slot ID"),
    notes:z.string().max(500).optional()
});
export const appointmentIdParamsSchema=z.object({
    id:z.string().uuid("Invalid Apoointment Id"),
})