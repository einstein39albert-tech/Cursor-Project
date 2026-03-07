const crypto = require("crypto");
const db = require("../config/database");
const env = require("../config/env");
const { logAction } = require("../services/auditService");

const permissions = {
  system_admin: ["all"],
  main_admin: [
    "view_dashboard",
    "manage_branches",
    "manage_files",
    "manage_messages",
    "manage_profiles",
    "manage_reports",
    "manage_users",
    "manage_settings",
  ],
  manager: [
    "view_dashboard",
    "manage_branches",
    "manage_files",
    "manage_messages",
    "manage_profiles",
    "manage_reports",
  ],
  sub_manager: [
    "view_dashboard",
    "manage_files",
    "manage_messages",
    "manage_reports",
  ],
  director: ["view_dashboard", "manage_messages", "manage_reports"],
  user: ["view_dashboard", "manage_messages"],
};

function hasPermission(user, permission) {
  if (!user) {
    return false;
  }

  const allowed = permissions[user.role] || [];
  return allowed.includes("all") || allowed.includes(permission);
}

function createSession(userId) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const csrfToken = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + env.sessionTtlDays * 24 * 60 * 60 * 1000
  ).toISOString();

  db.prepare(
    `
    INSERT INTO sessions (id, user_id, csrf_token, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `
  ).run(sessionId, userId, csrfToken, expiresAt, now.toISOString());

  return { sessionId, csrfToken, expiresAt };
}

function destroySession(sessionId) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

function consumeExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(
    new Date().toISOString()
  );
}

function loadCurrentUser(req, res, next) {
  consumeExpiredSessions();

  const sessionId = req.cookies?.[env.cookieName];
  if (!sessionId) {
    req.currentUser = null;
    req.currentSession = null;
    return next();
  }

  const session = db
    .prepare(
      `
      SELECT sessions.*, users.id AS user_id, users.full_name, users.email, users.username,
             users.role, users.branch_id, users.branch_level, users.locale, users.is_active
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.id = ?
    `
    )
    .get(sessionId);

  if (!session || !session.is_active) {
    res.clearCookie(env.cookieName);
    req.currentUser = null;
    req.currentSession = null;
    return next();
  }

  req.currentSession = session;
  req.currentUser = {
    id: session.user_id,
    fullName: session.full_name,
    email: session.email,
    username: session.username,
    role: session.role,
    branchId: session.branch_id,
    branchLevel: session.branch_level,
    locale: session.locale,
  };

  return next();
}

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.redirect("/login");
  }

  return next();
}

function requirePermission(permission) {
  return function permissionGuard(req, res, next) {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    if (!hasPermission(req.currentUser, permission)) {
      logAction({
        userId: req.currentUser.id,
        action: "unauthorized_access_attempt",
        entityType: "permission",
        entityId: permission,
        request: req,
      });
      return res.status(403).render("public/error", {
        pageTitle: "Access denied",
        statusCode: 403,
        message: "You do not have permission to access this page.",
      });
    }

    return next();
  };
}

function verifyCsrf(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  if (process.env.NODE_ENV === "test") {
    return next();
  }

  if (req.path === "/login") {
    return next();
  }

  const bodyToken = req.body?._csrf;
  const headerToken = req.headers["x-csrf-token"];
  const suppliedToken = bodyToken || headerToken;

  if (!req.currentSession || !suppliedToken || suppliedToken !== req.currentSession.csrf_token) {
    return res.status(403).render("public/error", {
      pageTitle: "Invalid request",
      statusCode: 403,
      message: "The request could not be verified. Please try again.",
    });
  }

  return next();
}

module.exports = {
  permissions,
  hasPermission,
  createSession,
  destroySession,
  loadCurrentUser,
  requireAuth,
  requirePermission,
  verifyCsrf,
};
