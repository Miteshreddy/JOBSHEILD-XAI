jest.mock("../utils/aiServiceClient");

const request = require("supertest");
const createApp = require("../app");
const aiService = require("../utils/aiServiceClient");

const app = createApp();

const user = { name: "Riya Shah", email: "riya@example.com", password: "supersecret123" };

const { makeReport } = require("./fixtures");

const baseAiResult = makeReport({ verdict: "legitimate", legitimacyScore: 92, riskCategory: "Low" });

async function registerAndGetToken() {
  const res = await request(app).post("/api/auth/register").send(user);
  return res.body.accessToken;
}

describe("History routes", () => {
  test("ignores unknown verdict filters instead of erroring", async () => {
    const token = await registerAndGetToken();
    const res = await request(app).get("/api/history?verdict[$ne]=x").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test("requires authentication", async () => {
    const res = await request(app).get("/api/history");
    expect(res.status).toBe(401);
  });

  test("returns only the authenticated user's analyses, most recent first", async () => {
    const token = await registerAndGetToken();
    aiService.analyzeText
      .mockResolvedValueOnce({ ...baseAiResult, verdict: "legitimate" })
      .mockResolvedValueOnce({ ...baseAiResult, verdict: "fraudulent", legitimacyScore: 5 });

    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "first" });
    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "second" });

    // Anonymous submission should never show up in this user's history
    aiService.analyzeText.mockResolvedValueOnce(baseAiResult);
    await request(app).post("/api/analyze/text").send({ text: "anonymous" });

    const res = await request(app).get("/api/history").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.analyses).toHaveLength(2);
    expect(res.body.analyses[0].verdict).toBe("fraudulent"); // most recent first
  });

  test("filters by riskCategory", async () => {
    const token = await registerAndGetToken();
    aiService.analyzeText
      .mockResolvedValueOnce({ ...baseAiResult, riskCategory: "Low" })
      .mockResolvedValueOnce({ ...baseAiResult, verdict: "fraudulent", legitimacyScore: 3 });

    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "a" });
    await request(app).post("/api/analyze/text").set("Authorization", `Bearer ${token}`).send({ text: "b" });

    const res = await request(app)
      .get("/api/history?verdict=fraudulent")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.analyses).toHaveLength(1);
    expect(res.body.analyses[0].verdict).toBe("fraudulent");
    expect(res.body.analyses[0].extractedText).toBeUndefined(); // list view stays light
  });
});
