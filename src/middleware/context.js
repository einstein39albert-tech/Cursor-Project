const db = require("../config/database");
const env = require("../config/env");
const { getCalendarSnapshot } = require("../utils/calendar");
const { getLocale, getLanguageOptions, translate } = require("../utils/i18n");
const { parseJson } = require("../utils/helpers");
const { hasPermission } = require("./auth");

function getOrganizationSettings() {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("organization");
  return parseJson(row?.value, {
    name: env.appName,
    shortName: "UORMS",
    description: "",
  });
}

function attachContext(req, res, next) {
  const requestedLocale =
    req.query.lang ||
    req.cookies?.locale ||
    req.currentUser?.locale ||
    env.defaultLocale;
  const locale = getLocale(requestedLocale, env.defaultLocale);
  const organization = getOrganizationSettings();

  res.locals.app = {
    name: organization.name || env.appName,
    shortName: organization.shortName || "UORMS",
    description: organization.description || "",
    address: organization.address || "",
    phone: organization.phone || "",
    email: organization.email || "",
    primaryColor: organization.primaryColor || "#0b3b5c",
    accentColor: organization.accentColor || "#1b6b8f",
  };
  res.locals.locale = locale;
  res.locals.languages = getLanguageOptions();
  res.locals.t = (key) => translate(locale, key);
  res.locals.calendar = getCalendarSnapshot();
  res.locals.currentUser = req.currentUser || null;
  res.locals.csrfToken = req.currentSession?.csrf_token || "";
  res.locals.flash = req.cookies?.flash ? parseJson(req.cookies.flash, null) : null;
  res.locals.hasPermission = (permission) => hasPermission(req.currentUser, permission);

  if (req.cookies?.flash) {
    res.clearCookie("flash");
  }

  res.cookie("locale", locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: env.secureCookies,
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  next();
}

function setFlash(res, payload) {
  res.cookie("flash", JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.secureCookies,
    maxAge: 1000 * 15,
  });
}

module.exports = {
  attachContext,
  setFlash,
};
