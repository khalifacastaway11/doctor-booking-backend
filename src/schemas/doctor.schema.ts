import { z } from "zod";

export const createDoctorProfileSchema = z.object({
    speciality: z.string().min(2, "speciality is required").max(100).trim(),
    bio: z.string().max(2000).trim().optional(),
    clinicAddress: z.string().min(5, "Clinic Address is required").max(255).trim(),
    city: z.string().min(2, "City is required").max(100).trim(),
    price: z.coerce.number().positive("Price must be greater than 0").max(1_000_000),
});

export const UpdateDoctorProfileSchema = createDoctorProfileSchema.partial()
    .refine((data) => Object.keys(data).length > 0,
        { message: "At least one field must be provided" });

export const doctorIdParamsSchema = z.object({
    id: z.string().uuid("Invalid doctor ID"),
});

export const getDoctorsQuerySchema = z.object({
    search: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    sort: z.enum(["name", "price_asc", "price_desc"]).optional(),
})

