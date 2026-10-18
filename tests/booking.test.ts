import request from "supertest";
import app from "../src/app";
import {
  PATIENT,
  DOCTOR,
  registerAndLogin,
  createDoctorProfile,
  createSlot,
} from "./helpers";

describe("Booking flow", () => {
  let doctorAgent: any;
  let patientAgent: any;
  let slot: any;

  beforeEach(async () => {
    // 1. Doctor registers, creates profile, creates a slot
    const { agent: dAgent } = await registerAndLogin(app, DOCTOR);
    doctorAgent = dAgent;
    await createDoctorProfile(doctorAgent);
    slot = await createSlot(doctorAgent);

    // 2. Patient registers
    const { agent: pAgent } = await registerAndLogin(app, PATIENT);
    patientAgent = pAgent;
  });

  describe("POST /api/appointments (book)", () => {
    it("books an available slot", async () => {
      const res = await patientAgent
        .post("/api/appointments")
        .send({ slotId: slot.id, notes: "Routine checkup" });

      expect(res.status).toBe(201);
      expect(res.body.appointment.status).toBe("BOOKED");
      expect(res.body.appointment.slotId).toBe(slot.id);
    });

    it("rejects booking without auth", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .send({ slotId: slot.id });

      expect(res.status).toBe(401);
    });

    it("rejects booking a booked slot", async () => {
      // Book once
      await patientAgent.post("/api/appointments").send({ slotId: slot.id });

      // Register second patient and try to book same slot
      const { agent: p2 } = await registerAndLogin(app, {
        ...PATIENT,
        email: "patient2@test.com",
      });
      const res = await p2.post("/api/appointments").send({ slotId: slot.id });

      expect(res.status).toBe(409);
    });

    it("rejects booking with invalid slotId", async () => {
      const res = await patientAgent
        .post("/api/appointments")
        .send({ slotId: "not-a-uuid" });

      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/appointments/my", () => {
    it("returns patient's bookings", async () => {
      await patientAgent.post("/api/appointments").send({ slotId: slot.id });

      const res = await patientAgent.get("/api/appointments/my?page=1&limit=20");

      expect(res.status).toBe(200);
      expect(res.body.appointments).toHaveLength(1);
      expect(res.body.appointments[0].slot.id).toBe(slot.id);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe("GET /api/appointments/doctor", () => {
    it("returns doctor's bookings with patient info", async () => {
      await patientAgent.post("/api/appointments").send({ slotId: slot.id });

      const res = await doctorAgent.get("/api/appointments/doctor?page=1&limit=20");

      expect(res.status).toBe(200);
      expect(res.body.appointments).toHaveLength(1);
      expect(res.body.appointments[0].patient.email).toBe(PATIENT.email);
    });

    it("rejects access by a patient", async () => {
      const res = await patientAgent.get("/api/appointments/doctor");
      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/appointments/:id/cancel", () => {
    it("patient can cancel own appointment", async () => {
      const bookRes = await patientAgent
        .post("/api/appointments")
        .send({ slotId: slot.id });
      const aptId = bookRes.body.appointment.id;

      const res = await patientAgent.patch(`/api/appointments/${aptId}/cancel`);
      expect(res.status).toBe(200);

      // Slot should be available again
      const doctorsRes = await request(app).get(`/api/doctors/${slot.doctorId}`);
      const foundSlot = doctorsRes.body.doctor.slots.find(
        (s: any) => s.id === slot.id
      );
      expect(foundSlot).toBeDefined();
    });

    it("patient can't cancel someone else's appointment", async () => {
      const bookRes = await patientAgent
        .post("/api/appointments")
        .send({ slotId: slot.id });
      const aptId = bookRes.body.appointment.id;

      const { agent: p2 } = await registerAndLogin(app, {
        ...PATIENT,
        email: "patient2@test.com",
      });

      const res = await p2.patch(`/api/appointments/${aptId}/cancel`);
      expect(res.status).toBe(403);
    });

    it("doctor can cancel their own appointment", async () => {
      const bookRes = await patientAgent
        .post("/api/appointments")
        .send({ slotId: slot.id });
      const aptId = bookRes.body.appointment.id;

      const res = await doctorAgent.patch(`/api/appointments/${aptId}/cancel`);
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/appointments/:id/complete", () => {
    it("doctor marks appointment as completed", async () => {
      const bookRes = await patientAgent
        .post("/api/appointments")
        .send({ slotId: slot.id });
      const aptId = bookRes.body.appointment.id;

      const res = await doctorAgent.patch(
        `/api/appointments/${aptId}/complete`
      );
      expect(res.status).toBe(200);
      expect(res.body.appointment.status).toBe("COMPLETED");
    });

    it("patient can't complete an appointment", async () => {
      const bookRes = await patientAgent
        .post("/api/appointments")
        .send({ slotId: slot.id });
      const aptId = bookRes.body.appointment.id;

      const res = await patientAgent.patch(
        `/api/appointments/${aptId}/complete`
      );
      expect(res.status).toBe(403);
    });

    it("can't complete an already completed appointment", async () => {
      const bookRes = await patientAgent
        .post("/api/appointments")
        .send({ slotId: slot.id });
      const aptId = bookRes.body.appointment.id;

      await doctorAgent.patch(`/api/appointments/${aptId}/complete`);
      const res = await doctorAgent.patch(
        `/api/appointments/${aptId}/complete`
      );

      expect(res.status).toBe(400);
    });
  });
});