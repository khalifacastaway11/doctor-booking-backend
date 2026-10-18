import { NextFunction, Request, Response } from "express";
import logger from "../lib/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  //  Only log primitive fields — never the full err/req/res objects
  logger.error("Unhandled error", {
    message: err?.message || "Unknown error",
    path: req.path,
    method: req.method,
    stack: err?.stack,
  });

  res.status(err.statusCode || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
};