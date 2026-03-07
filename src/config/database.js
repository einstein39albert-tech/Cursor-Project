const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const env = require("./env");

const dataDirectory = path.dirname(env.databasePath);
fs.mkdirSync(dataDirectory, { recursive: true });
fs.mkdirSync(env.uploadDir, { recursive: true });

const db = new Database(env.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      branch_level TEXT,
      branch_id INTEGER,
      locale TEXT NOT NULL DEFAULT 'en',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      csrf_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      parent_id INTEGER,
      staff_count INTEGER NOT NULL DEFAULT 0,
      target_plan REAL NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 100,
      contact_name TEXT,
      contact_job_title TEXT,
      contact_address TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      contact_telegram TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      uploaded_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      target_branch_id INTEGER,
      target_role TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      confirmed_by INTEGER,
      created_at TEXT NOT NULL,
      confirmed_at TEXT,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (target_branch_id) REFERENCES branches(id) ON DELETE SET NULL,
      FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS profile_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS profile_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_type_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (profile_type_id) REFERENCES profile_types(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_type_id INTEGER NOT NULL,
      data_json TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_type_id) REFERENCES profile_types(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS report_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS report_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      parent_id INTEGER,
      level INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      yearly_target REAL NOT NULL DEFAULT 0,
      today_performance REAL NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES report_indicators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

function seedSettings() {
  const now = new Date().toISOString();
  const defaultSettings = {
    organization: {
      name: env.appName,
      shortName: "UORMS",
      description:
        "Merged operations, communication, profile, file, and reporting platform.",
      address: "Addis Ababa, Ethiopia",
      phone: "+251-000-000-000",
      email: "info@example.gov.et",
      primaryColor: "#0b3b5c",
      accentColor: "#1b6b8f",
      enabledLocales: ["en", "am"],
      futureLocales: ["om", "sid", "aa", "so", "ti"],
    },
    coefficients: {
      daily: [14.28, 14.28, 14.28, 14.28, 14.28, 14.28, 14.32],
      weekly: [25, 25, 25, 25],
      monthly: [33.33, 33.33, 33.34],
      quarterly: [25, 25, 25, 25],
    },
  };

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
  `);

  Object.entries(defaultSettings).forEach(([key, value]) => {
    insertSetting.run({
      key,
      value: JSON.stringify(value),
      updated_at: now,
    });
  });
}

function seedUsers() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const users = [
    ["System Administrator", "admin@example.gov.et", "admin", "admin123", "system_admin"],
    ["Main Administrator", "mainadmin@example.gov.et", "mainadmin", "main123", "main_admin"],
    ["Regional Manager", "manager@example.gov.et", "manager", "manager123", "manager"],
    ["Operations Coordinator", "submanager@example.gov.et", "submanager", "sub123", "sub_manager"],
    ["Director", "director@example.gov.et", "director", "director123", "director"],
    ["Standard User", "user@example.gov.et", "user", "user123", "user"],
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (
      full_name, email, username, password_hash, role, locale, created_at, updated_at
    ) VALUES (
      @full_name, @email, @username, @password_hash, @role, @locale, @created_at, @updated_at
    )
  `);

  users.forEach(([fullName, email, username, password, role]) => {
    insertUser.run({
      full_name: fullName,
      email,
      username,
      password_hash: bcrypt.hashSync(password, 12),
      role,
      locale: env.defaultLocale,
      created_at: now,
      updated_at: now,
    });
  });
}

function seedBranches() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM branches").get().count;
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const adminId = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin")?.id;

  const insertBranch = db.prepare(`
    INSERT INTO branches (
      name, level, parent_id, staff_count, target_plan, percentage,
      contact_name, contact_job_title, contact_address, contact_phone,
      contact_email, contact_telegram, created_by, created_at, updated_at
    ) VALUES (
      @name, @level, @parent_id, @staff_count, @target_plan, @percentage,
      @contact_name, @contact_job_title, @contact_address, @contact_phone,
      @contact_email, @contact_telegram, @created_by, @created_at, @updated_at
    )
  `);

  insertBranch.run({
    name: "National Operations Office",
    level: "national",
    parent_id: null,
    staff_count: 120,
    target_plan: 1000,
    percentage: 100,
    contact_name: "National Coordinator",
    contact_job_title: "Head of Operations",
    contact_address: "Addis Ababa",
    contact_phone: "+251-911-111-111",
    contact_email: "national@example.gov.et",
    contact_telegram: "@national_ops",
    created_by: adminId,
    created_at: now,
    updated_at: now,
  });

  const parentId = db.prepare("SELECT id FROM branches LIMIT 1").get().id;
  [
    ["Addis Ababa Region", "regional", 55, 250, 25],
    ["Oromia Region", "regional", 70, 300, 30],
    ["Sidama Regional Office", "regional", 45, 180, 18],
  ].forEach(([name, level, staffCount, targetPlan, percentage]) => {
    insertBranch.run({
      name,
      level,
      parent_id: parentId,
      staff_count: staffCount,
      target_plan: targetPlan,
      percentage,
      contact_name: `${name} Lead`,
      contact_job_title: "Regional Manager",
      contact_address: name,
      contact_phone: "+251-900-000-000",
      contact_email: `${name.toLowerCase().replace(/[^a-z]+/g, "")}@example.gov.et`,
      contact_telegram: "",
      created_by: adminId,
      created_at: now,
      updated_at: now,
    });
  });
}

