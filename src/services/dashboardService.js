const db = require("../config/database");
const { parseJson } = require("../utils/helpers");

function getCount(sql) {
  return db.prepare(sql).get().count;
}

function getOverviewStats() {
  return {
    branches: getCount("SELECT COUNT(*) AS count FROM branches"),
    files: getCount("SELECT COUNT(*) AS count FROM files"),
    messages: getCount("SELECT COUNT(*) AS count FROM messages"),
    profiles: getCount("SELECT COUNT(*) AS count FROM profile_types"),
    users: getCount("SELECT COUNT(*) AS count FROM users WHERE is_active = 1"),
    reports: getCount("SELECT COUNT(*) AS count FROM report_templates"),
  };
}

function getOrganizationSettings() {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("organization");
  return parseJson(row?.value, {});
}

function getCoefficientSettings() {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("coefficients");
  return parseJson(row?.value, {
    daily: [14.28, 14.28, 14.28, 14.28, 14.28, 14.28, 14.32],
    weekly: [25, 25, 25, 25],
    monthly: [33.33, 33.33, 33.34],
    quarterly: [25, 25, 25, 25],
  });
}

function getRecentActivity() {
  return db
    .prepare(
      `
      SELECT audit_logs.*, users.full_name AS user_name
      FROM audit_logs
      LEFT JOIN users ON users.id = audit_logs.user_id
      ORDER BY audit_logs.created_at DESC
      LIMIT 10
    `
    )
    .all();
}

function computeIndicatorMetrics(indicator, coefficients) {
  const yearlyTarget = Number(indicator.yearly_target) || 0;
  const todayPerformance = Number(indicator.today_performance) || 0;

  const quarterTarget = yearlyTarget * ((coefficients.quarterly?.[0] || 25) / 100);
  const monthTarget = quarterTarget * ((coefficients.monthly?.[0] || 33.33) / 100);
  const weekTarget = monthTarget * ((coefficients.weekly?.[0] || 25) / 100);
  const todayTarget = weekTarget * ((coefficients.daily?.[0] || 14.28) / 100);
  const weekPerformance = todayPerformance * 5;
  const monthPerformance = todayPerformance * 22;
  const quarterPerformance = todayPerformance * 66;

  return {
    yearlyTarget,
    quarterTarget: Math.round(quarterTarget),
    monthTarget: Math.round(monthTarget),
    weekTarget: Math.round(weekTarget),
    todayTarget: Math.round(todayTarget),
    todayPerformance,
    weekPerformance,
    monthPerformance,
    quarterPerformance,
    todayEfficiency: todayTarget > 0 ? Math.round((todayPerformance / todayTarget) * 100) : 0,
    yearlyEfficiency:
      yearlyTarget > 0 ? Math.round((quarterPerformance / yearlyTarget) * 100) : 0,
  };
}

function getReportTemplatesWithIndicators() {
  const templates = db.prepare("SELECT * FROM report_templates ORDER BY created_at ASC").all();
  const coefficients = getCoefficientSettings();

  return templates.map((template) => {
    const indicators = db
      .prepare(
        `
        SELECT * FROM report_indicators
        WHERE template_id = ?
        ORDER BY position ASC, id ASC
      `
      )
      .all(template.id)
      .map((indicator) => ({
        ...indicator,
        metrics: computeIndicatorMetrics(indicator, coefficients),
      }));

    return {
      ...template,
      indicators,
    };
  });
}

module.exports = {
  getOverviewStats,
  getOrganizationSettings,
  getCoefficientSettings,
  getRecentActivity,
  getReportTemplatesWithIndicators,
};
