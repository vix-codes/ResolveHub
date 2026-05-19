const request = require("supertest");
const app = require("../src/app");

describe("Health endpoint", () => {
  it("returns 200 and status message", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
  });
});

