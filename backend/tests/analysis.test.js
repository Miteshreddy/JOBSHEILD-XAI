jest.mock("../utils/aiServiceClient");
jest.mock("../utils/urlScraper");

const request = require("supertest");
const createApp = require("../app");
const aiService = require("../utils/aiServiceClient");
const { scrapeUrl } = require("../utils/urlScraper");
const ApiError = require("../utils/ApiError");
const Analysis = require("../models/Analysis");
const { makeReport } = require("./fixtures");

const app = createApp();

describe("Analysis routes", () => {
  test("POST /analyze/text persists and returns the full report", async () => {
    aiService.analyzeText.mockResolvedValue(makeReport());

    const res = await request(app).post("/api/analyze/text").send({ text: "urgent hiring pay a fee" });

    expect(res.status).toBe(201);
    expect(aiService.analyzeText).toHaveBeenCalledWith("urgent hiring pay a fee");
    expect(res.body.verdict).toBe("fraudulent");
    expect(res.body.legitimacyScore).toBe(4);
    expect(res.body.checks).toHaveLength(1);
    expect(res.body.engine).toBeUndefined(); // internal diagnostics never leave the server

    const stored = await Analysis.findById(res.body._id);
    expect(stored.inputType).toBe("text");
    expect(stored.verdict).toBe("fraudulent");
  });

  test("GET /analyze/:id does not expose internal diagnostics", async () => {
    aiService.analyzeText.mockResolvedValue(makeReport());
    const created = await request(app).post("/api/analyze/text").send({ text: "some posting" });
    const res = await request(app).get(`/api/analyze/${created.body._id}`);
    expect(res.status).toBe(200);
    expect(res.body.engine).toBeUndefined();
  });

  test("POST /analyze/text rejects empty text", async () => {
    const res = await request(app).post("/api/analyze/text").send({ text: "   " });
    expect(res.status).toBe(422);
  });

  test("POST /analyze/url rejects a malformed URL", async () => {
    const res = await request(app).post("/api/analyze/url").send({ url: "not-a-url" });
    expect(res.status).toBe(422);
  });

  test("input errors from the analysis service are passed through", async () => {
    aiService.analyzeUrl.mockRejectedValue(new ApiError(422, "Analysis service error: could not extract the job description"));
    const res = await request(app).post("/api/analyze/url").send({ url: "https://example.com/job" });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/could not extract/i);
  });

  test("falls back to a clearly labelled basic analysis when the service is down", async () => {
    aiService.analyzeUrl.mockRejectedValue(new ApiError(503, "The analysis service is currently unavailable."));
    scrapeUrl.mockResolvedValue("Work from home data entry. Pay a registration fee of $50 to start. WhatsApp only.");

    const res = await request(app).post("/api/analyze/url").send({ url: "https://example.com/job" });

    expect(res.status).toBe(201);
    expect(res.body.verdict).toBe("fraudulent");
    expect(res.body.confidence).toBe("low");
    expect(res.body.checks[0].label).toBe("Limited analysis");
    expect(res.body.signals.reasoning.available).toBe(false);
  });

  test("screenshots need the analysis service (no silent fake result)", async () => {
    aiService.analyzeImage.mockRejectedValue(new ApiError(503, "unavailable"));
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4a00000000049454e44ae426082", "hex");
    const res = await request(app).post("/api/analyze/image").attach("file", png, { filename: "job.png", contentType: "image/png" });
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/paste the text/i);
  });

  test("GET /analyze/:id returns 404 for a non-existent id", async () => {
    const res = await request(app).get("/api/analyze/507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
  });

  test("GET /analyze/:id rejects a malformed id", async () => {
    const res = await request(app).get("/api/analyze/not-an-id");
    expect(res.status).toBe(422);
  });

  test("anonymous analyses (no userId) are readable by anyone with the id", async () => {
    aiService.analyzeText.mockResolvedValue(makeReport());
    const createRes = await request(app).post("/api/analyze/text").send({ text: "anonymous submission" });
    const getRes = await request(app).get(`/api/analyze/${createRes.body._id}`);
    expect(getRes.status).toBe(200);
  });
});
