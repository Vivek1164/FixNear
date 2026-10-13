import app from "./app.js";

const PORT = Number(process.env.PORT) || 4000;
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`FixNear API Gateway running on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Closing gateway...`);

  server.close((error) => {
    if (error) {
      console.error("Error during shutdown:", error);
      process.exitCode = 1;
      return;
    }

    console.log("Gateway closed gracefully.");
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
