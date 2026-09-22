jest.mock("../utils/aiServiceClient");

const request = require("supertest");
const createApp = require("../app");
const aiService = require("../utils/aiServiceClient");
const User = require("../models/User");

const app = createApp();

async function registerUser(overrides = {}) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test User", email: "user@example.com", password: "supersecret123", ...overrides });
  return res.body;
}

describe("Admin routes", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  test("requires the admin role", async () => {
    const { accessToken } = await registerUser();
    const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  test("returns aggregate stats for an admin", async () => {
    const { user } = await registerUser();
    await User.findByIdAndUpdate(user._id, { role: "admin" });
    // The JWT already issued still carries the old "user" role claim (roles
    // are embedded at issuance, not looked up per-request) — log in again to
    // get a fresh token reflecting the promotion, exactly as a real admin
    // promotion would require the affected user's next login/refresh.
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "supersecret123" });
    const accessToken = loginRes.body.accessToken;

    aiService.analyzeText.mockResolvedValue({
      extractedText: "text",
      fraudProbability: 0.9,
      predictionLabel: "fraudulent",
      trustScore: 10,
      trustBand: "Very Low Trust",
      riskCategory: "Critical",
      severityScore: 90,
      severityFlags: [],
      shapExplanation: {},
      limeExplanation: {},
      decision: { recommendation: "Do NOT apply.", warnings: [], verificationSuggestions: [] },
    });
    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${accessToken}`).send({ text: "x" });

    const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(1);
    expect(res.body.totalAnalyses).toBe(1);
    expect(res.body.riskCategoryCounts.Critical).toBe(1);
  });

  test("lists users for an admin", async () => {
    const { user } = await registerUser();
    await User.findByIdAndUpdate(user._id, { role: "admin" });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "supersecret123" });
    const accessToken = loginRes.body.accessToken;

    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].passwordHash).toBeUndefined();
  });
});
