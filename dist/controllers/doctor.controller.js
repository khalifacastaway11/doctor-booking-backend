"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCities = exports.getDoctorById = exports.getDoctors = exports.createDoctorProfile = void 0;
const prisma_1 = require("../lib/prisma");
const createDoctorProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const { specialty, bio, clinicAddress, city, price } = req.body;
        if (!specialty || !clinicAddress || !city || price === undefined) {
            return res.status(400).json({
                message: "specialty, clinicAddress, city and price are required",
            });
        }
        const existingProfile = await prisma_1.prisma.doctorProfile.findUnique({
            where: {
                userId: req.user.userId,
            },
        });
        if (existingProfile) {
            return res.status(409).json({
                message: "Doctor profile already exists",
            });
        }
        const doctorProfile = await prisma_1.prisma.doctorProfile.create({
            data: {
                userId: req.user.userId,
                specialty,
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
        return res.status(201).json({
            message: "Doctor profile created successfully",
            doctorProfile,
        });
    }
    catch (error) {
        console.error("CREATE DOCTOR PROFILE ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.createDoctorProfile = createDoctorProfile;
// src/controllers/doctor.controller.ts
const getDoctors = async (req, res) => {
    try {
        const { search, city, minPrice, maxPrice, sort } = req.query;
        let where = {};
        // Search by name or specialty
        if (search && typeof search === "string") {
            where.OR = [
                { user: { name: { contains: search, mode: "insensitive" } } },
                { specialty: { contains: search, mode: "insensitive" } },
            ];
        }
        // City filter - exact match (case‑insensitive)
        if (city && typeof city === "string") {
            where.city = { equals: city, mode: "insensitive" };
        }
        // Price range
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = Number(minPrice);
            if (maxPrice)
                where.price.lte = Number(maxPrice);
        }
        // Sorting
        let orderBy = {};
        if (sort === "price_asc")
            orderBy = { price: "asc" };
        else if (sort === "price_desc")
            orderBy = { price: "desc" };
        else
            orderBy = { user: { name: "asc" } };
        const doctors = await prisma_1.prisma.doctorProfile.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy,
        });
        return res.status(200).json({ doctors });
    }
    catch (error) {
        console.error("GET DOCTORS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getDoctors = getDoctors;
const getDoctorById = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Invalid doctor id" });
        }
        const doctor = await prisma_1.prisma.doctorProfile.findUnique({
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
                        endTime: { gt: new Date() }
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
    }
    catch (error) {
        console.error("GET DOCTOR BY ID ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.getDoctorById = getDoctorById;
const getCities = async (req, res) => {
    try {
        const cities = await prisma_1.prisma.doctorProfile.findMany({
            select: {
                city: true,
            },
            distinct: ["city"],
        });
        const cityList = cities.map((c) => c.city).filter(Boolean);
        return res.status(200).json({
            cities: cityList
        });
    }
    catch (error) {
        console.error("GET  ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.getCities = getCities;
