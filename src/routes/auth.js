const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const env = require("../config/env");
const { createSession, destroySession } = require("../middleware/auth");
const { setFlash } = require("../middleware/context");
const { logAction } = require("../services/auditService");

const router = express.Router();

router.get("/login", (req, res) => {
  if (!env.authEnabled) {
    setFlash(res, {
      type: "success",
      message: "Authentication is disabled in development mode.",
    });
    return res.redirect("/dashboard");
  }

  if (req.currentUser) {
    return res.redirect("/dashboard");
  }

  return res.render("auth/login", {
    pageTitle: res.locals.t("auth.title"),
  });
});

router.post("/login", (req, res) => {
  if (!env.authEnabled) {
    setFlash(res, {
      type: "success",
      message: "Authentication is currently bypassed in development mode.",
    });
    return res.redirect("/dashboard");
  }

  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const locale = String(req.body.locale || env.defaultLocale);

  const user = db
    .prepare("SELECT * FROM users WHERE username = ? AND is_active = 1")
    .get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    setFlash(res, {
      type: "error",
      message: "Invalid username or password.",
    });
    return res.redirect("/login");
  }

  const session = createSession(user.id);
  db.prepare("UPDATE users SET locale = ?, updated_at = ? WHERE id = ?").run(
    locale,
    new Date().toISOString(),
    user.id
  );

  res.cookie(env.cookieName, session.sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.secureCookies,
    maxAge: env.sessionTtlDays * 24 * 60 * 60 * 1000,
  });

  setFlash(res, {
    type: "success",
    message: `Welcome back, ${user.full_name}.`,
  });
  logAction({
    userId: user.id,
    action: "login",
    entityType: "session",
    entityId: session.sessionId,
    request: req,
  });

  return res.redirect("/dashboard");
});

router.post("/logout", (req, res) => {
  if (!env.authEnabled) {
    setFlash(res, {
      type: "success",
      message: "Authentication is disabled in development mode.",
    });
    return res.redirect("/dashboard");
  }

  const sessionId = req.cookies?.[env.cookieName];
  if (sessionId) {
    destroySession(sessionId);
    res.clearCookie(env.cookieName);
  }

  if (req.currentUser) {
    logAction({
      userId: req.currentUser.id,
      action: "logout",
      entityType: "session",
      entityId: sessionId,
      request: req,
    });
  }

  setFlash(res, {
    type: "success",
    message: "You have been signed out.",
  });
  return res.redirect("/");
});

module.exports = router;
