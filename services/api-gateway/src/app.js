import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { requestLogger } from "./middleware/requestLogger.js";
import proxyRoutes from "./routes/proxyRoutes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  }),
);

app.use(requestLogger);

// Gateway's own health endpoint.
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "FixNear API Gateway",
    status: "healthy",
  });
});

// All downstream proxy routes must be registered before the 404.
app.use(proxyRoutes);

// Parse bodies only for routes handled locally.
// This avoids consuming proxied request bodies before forwarding.
app.use(express.json({ limit: "1mb" }));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Gateway route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Gateway error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : "Internal gateway error",
  });
});

export default app;
