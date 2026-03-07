const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const env = require("../config/env");
const { requireAuth, requirePermission } = require("../middleware/auth");
const { setFlash } = require("../middleware/context");
const { logAction } = require("../services/auditService");
const {
  getOverviewStats,
  getOrganizationSettings,
  getCoefficientSettings,
  getRecentActivity,
  getReportTemplatesWithIndicators,
} = require("../services/dashboardService");
const { formatBytes, parseJson } = require("../utils/helpers");

const router = express.Router();

const storage = multer.diskStorage({
  destination: env.uploadDir,
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    )}`;
    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

function validationFailed(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return false;
  }

  setFlash(res, {
    type: "error",
    message: errors
      .array()
      .map((error) => error.msg)
      .join(" "),
  });
  return true;
}

function getBranches() {
  return db
    .prepare(
      `
      SELECT branches.*, parent.name AS parent_name
      FROM branches
      LEFT JOIN branches AS parent ON parent.id = branches.parent_id
      ORDER BY branches.level, branches.name
    `
    )
    .all();
}

function getFiles() {
  return db
    .prepare(
      `
      SELECT files.*, users.full_name AS uploaded_by_name
      FROM files
      LEFT JOIN users ON users.id = files.uploaded_by
      ORDER BY files.created_at DESC
    `
    )
    .all()
    .map((file) => ({
      ...file,
      formattedSize: formatBytes(file.size_bytes),
    }));
}

function getMessages() {
  return db
    .prepare(
      `
      SELECT messages.*, users.full_name AS sender_name, branches.name AS target_branch_name
      FROM messages
      LEFT JOIN users ON users.id = messages.sender_id
      LEFT JOIN branches ON branches.id = messages.target_branch_id
      ORDER BY messages.created_at DESC
    `
    )
    .all();
}

function getProfileTypes() {
  const types = db
    .prepare(
      `
      SELECT profile_types.*,
             (SELECT COUNT(*) FROM profile_entries WHERE profile_entries.profile_type_id = profile_types.id) AS entry_count
      FROM profile_types
      ORDER BY profile_types.name ASC
    `
    )
    .all();

  return types.map((type) => {
    const fields = db
      .prepare(
        "SELECT * FROM profile_fields WHERE profile_type_id = ? ORDER BY sort_order ASC, id ASC"
      )
      .all(type.id);
    const entries = db
      .prepare(
        "SELECT * FROM profile_entries WHERE profile_type_id = ? ORDER BY created_at DESC LIMIT 10"
      )
      .all(type.id)
      .map((entry) => ({
        ...entry,
        data: parseJson(entry.data_json, {}),
      }));

    return {
      ...type,
      fields,
      entries,
    };
  });
}

function getUsers() {
  return db
    .prepare(
      `
      SELECT users.*, branches.name AS branch_name
      FROM users
      LEFT JOIN branches ON branches.id = users.branch_id
      ORDER BY users.created_at DESC
    `
    )
    .all();
}

function renderModule(res, view, pageTitle, extra = {}) {
  res.render(view, {
    pageTitle,
    organization: getOrganizationSettings(),
    stats: getOverviewStats(),
    recentActivity: getRecentActivity(),
    ...extra,
  });
}

router.use(requireAuth);

router.get("/dashboard", (req, res) => {
  renderModule(res, "dashboard/index", res.locals.t("dashboard.overview"), {
    branches: getBranches(),
    files: getFiles().slice(0, 5),
    messages: getMessages().slice(0, 5),
    reports: getReportTemplatesWithIndicators(),
  });
});

router.get("/dashboard/branches", (req, res) => {
  renderModule(res, "modules/branches", res.locals.t("nav.branches"), {
    branches: getBranches(),
  });
});

router.post(
  "/dashboard/branches",
  requirePermission("manage_branches"),
  body("name").trim().notEmpty().withMessage("Branch name is required."),
  body("level").trim().notEmpty().withMessage("Branch level is required."),
  (req, res) => {
    if (validationFailed(req, res)) {
      return res.redirect("/dashboard/branches");
    }

    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO branches (
        name, level, parent_id, staff_count, target_plan, percentage,
        contact_name, contact_job_title, contact_address, contact_phone,
        contact_email, contact_telegram, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      req.body.name,
      req.body.level,
      req.body.parent_id || null,
      Number.parseInt(req.body.staff_count || "0", 10),
      Number.parseFloat(req.body.target_plan || "0"),
      Number.parseFloat(req.body.percentage || "100"),
      req.body.contact_name || "",
      req.body.contact_job_title || "",
      req.body.contact_address || "",
      req.body.contact_phone || "",
      req.body.contact_email || "",
      req.body.contact_telegram || "",
      req.currentUser.id,
      now,
      now
    );

    logAction({
      userId: req.currentUser.id,
      action: "create_branch",
      entityType: "branch",
      entityId: req.body.name,
      details: req.body,
      request: req,
    });
    setFlash(res, { type: "success", message: "Branch created successfully." });
    return res.redirect("/dashboard/branches");
  }
);

router.post(
  "/dashboard/branches/:id/delete",
  requirePermission("manage_branches"),
  (req, res) => {
    db.prepare("DELETE FROM branches WHERE id = ?").run(req.params.id);
    logAction({
      userId: req.currentUser.id,
      action: "delete_branch",
      entityType: "branch",
      entityId: req.params.id,
      request: req,
    });
    setFlash(res, { type: "success", message: "Branch removed." });
    return res.redirect("/dashboard/branches");
  }
);

router.get("/dashboard/files", (req, res) => {
  renderModule(res, "modules/files", res.locals.t("nav.files"), {
    files: getFiles(),
  });
});

router.post(
  "/dashboard/files/upload",
  requirePermission("manage_files"),
  upload.single("uploaded_file"),
  (req, res) => {
    if (!req.file) {
      setFlash(res, { type: "error", message: "Please choose a file to upload." });
      return res.redirect("/dashboard/files");
    }

    const category = req.file.mimetype.startsWith("image/")
      ? "image"
      : req.file.mimetype.startsWith("video/")
        ? "video"
        : "document";

    db.prepare(
      `
      INSERT INTO files (
        original_name, stored_name, mime_type, size_bytes, category, uploaded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      category,
      req.currentUser.id,
      new Date().toISOString()
    );

    logAction({
      userId: req.currentUser.id,
      action: "upload_file",
      entityType: "file",
      entityId: req.file.originalname,
      request: req,
    });
    setFlash(res, { type: "success", message: "File uploaded successfully." });
    return res.redirect("/dashboard/files");
  }
);

