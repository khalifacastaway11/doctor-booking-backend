import { prisma } from "../src/lib/prisma";

afterEach(async () => {
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  try {
    const { reminderWorker, reminderQueue } = await import("../src/lib/queue");
    const { default: redis } = await import("../src/lib/redis");

    await reminderWorker?.close();
    await reminderQueue?.close();
    redis?.disconnect();
  } catch (err) {
    console.warn("Cleanup warning:", err);
  }

  await prisma.$disconnect();
});