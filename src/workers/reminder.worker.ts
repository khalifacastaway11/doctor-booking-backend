import { Job } from "bullmq";
import { prisma } from "../lib/prisma";
import { sendReminderEmail } from "../services/email.service";
import logger from "../lib/logger";

export const handler = async (job: Job) => {
  const { appointmentId } = job.data;
  logger.info(`⏰ Processing reminder for ${appointmentId}`);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      doctor: true,
      slot: {
        include: {
          doctor: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!appointment) {
    logger.warn(`Appointment ${appointmentId} not found`);
    return;
  }

  if (appointment.reminderSent || appointment.status !== "BOOKED") {
    logger.info(`Skipping reminder for ${appointmentId} (already sent or cancelled)`);
    return;
  }
  
  const patientTimeZone=appointment.patient.timeZone ||"UTC"
  const clinicAddress = appointment.slot.doctor.clinicAddress || "Clinic address not available";

  await sendReminderEmail(
    appointment.patient.email,
    appointment.doctor.name,
    appointment.patient.name,
    appointment.slot.startTime,
    appointment.slot.endTime,
    clinicAddress,
    "Africa/Cairo" // or use patient.timezone if stored
  );

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { reminderSent: true, reminderJobId: null },
  });

  logger.info(`✅ Reminder sent for ${appointmentId}`);
};
