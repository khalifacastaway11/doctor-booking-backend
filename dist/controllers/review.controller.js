"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyReviewForDoctor = exports.getDoctorReviews = exports.createReview = void 0;
const prisma_1 = require("../lib/prisma");
const createReview = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { doctorId, rating, comment } = req.body;
        if (!doctorId || !rating || rating < 1 || rating > 5) {
            return res
                .status(400)
                .json({ message: "Doctor ID and valid rating (1-5) are required" });
        }
        const doctorProfile = await prisma_1.prisma.doctorProfile.findUnique({
            where: { id: doctorId },
            select: { userId: true },
        });
        if (!doctorProfile)
            return res.status(404).json({ message: "Doctor not found" });
        const completedAppointment = await prisma_1.prisma.appointment.findFirst({
            where: {
                patientId: req.user.userId,
                doctorId: doctorProfile.userId,
                status: "COMPLETED",
            },
        });
        if (!completedAppointment) {
            return res
                .status(403)
                .json({
                message: "You can only review doctors after a completed appointment",
            });
        }
        const existingReview = await prisma_1.prisma.review.findUnique({
            where: {
                patientId_doctorId: {
                    patientId: req.user.userId,
                    doctorId,
                },
            },
        });
        if (existingReview) {
            return res
                .status(409)
                .json({ message: "You have already reviewed this doctor" });
        }
        const review = await prisma_1.prisma.review.create({
            data: { rating, comment, patientId: req.user.userId, doctorId },
            include: { patient: { select: { name: true, email: true } } },
        });
        return res
            .status(201)
            .json({ message: "Review submitted successfully", review });
    }
    catch (error) {
        console.error("CREATE REVIEW ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.createReview = createReview;
const getDoctorReviews = async (req, res) => {
    try {
        const { doctorId: rawDoctorId } = req.params;
        const doctorId = Array.isArray(rawDoctorId) ? rawDoctorId[0] : rawDoctorId;
        if (!doctorId)
            return res.status(400).json({ message: "Doctor ID required" });
        const reviews = await prisma_1.prisma.review.findMany({
            where: { doctorId },
            include: { patient: { select: { name: true } } },
            orderBy: { createdat: "desc" },
        });
        const averageRating = reviews.length
            ? reviews.reduce((acc, review) => acc + review.rating, 0) /
                reviews.length
            : 0;
        return res
            .status(200)
            .json({ reviews, averageRating, totalReviews: reviews.length });
    }
    catch (error) {
        console.error("GET REVIEWS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getDoctorReviews = getDoctorReviews;
const getMyReviewForDoctor = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { doctorId: rawDoctorId } = req.params;
        const doctorId = Array.isArray(rawDoctorId) ? rawDoctorId[0] : rawDoctorId;
        if (!doctorId)
            return res.status(400).json({ message: "Doctor ID required" });
        const review = await prisma_1.prisma.review.findUnique({
            where: {
                patientId_doctorId: {
                    patientId: req.user.userId,
                    doctorId,
                },
            },
        });
        return res.status(200).json({ review });
    }
    catch (error) {
        console.error("GET MY REVIEW ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getMyReviewForDoctor = getMyReviewForDoctor;
