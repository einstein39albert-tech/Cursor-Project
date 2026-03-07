const db = require("../config/database");

function logAction({ userId, action, entityType, entityId = null, details = null, request = null }) {
  const statement = db.prepare(`
    INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id, details_json, ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  statement.run(
    userId || null,
    action,
    entityType,
    entityId,
    details ? JSON.stringify(details) : null,
    request?.ip || null,
    request?.headers?.["user-agent"] || null,
    new Date().toISOString()
  );
}

function getRecent(limit = 20) {
  return db
    .prepare(
      `
      SELECT audit_logs.*, users.full_name AS user_name
      FROM audit_logs
      LEFT JOIN users ON users.id = audit_logs.user_id
      ORDER BY audit_logs.created_at DESC
      LIMIT ?
    `
    )
    .all(limit);
}

module.exports = {
  logAction,
  getRecent,
};
