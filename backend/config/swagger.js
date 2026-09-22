const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Explainable Fake Job Detection — Backend API",
      version: "1.0.0",
      description:
        "Node.js/Express backend: authentication, request validation, and orchestration of " +
        "calls to the Python AI service (SRS Section 5.2, Module 10).",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: [path.join(__dirname, "..", "routes", "*.js")],
};

module.exports = swaggerJsdoc(options);
