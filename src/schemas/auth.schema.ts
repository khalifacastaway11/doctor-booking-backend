import { z } from "zod";

const email = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .toLowerCase()
  .trim();

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long");

const VALID_TIMEZONES = new Set<string>(
  typeof (Intl as any).supportedValuesOf === "function"
    ? (Intl as any).supportedValuesOf("timeZone")
    : []
);

VALID_TIMEZONES.add("UTC");

const timeZoneSchema = z
  .string()
  .min(1, "Time zone cannot be empty")
  .max(64, "Time zone too long")
  .refine(
    (tz) => VALID_TIMEZONES.size === 0 || VALID_TIMEZONES.has(tz),
    {
      message:
        "Invalid time zone. Use a valid IANA name like 'Africa/Cairo' or 'America/New_York'.",
    }
  );

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email,
  password,
  role: z.enum(["PATIENT", "DOCTOR"]),
  timeZone: timeZoneSchema,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email,
});

export const updateTimeZoneSchema = z.object({
  timeZone: timeZoneSchema,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  password,
});

export const resetTokenParamsSchema = z.object({
  token: z.string().length(64, "Invalid reset token"),
});