const request = require("supertest");
const createApp = require("../app");

const app = createApp();

const validUser = { name: "Jane Doe", email: "jane@example.com", password: "supersecret123" };

describe("Auth routes", () => {
  test("register creates a user and returns an access token", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);
  });

  test("register rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(409);
  });

  test("register rejects a short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, password: "short" });
    expect(res.status).toBe(422);
    expect(res.body.details).toBeDefined();
  });

  test("login succeeds with correct credentials", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  test("login rejects wrong password without leaking whether the email exists", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password.");
  });

  test("me requires authentication", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("me returns the current user when authenticated", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const token = registerRes.body.accessToken;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
  });

  test("refresh issues a new access token from the cookie", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const cookie = registerRes.headers["set-cookie"][0];

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  test("logout-all revokes the refresh token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(validUser);
    const cookie = registerRes.headers["set-cookie"][0];
    const token = registerRes.body.accessToken;

    await request(app).post("/api/auth/logout-all").set("Authorization", `Bearer ${token}`);

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});
