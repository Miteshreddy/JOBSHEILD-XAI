const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const compression = require("compression");

const env = require("./config/env");
const swaggerSpec = require("./config/swagger");
const logger = require("./utils/logger");
const { attachUserIfPresent } = require("./middleware/auth");
const { generalLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const routes = require("./routes");

function createApp() {
  const app = express();

  app.set("trust proxy", env.trustProxy);

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.corsAllowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
  app.use(generalLimiter);
  app.use(attachUserIfPresent);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
