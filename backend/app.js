const fs = require("fs");
const path = require("path");
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

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          // Employer logos come from Google's favicon service; uploads preview as blob: URLs.
          "img-src": ["'self'", "data:", "blob:", "https://www.google.com", "https://*.gstatic.com"],
          // Served over plain http on localhost; upgrading would break assets in some browsers.
          "upgrade-insecure-requests": null,
        },
      },
    })
  );
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
  // Only the API is rate-limited — static website files must never count.
  app.use("/api", generalLimiter);
  app.use(attachUserIfPresent);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api", routes);

  // Serve the built website (frontend/dist) so one local URL hosts everything.
  const distDir = path.resolve(__dirname, "../frontend/dist");
  if (fs.existsSync(path.join(distDir, "index.html"))) {
    app.use(express.static(distDir, { index: false, maxAge: "1h" }));
    app.get(/^\/(?!api\/|api$|api-docs).*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
