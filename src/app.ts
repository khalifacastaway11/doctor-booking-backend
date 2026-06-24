//src/app.ts
import express from "express";
import cors from "cors";
import routes from "./routes";
import rateLimit from "express-rate-limit";
import logger from "./lib/logger"
import { errorHandler } from "./middleware/error.middleware";

const app = express();

//rate limiting
const globalLimiter=rateLimit({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 100, //limit each IP to 100 requests per windowMs
  standardHeaders:true,
  legacyHeaders:false,
  handler:(req,res)=>{
    logger.warn(`Rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      message:"Too many requests, please try again later."
    })
  }

})
app.use(globalLimiter)

//strict limiter for auth endpoints(login/register)
const authLimiter=rateLimit({
windowMs:15*60*1000,
max:10,
skipSuccessfulRequests:true,
handler:(req,res)=>{
  logger.warn(`Auth rate limit exceeded for IP ${req.ip}`);
  res.status(429).json({
    message:"Too many login attempts, please try again later."
  })
}
})
app.use("/api/auth", authLimiter);
const allowedOrigin=process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin:allowedOrigin,
  credentials: true,
}));
app.use(express.json());

//request logging
app.use((req,res,next)=>{
  logger.info(`${req.method} ${req.url}`, {ip:req.ip, userAgent:req.get("user-agent")})
  next()
})
//health check
app.get("/api/health", (_req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api", routes);

app.use(errorHandler);

export default app;
