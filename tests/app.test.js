const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = "/tmp/uorms-test.sqlite";
process.env.UPLOAD_DIR = "/tmp/uorms-test-uploads";

fs.rmSync(process.env.DATABASE_PATH, { force: true });
fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });

const request = require("supertest");
const app = require("../src/app");

test("public homepage loads", async () => {
  const response = await request(app).get("/");
  assert.equal(response.statusCode, 200);
  assert.match(response.text, /Unified Operations, Reporting &amp; Management System/);
});

test("health endpoint returns ok payload", async () => {
  const response = await request(app).get("/health");
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ok");
});

test("protected dashboard redirects anonymous users to login", async () => {
  const response = await request(app).get("/dashboard");
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "/login");
});

test("seeded admin can log in and load dashboard", async () => {
  const agent = request.agent(app);

  const loginResponse = await agent
    .post("/login")
    .type("form")
    .send({ username: "admin", password: "admin123", locale: "en" });

  assert.equal(loginResponse.statusCode, 302);
  assert.equal(loginResponse.headers.location, "/dashboard");

  const dashboardResponse = await agent.get("/dashboard");
  assert.equal(dashboardResponse.statusCode, 200);
  assert.match(dashboardResponse.text, /Welcome back/);
  assert.match(dashboardResponse.text, /Branch snapshot/);
});
