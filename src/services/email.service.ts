import nodemailer from "nodemailer";
import logger from "../lib/logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendReminderEmail = async (
  to: string,
  doctorName: string,
  patientName: string,
  startTime: Date,
  endTime: Date,
  clinicAddress: string,
  timezone: string = "UTC"  // accept timezone
) => {
  // Format date with timezone
  const formattedDate = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });
  const formattedStart = startTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
  const formattedEnd = endTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #0f766e;">🩺 Appointment Reminder</h2>
      <p>Dear <strong>${patientName}</strong>,</p>
      <p>This is a friendly reminder that you have an upcoming appointment:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedStart} – ${formattedEnd}</p>
        <p style="margin: 5px 0;"><strong>Clinic:</strong> ${clinicAddress}</p>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        Please arrive 10 minutes early. You can cancel or reschedule from your dashboard if needed.
      </p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"DoctorBooking" <${process.env.SMTP_USER}>`,
    to,
    subject: `🩺 Reminder: Appointment with Dr. ${doctorName} on ${formattedDate}`,
    html,
    text: `Appointment Reminder\n\nDoctor: Dr. ${doctorName}\nDate: ${formattedDate}\nTime: ${formattedStart} – ${formattedEnd}\nClinic: ${clinicAddress}`
  });
};


export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetLink: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f766e; margin-top: 0;">🔐 Reset your password</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}"
           style="display: inline-block; padding: 14px 28px; background: #0f766e; color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p style="color: #64748b; font-size: 14px;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        Or copy this URL into your browser:<br />
        <span style="word-break: break-all;">${resetLink}</span>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"DoctorBooking" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your password",
    html,
    text: `Reset your password\n\nHi ${name},\n\nClick this link to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, ignore this email.`,
  });
};
