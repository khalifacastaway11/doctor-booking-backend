import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // optional: enable retry strategy
  retryStrategy: (times) => {
    if (times > 10) {
      console.error("Redis connection failed after 10 retries");
      return null; // stop retrying
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
redis.on("connect", () => {
  console.log("✅ Redis connected");
});
export default redis;
// Quick connection test (optional)
redis.ping().then(() => {
  console.log("✅ Redis ping successful");
}).catch((err) => {
  console.warn("⚠️ Redis ping failed:", err.message);
});