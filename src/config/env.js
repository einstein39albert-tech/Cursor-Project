const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
require("dotenv").config({ path: path.join(rootDir, ".env"), quiet: true });

function getEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

const nodeEnv = getEnv("NODE_ENV", "development");

const env = {
  rootDir,
  port: Number.parseInt(getEnv("PORT", "3000"), 10),
  appName: getEnv(
    "APP_NAME",
    "Unified Operations, Reporting & Management System"
  ),
  baseUrl: getEnv("BASE_URL", "http://localhost:3000"),
  cookieName: getEnv("COOKIE_NAME", "uorms_session"),
  sessionTtlDays: Number.parseInt(getEnv("SESSION_TTL_DAYS", "7"), 10),
  defaultLocale: getEnv("DEFAULT_LOCALE", "en"),
  nodeEnv,
  authEnabled: getEnv("AUTH_ENABLED", nodeEnv === "production" ? "true" : "false") === "true",
  appSecret: getEnv(
    "APP_SECRET",
    "development-secret-change-this-before-deploying"
  ),
  secureCookies: getEnv("SECURE_COOKIES", "false") === "true",
  trustProxy: getEnv("TRUST_PROXY", "false") === "true",
  uploadDir: path.resolve(rootDir, getEnv("UPLOAD_DIR", "src/public/uploads")),
  databasePath: path.resolve(rootDir, getEnv("DATABASE_PATH", "data/uorms.sqlite")),
};

module.exports = env;
