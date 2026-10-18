import dotenv from "dotenv";
dotenv.config();

//  Force test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST!;
process.env.JWT_SECRET = "test-jwt-secret-do-not-use-in-prod";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL_TEST must be set in .env");
}