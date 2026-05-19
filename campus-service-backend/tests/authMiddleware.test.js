const express = require("express");
const request = require("supertest");
const authMiddleware = require("../src/middlewares/authMiddleware");

const buildAppWithAuth = () => {
  const app = express();
  app.get("/protected", authMiddleware, (req, res) => {
    res.json({ ok: true });
  });
  return app;
};

describe("authMiddleware", () => {
  it("returns 401 with 'No token' when Authorization header is missing", async () => {
    const app = buildAppWithAuth();

    const res = await request(app).get("/protected");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "No token" });
  });
});

