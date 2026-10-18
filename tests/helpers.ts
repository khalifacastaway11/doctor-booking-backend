import request from "supertest";
import { Express } from "express";
import { prisma } from "../src/lib/prisma";

export const PATIENT = {
  name: "Test Patient",
  email: "patient@test.com",
  password: "password123",
  role: "PATIENT",
  timeZone: "Africa/Cairo",
};

export const DOCTOR = {
  name: "Test Doctor",
  email: "doctor@test.com",
  password: "password123",
  role: "DOCTOR",
  timeZone: "Africa/Cairo",
};

/**
 * Register a user and return an authenticated agent (cookie is set).
 */
export async function registerAndLogin(app: Express, user: typeof PATIENT) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/register").send(user);
  if (res.status !== 201) {
    throw new Error(`Register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body.user };
}

/**
 * Create a doctor profile for the logged-in doctor.
 */
export async function createDoctorProfile(agent: any) {
  const res = await agent.post("/api/doctors").send({
    speciality: "Cardiologist",
    bio: "Experienced cardiologist",
    clinicAddress: "123 Main St",
    city: "Cairo",
    price: 500,
  });
  if (res.status !== 201) {
    throw new Error(`Create profile failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.doctorProfile;
}

/**
 * Create a future slot for the logged-in doctor.
 */
export async function createSlot(agent: any, daysFromNow = 3) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dateStr = date.toISOString().split("T")[0];

  const res = await agent.post("/api/slots").send({
    date: dateStr,
    startTime: "10:00",
    endTime: "10:30",
  });

  if (res.status !== 201) {
    throw new Error(
      `Create slot failed: ${res.status} body=${JSON.stringify(res.body)} text=${res.text}`
    );
  }

  return res.body.slot;
}