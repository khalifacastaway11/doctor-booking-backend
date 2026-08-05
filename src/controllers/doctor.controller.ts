import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import logger from "../lib/logger";
import redis from "../lib/redis";

export const createDoctorProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { speciality, bio, clinicAddress, city, price } = req.body;

    if (!speciality || !clinicAddress || !city || price === undefined) {
      return res.status(400).json({
        message: "specialty, clinicAddress, city and price are required",
      });
    }

    const existingProfile = await prisma.doctorProfile.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (existingProfile) {
      return res.status(409).json({
        message: "Doctor profile already exists",
      });
    }

    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId: req.user.userId,
        speciality,
        bio,
        clinicAddress,
        city,
        price: Number(price),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    //clear cache
    await redis.del("doctors:*");

    return res.status(201).json({
      message: "Doctor profile created successfully",
      doctorProfile,
    });
  } catch (error) {
    console.error("CREATE DOCTOR PROFILE ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// src/controllers/doctor.controller.ts
export const getDoctors = async (req: Request, res: Response) => {
  try {
    // Build cache key from query parameters
    const queryKey = JSON.stringify(req.query);
    const cacheKey = `doctors:${queryKey}`;

    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cached));
    }
    logger.debug(`Cache miss for ${cacheKey}`);

    //if not in cache hit DB
    const { search, city, minPrice, maxPrice, sort } = req.query;

    let where: any = {};

    // Search by name or specialty
    if (search && typeof search === "string") {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { speciality: { contains: search, mode: "insensitive" } },
      ];
    }

    // City filter - exact match (case‑insensitive)
    if (city && typeof city === "string") {
      where.city = { equals: city, mode: "insensitive" };
    }

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Sorting
    let orderBy: any = {};
    if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else orderBy = { user: { name: "asc" } };

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy,
    });

    return res.status(200).json({ doctors });
  } catch (error) {
    console.error("GET DOCTORS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slots: {
          where: {
            isBooked: false,
            endTime: { gt: new Date() },
          },
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      doctor,
    });
  } catch (error) {
    console.error("GET DOCTOR BY ID ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getCities = async (req: Request, res: Response) => {
  try {
    const cities = await prisma.doctorProfile.findMany({
      select: {
        city: true,
      },
      distinct: ["city"],
    });
    const cityList = cities
      .map((c: { city: string }) => c.city)
      .filter(Boolean);
    return res.status(200).json({
      cities: cityList,
    });
  } catch (error) {
    console.error("GET CITIES ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
