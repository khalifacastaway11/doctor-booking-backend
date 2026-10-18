import { reminderQueue } from "../lib/queue";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const scheduleReminder = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { slot: true },
  });

  if (!appointment) return;

  const startTime = appointment.slot.startTime;
  const now = new Date();
  const delay = startTime.getTime() - now.getTime() - 24 * 60 * 60 * 1000;

  if (delay <= 0) {
    logger.warn(`Appointment ${appointmentId} starts in less than 24h – reminder skipped`);
    return;
  }

  const job = await reminderQueue.add(
    `reminder-${appointmentId}`,
    { appointmentId },
    {
      delay,
      jobId: `reminder-${appointmentId}`,
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { reminderJobId: job.id || undefined },
  });

  logger.info(`📅 Reminder scheduled for ${appointmentId} in ${delay}ms`);
};

export const cancelReminder = async (appointmentId: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { reminderJobId: true },
  });

  if (appointment?.reminderJobId) {
    const job = await reminderQueue.getJob(appointment.reminderJobId);
    if (job) {
      await job.remove();
      logger.info(`🗑️ Reminder job removed for ${appointmentId}`);
    }
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { reminderJobId: null },
  });
};
