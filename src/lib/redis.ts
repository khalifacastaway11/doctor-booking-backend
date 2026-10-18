import Redis from "ioredis";
import logger from "./logger";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error("Redis connection failed after 10 retries");
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true,
  enableReadyCheck: false,
});

redis.on("error", (err) => {
  logger.warn("Redis error", { message: err.message });
});

redis.on("connect", () => {
  logger.info("✅ Redis connected");
});

export default redis;