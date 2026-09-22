jest.mock("../utils/aiServiceClient");

const request = require("supertest");
const createApp = require("../app");
const aiService = require("../utils/aiServiceClient");

const app = createApp();

const user = { name: "Riya Shah", email: "riya@example.com", password: "supersecret123" };

const baseAiResult = {
  extractedText: "text",
  fraudProbability: 0.1,
  predictionLabel: "legitimate",
  trustScore: 90,
  trustBand: "Highly Trustworthy",
  riskCategory: "Low",
  severityScore: 0,
  severityFlags: [],
  shapExplanation: {},
  limeExplanation: {},
  decision: { recommendation: "Appears trustworthy — perform normal verification.", warnings: [], verificationSuggestions: [] },
};

async function registerAndGetToken() {
  const res = await request(app).post("/api/auth/register").send(user);
  return res.body.accessToken;
}

describe("History routes", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/history");
    expect(res.status).toBe(401);
  });

  test("returns only the authenticated user's analyses, most recent first", async () => {
    const token = await registerAndGetToken();
    aiService.analyzeText
      .mockResolvedValueOnce({ ...baseAiResult, riskCategory: "Low" })
      .mockResolvedValueOnce({ ...baseAiResult, riskCategory: "High" });

    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "first" });
    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "second" });

    // Anonymous submission should never show up in this user's history
    aiService.analyzeText.mockResolvedValueOnce(baseAiResult);
    await request(app).post("/api/analyze/text").send({ text: "anonymous" });

    const res = await request(app).get("/api/history").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.analyses).toHaveLength(2);
    expect(res.body.analyses[0].riskCategory).toBe("High"); // most recent first
  });

  test("filters by riskCategory", async () => {
    const token = await registerAndGetToken();
    aiService.analyzeText
      .mockResolvedValueOnce({ ...baseAiResult, riskCategory: "Low" })
      .mockResolvedValueOnce({ ...baseAiResult, riskCategory: "Critical" });

    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "a" });
    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "b" });

    const res = await request(app)
      .get("/api/history?riskCategory=Critical")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.analyses).toHaveLength(1);
    expect(res.body.analyses[0].riskCategory).toBe("Critical");
  });
});