function seedProfiles() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM profile_types").get().count;
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const adminId = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin")?.id;

  const insertType = db.prepare(`
    INSERT INTO profile_types (name, description, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertField = db.prepare(`
    INSERT INTO profile_fields (profile_type_id, name, sort_order)
    VALUES (?, ?, ?)
  `);
  const insertEntry = db.prepare(`
    INSERT INTO profile_entries (profile_type_id, data_json, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertType.run(
    "Staff Register",
    "Internal employee and focal person registry.",
    adminId,
    now,
    now
  );

  const profileTypeId = result.lastInsertRowid;
  ["Name", "Employee ID", "Department", "Status"].forEach((fieldName, index) => {
    insertField.run(profileTypeId, fieldName, index);
  });

  insertEntry.run(
    profileTypeId,
    JSON.stringify({
      Name: "Sample Employee",
      "Employee ID": "EMP-001",
      Department: "Operations",
      Status: "Active",
    }),
    adminId,
    now,
    now
  );
}

function seedReports() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM report_templates").get().count;
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const adminId = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin")?.id;
  const insertTemplate = db.prepare(`
    INSERT INTO report_templates (name, description, created_by, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const insertIndicator = db.prepare(`
    INSERT INTO report_indicators (
      template_id, parent_id, level, title, yearly_target, today_performance, position, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const templateId = insertTemplate.run(
    "National Operations Scorecard",
    "Core operational and reporting metrics merged from the original prototypes.",
    adminId,
    now
  ).lastInsertRowid;

  const serviceRoot = insertIndicator.run(
    templateId,
    null,
    0,
    "Service Delivery",
    1000,
    0,
    0,
    now,
    now
  ).lastInsertRowid;
  const complianceRoot = insertIndicator.run(
    templateId,
    null,
    0,
    "Compliance and Oversight",
    600,
    0,
    1,
    now,
    now
  ).lastInsertRowid;

  [
    [serviceRoot, 1, "Cases Processed", 450, 90, 0],
    [serviceRoot, 1, "Files Digitized", 300, 40, 1],
    [serviceRoot, 1, "Branches Supported", 250, 20, 2],
    [complianceRoot, 1, "Audits Completed", 200, 15, 3],
    [complianceRoot, 1, "Issues Resolved", 250, 18, 4],
    [complianceRoot, 1, "Reports Submitted", 150, 12, 5],
  ].forEach(([parentId, level, title, target, todayPerformance, position]) => {
    insertIndicator.run(
      templateId,
      parentId,
      level,
      title,
      target,
      todayPerformance,
      position,
      now,
      now
    );
  });
}

function initializeDatabase() {
  migrate();
  seedSettings();
  seedUsers();
  seedBranches();
  seedProfiles();
  seedReports();
}

initializeDatabase();

module.exports = db;
