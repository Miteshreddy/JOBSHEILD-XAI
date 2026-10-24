const fs = require("fs");
const path = require("path");
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
      // Embedded MongoDB stored on disk (backend/.data/db), so accounts and
      // history survive restarts without installing MongoDB separately.
      const dbPath = process.env.EMBEDDED_DB_PATH || path.resolve(__dirname, "../.data/db");
      fs.mkdirSync(dbPath, { recursive: true });
      logger.info(`Starting embedded MongoDB (data in ${dbPath})...`);
      const { MongoMemoryServer } = require("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: "wiredTiger" } });
      const uri = memoryServer.getUri("jobshield");
      await mongoose.connect(uri);
      logger.info(`Embedded MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
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

