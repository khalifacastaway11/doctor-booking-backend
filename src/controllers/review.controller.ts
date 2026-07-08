import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { doctorId, rating, comment } = req.body;

    if (!doctorId || !rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Doctor ID and valid rating (1-5) are required" });
    }

    // Get the doctor's internal user ID
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { userId: true },
    });
    if (!doctorProfile)
      return res.status(404).json({ message: "Doctor not found" });

    // Check if patient has at least one completed appointment with this doctor
    const completedAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: req.user.userId,
        doctorId: doctorProfile.userId,
        status: "COMPLETED",
      },
    });
    if (!completedAppointment) {
      return res.status(403).json({
        message: "You can only review doctors after a completed appointment",
      });
    }

    // Allow multiple reviews – no uniqueness check
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        patientId: req.user.userId,
        doctorId,
      },
      include: { patient: { select: { name: true, email: true } } },
    });

    return res
      .status(201)
      .json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDoctorReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId: rawDoctorId } = req.params;
    const doctorId = Array.isArray(rawDoctorId) ? rawDoctorId[0] : rawDoctorId;
    if (!doctorId)
      return res.status(400).json({ message: "Doctor ID required" });

    const reviews = await prisma.review.findMany({
      where: { doctorId },
      include: { patient: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const averageRating = reviews.length
      ? reviews.reduce(
          (acc: number, review: { rating: number }) => acc + review.rating,
          0,
        ) / reviews.length
      : 0;

    return res
      .status(200)
      .json({ reviews, averageRating, totalReviews: reviews.length });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyReviewForDoctor = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { doctorId: rawDoctorId } = req.params;
    const doctorId = Array.isArray(rawDoctorId) ? rawDoctorId[0] : rawDoctorId;
    if (!doctorId)
      return res.status(400).json({ message: "Doctor ID required" });

    // Get the most recent review by this patient for this doctor
    const review = await prisma.review.findFirst({
      where: {
        patientId: req.user.userId,
        doctorId: doctorId,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ review });
  } catch (error) {
    console.error("GET MY REVIEW ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
