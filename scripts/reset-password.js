#!/usr/bin/env node

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../src/config/database");

const username = process.argv[2];
const providedPassword = process.argv[3];

if (!username) {
  console.error("Usage: npm run reset-password -- <username> [new-password]");
  process.exit(1);
}

const user = db
  .prepare("SELECT id, username, full_name FROM users WHERE username = ?")
  .get(username);

if (!user) {
  console.error(`User not found: ${username}`);
  process.exit(1);
}

const newPassword =
  providedPassword ||
  crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);

if (newPassword.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const hash = bcrypt.hashSync(newPassword, 12);
db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
  hash,
  new Date().toISOString(),
  user.id
);

console.log(`Password updated for ${user.username} (${user.full_name})`);
console.log(`New password: ${newPassword}`);
