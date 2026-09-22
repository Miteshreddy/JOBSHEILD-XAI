const request = require("supertest");

/** Regression: found by actually running the backend behind nginx in
 * docker-compose. With `trust proxy` unset, express-rate-limit throws
 * ERR_ERL_UNEXPECTED_X_FORWARDED_FOR as soon as any request carries an
 * X-Forwarded-For header — exactly what nginx always adds — turning every
 * request into a 500. `env.trustProxy` (TRUST_PROXY) controls this per
 * deployment; see backend/config/env.js and docker-compose.yml. */
describe("trust proxy configuration", () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.TRUST_PROXY;
  });

  test("with TRUST_PROXY=0 (default/local dev), a request with no forwarded header succeeds", async () => {
    process.env.TRUST_PROXY = "0";
    jest.resetModules();
    const createApp = require("../app");
    const app = createApp();

    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });

  test("with TRUST_PROXY=1 (behind nginx), a request carrying X-Forwarded-For does not 500", async () => {
    process.env.TRUST_PROXY = "1";
    jest.resetModules();
    const createApp = require("../app");
    const app = createApp();

    const res = await request(app).get("/api/health").set("X-Forwarded-For", "203.0.113.5");
    expect(res.status).toBe(200);
  });
});