router.post(
  "/dashboard/files/:id/pin",
  requirePermission("manage_files"),
  (req, res) => {
    const file = db.prepare("SELECT pinned FROM files WHERE id = ?").get(req.params.id);
    db.prepare("UPDATE files SET pinned = ? WHERE id = ?").run(file?.pinned ? 0 : 1, req.params.id);
    setFlash(res, { type: "success", message: "File pin state updated." });
    return res.redirect("/dashboard/files");
  }
);

router.post(
  "/dashboard/files/:id/delete",
  requirePermission("manage_files"),
  (req, res) => {
    const file = db.prepare("SELECT * FROM files WHERE id = ?").get(req.params.id);
    if (file) {
      const filePath = path.join(env.uploadDir, file.stored_name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      db.prepare("DELETE FROM files WHERE id = ?").run(req.params.id);
    }
    setFlash(res, { type: "success", message: "File deleted." });
    return res.redirect("/dashboard/files");
  }
);

router.get("/dashboard/messages", (req, res) => {
  renderModule(res, "modules/messages", res.locals.t("nav.messages"), {
    messages: getMessages(),
    branches: getBranches(),
  });
});

router.post(
  "/dashboard/messages",
  requirePermission("manage_messages"),
  body("content").trim().notEmpty().withMessage("Message content is required."),
  (req, res) => {
    if (validationFailed(req, res)) {
      return res.redirect("/dashboard/messages");
    }

    db.prepare(
      `
      INSERT INTO messages (
        channel, sender_id, target_branch_id, target_role, content, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      req.body.channel || "internal",
      req.currentUser.id,
      req.body.target_branch_id || null,
      req.body.target_role || null,
      req.body.content,
      req.body.channel === "vertical" ? "pending" : "sent",
      new Date().toISOString()
    );

    setFlash(res, { type: "success", message: "Message sent successfully." });
    return res.redirect("/dashboard/messages");
  }
);

router.post(
  "/dashboard/messages/:id/confirm",
  requirePermission("manage_messages"),
  (req, res) => {
    db.prepare(
      "UPDATE messages SET status = 'confirmed', confirmed_by = ?, confirmed_at = ? WHERE id = ?"
    ).run(req.currentUser.id, new Date().toISOString(), req.params.id);
    setFlash(res, { type: "success", message: "Message confirmed." });
    return res.redirect("/dashboard/messages");
  }
);

router.get("/dashboard/profiles", (req, res) => {
  renderModule(res, "modules/profiles", res.locals.t("nav.profiles"), {
    profileTypes: getProfileTypes(),
  });
});

router.post(
  "/dashboard/profiles/types",
  requirePermission("manage_profiles"),
  body("name").trim().notEmpty().withMessage("Profile type name is required."),
  (req, res) => {
    if (validationFailed(req, res)) {
      return res.redirect("/dashboard/profiles");
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `
        INSERT INTO profile_types (name, description, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .run(req.body.name, req.body.description || "", req.currentUser.id, now, now);

    const fieldNames = String(req.body.fields || "")
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    const insertField = db.prepare(
      "INSERT INTO profile_fields (profile_type_id, name, sort_order) VALUES (?, ?, ?)"
    );
    fieldNames.forEach((fieldName, index) => {
      insertField.run(result.lastInsertRowid, fieldName, index);
    });

    setFlash(res, { type: "success", message: "Profile type created." });
    return res.redirect("/dashboard/profiles");
  }
);

router.post(
  "/dashboard/profiles/types/:id/fields",
  requirePermission("manage_profiles"),
  body("field_name").trim().notEmpty().withMessage("Field name is required."),
  (req, res) => {
    if (validationFailed(req, res)) {
      return res.redirect("/dashboard/profiles");
    }

    const sortOrder =
      db
        .prepare(
          "SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM profile_fields WHERE profile_type_id = ?"
        )
        .get(req.params.id).max_sort_order + 1;

    db.prepare(
      "INSERT INTO profile_fields (profile_type_id, name, sort_order) VALUES (?, ?, ?)"
    ).run(req.params.id, req.body.field_name, sortOrder);
    setFlash(res, { type: "success", message: "Profile field added." });
    return res.redirect("/dashboard/profiles");
  }
);

router.post(
  "/dashboard/profiles/types/:id/entries",
  requirePermission("manage_profiles"),
  (req, res) => {
    const fields = db
      .prepare(
        "SELECT * FROM profile_fields WHERE profile_type_id = ? ORDER BY sort_order ASC, id ASC"
      )
      .all(req.params.id);
    const payload = {};

    fields.forEach((field) => {
      payload[field.name] = req.body[`field_${field.id}`] || "";
    });

    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO profile_entries (profile_type_id, data_json, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(req.params.id, JSON.stringify(payload), req.currentUser.id, now, now);
    setFlash(res, { type: "success", message: "Profile entry saved." });
    return res.redirect("/dashboard/profiles");
  }
);

router.get("/dashboard/reports", (req, res) => {
  const templates = getReportTemplatesWithIndicators();
  const chartPayload = templates[0]
    ? templates[0].indicators
        .filter((indicator) => indicator.level > 0)
        .map((indicator) => ({
          label: indicator.title,
          yearlyTarget: indicator.metrics.yearlyTarget,
          todayPerformance: indicator.metrics.todayPerformance,
          yearlyEfficiency: indicator.metrics.yearlyEfficiency,
        }))
    : [];

  renderModule(res, "modules/reports", res.locals.t("nav.reports"), {
    templates,
    coefficients: getCoefficientSettings(),
    reportChartData: JSON.stringify(chartPayload),
  });
});

router.post(
  "/dashboard/reports/templates",
  requirePermission("manage_reports"),
  body("name").trim().notEmpty().withMessage("Template name is required."),
  (req, res) => {
    if (validationFailed(req, res)) {
      return res.redirect("/dashboard/reports");
    }

    db.prepare(
      "INSERT INTO report_templates (name, description, created_by, created_at) VALUES (?, ?, ?, ?)"
    ).run(
      req.body.name,
      req.body.description || "",
      req.currentUser.id,
      new Date().toISOString()
    );
    setFlash(res, { type: "success", message: "Report template created." });
    return res.redirect("/dashboard/reports");
  }
);

router.post(
  "/dashboard/reports/indicators",
  requirePermission("manage_reports"),
  body("title").trim().notEmpty().withMessage("Indicator title is required."),
  (req, res) => {
    if (validationFailed(req, res)) {
      return res.redirect("/dashboard/reports");
    }

    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO report_indicators (
        template_id, parent_id, level, title, yearly_target, today_performance, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      req.body.template_id,
      req.body.parent_id || null,
      Number.parseInt(req.body.level || "0", 10),
      req.body.title,
      Number.parseFloat(req.body.yearly_target || "0"),
      Number.parseFloat(req.body.today_performance || "0"),
      Number.parseInt(req.body.position || "0", 10),
      now,
      now
    );
    setFlash(res, { type: "success", message: "Report indicator added." });
    return res.redirect("/dashboard/reports");
  }
);

router.post(
  "/dashboard/reports/indicators/:id/update",
  requirePermission("manage_reports"),
  (req, res) => {
    db.prepare(
      `
      UPDATE report_indicators
      SET yearly_target = ?, today_performance = ?, updated_at = ?
      WHERE id = ?
    `
    ).run(
      Number.parseFloat(req.body.yearly_target || "0"),
      Number.parseFloat(req.body.today_performance || "0"),
      new Date().toISOString(),
      req.params.id
    );
    setFlash(res, { type: "success", message: "Indicator updated." });
    return res.redirect("/dashboard/reports");
  }
);

router.get("/dashboard/users", requirePermission("manage_users"), (req, res) => {
  renderModule(res, "modules/users", res.locals.t("nav.users"), {
    users: getUsers(),
    branches: getBranches(),
  });
});

router.post(
  "/dashboard/users",
  requirePermission("manage_users"),
  body("full_name").trim().notEmpty().withMessage("Full name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("username").trim().notEmpty().withMessage("Username is required."),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  (req, res) => {
    if (validationFailed(req, res)) {
      return res.redirect("/dashboard/users");
    }

    const bcrypt = require("bcryptjs");
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO users (
        full_name, email, username, password_hash, role, branch_id, branch_level, locale, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      req.body.full_name,
      req.body.email,
      req.body.username,
      bcrypt.hashSync(req.body.password, 12),
      req.body.role,
      req.body.branch_id || null,
      req.body.branch_level || null,
      req.body.locale || "en",
      now,
      now
    );
    setFlash(res, { type: "success", message: "User account created." });
    return res.redirect("/dashboard/users");
  }
);

router.get("/dashboard/settings", requirePermission("manage_settings"), (req, res) => {
  renderModule(res, "modules/settings", res.locals.t("nav.settings"), {
    organization: getOrganizationSettings(),
    coefficients: getCoefficientSettings(),
    recentActivity: getRecentActivity(),
  });
});

router.post("/dashboard/settings/organization", requirePermission("manage_settings"), (req, res) => {
  const payload = {
    name: req.body.name || env.appName,
    shortName: req.body.shortName || "UORMS",
    description: req.body.description || "",
    address: req.body.address || "",
    phone: req.body.phone || "",
    email: req.body.email || "",
    primaryColor: req.body.primaryColor || "#0b3b5c",
    accentColor: req.body.accentColor || "#1b6b8f",
    enabledLocales: ["en", "am"],
    futureLocales: ["om", "sid", "aa", "so", "ti"],
  };
  db.prepare("UPDATE settings SET value = ?, updated_at = ? WHERE key = ?").run(
    JSON.stringify(payload),
    new Date().toISOString(),
    "organization"
  );
  setFlash(res, { type: "success", message: "Organization settings saved." });
  return res.redirect("/dashboard/settings");
});

router.post("/dashboard/settings/coefficients", requirePermission("manage_settings"), (req, res) => {
  const parseList = (value) =>
    String(value || "")
      .split(",")
      .map((item) => Number.parseFloat(item.trim()))
      .filter((item) => !Number.isNaN(item));

  const payload = {
    daily: parseList(req.body.daily).slice(0, 7),
    weekly: parseList(req.body.weekly).slice(0, 4),
    monthly: parseList(req.body.monthly).slice(0, 3),
    quarterly: parseList(req.body.quarterly).slice(0, 4),
  };
  db.prepare("UPDATE settings SET value = ?, updated_at = ? WHERE key = ?").run(
    JSON.stringify(payload),
    new Date().toISOString(),
    "coefficients"
  );
  setFlash(res, { type: "success", message: "Coefficient settings saved." });
  return res.redirect("/dashboard/settings");
});

module.exports = router;
