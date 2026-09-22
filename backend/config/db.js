const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

let memoryServer = null;

async function connectDatabase() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 2000 });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    if (env.nodeEnv !== "production") {
      logger.warn(`Could not connect to standalone MongoDB at ${env.mongodbUri}: ${err.message}`);
      logger.info("Initializing in-memory MongoDB (MongoMemoryServer) for local development...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      await mongoose.connect(uri);
      logger.info(`In-memory MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    } else {
      throw err;
    }
  }

  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}

module.exports = connectDatabase;

