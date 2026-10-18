import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

export default async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST!;

  console.log(" Setting up test database...");

  execSync("npx prisma migrate reset --force", {
    env: { ...process.env },
    stdio: "inherit",
  });

  console.log("Test database ready");
};