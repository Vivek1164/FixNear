import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = Number(process.env.PORT) || 4001;

async function startServer() {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is required");
  }

  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 characters");
  }

  await connectDB();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`FixNear User Service running on port ${PORT}`);
  });

  function shutdown(signal) {
    console.log(`${signal} received; shutting down`);

    server.close(async () => {
      try {
        const mongoose = await import("mongoose");
        await mongoose.default.disconnect();
        process.exit(0);
      } catch (error) {
        console.error("Shutdown failed", error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000).unref();
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Failed to start User Service:", error);
  process.exit(1);
});
