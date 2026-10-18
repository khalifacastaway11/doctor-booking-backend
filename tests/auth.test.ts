import request from "supertest";
import app from "../src/app";
import { PATIENT, registerAndLogin } from "./helpers";

describe("Auth", () => {
  describe("POST /api/auth/register", () => {
    it("registers a new patient", async () => {
      const res = await request(app).post("/api/auth/register").send(PATIENT);

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({
        email: PATIENT.email,
        role: "PATIENT",
        timeZone: "Africa/Cairo",
      });
      expect(res.body.user.password).toBeUndefined(); // never leak
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...PATIENT, email: "not-an-email" });

      expect(res.status).toBe(422);
      expect(res.body.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "email" }),
        ])
      );
    });

    it("rejects missing timeZone", async () => {
      const { timeZone, ...noTz } = PATIENT;
      const res = await request(app).post("/api/auth/register").send(noTz);

      expect(res.status).toBe(422);
      expect(res.body.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "timeZone" }),
        ])
      );
    });

    it("rejects invalid timeZone", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...PATIENT, timeZone: "not-a-real-zone" });

      expect(res.status).toBe(422);
    });

    it("rejects duplicate email", async () => {
      await request(app).post("/api/auth/register").send(PATIENT);
      const res = await request(app).post("/api/auth/register").send(PATIENT);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already in use/i);
    });

    it("rejects short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...PATIENT, password: "123" });

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(PATIENT);
    });

    it("logs in with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: PATIENT.email, password: PATIENT.password });

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.body.user.email).toBe(PATIENT.email);
    });

    it("rejects wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: PATIENT.email, password: "wrongpassword" });

      expect(res.status).toBe(401);
    });

    it("rejects unknown email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@test.com", password: "password123" });

      expect(res.status).toBe(401);
    });

    it("rejects missing password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: PATIENT.email });

      expect(res.status).toBe(422);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without cookie", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns user with valid cookie", async () => {
      const { agent } = await registerAndLogin(app, PATIENT);
      const res = await agent.get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(PATIENT.email);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the auth cookie", async () => {
      const { agent } = await registerAndLogin(app, PATIENT);

      const logoutRes = await agent.post("/api/auth/logout");
      expect(logoutRes.status).toBe(200);

      const meRes = await agent.get("/api/auth/me");
      expect(meRes.status).toBe(401);
    });
  });
});