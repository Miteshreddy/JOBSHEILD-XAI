const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const env = require("./config/env");
const connectDatabase = require("./config/db");
const createApp = require("./app");
const logger = require("./utils/logger");

async function start() {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`Backend listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`API docs available at http://localhost:${env.port}/api-docs`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully.`);
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
