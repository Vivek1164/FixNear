import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

// Parse incoming JSON request bodies
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "FixNear API Gateway",
    message: "API Gateway is running",
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FixNear API Gateway running on http://localhost:${PORT}`);
});
