import {z} from "zod";


export const createReviewSchema=z.object({
    doctorId:z.string().uuid("Invalid Doctor ID"),
    rating:z.coerce.number().int().min(1,"Rating must be at least 1-5").max(5),
    comment:z.string().max(1000).optional(),
    
});

export const doctorIdParamsSchema = z.object({
    doctorId:z.string().uuid("Invalid Doctor ID"),
});

