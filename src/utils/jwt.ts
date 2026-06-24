//src/utils/jwt.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env"

type JwtPayload = {
  userId: string;
  email: string;
  role: string;
};

export const signToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret);
};
