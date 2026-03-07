function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function serializeJson(value) {
  return JSON.stringify(value || {});
}

function formatBytes(bytes) {
  const safeBytes = Number(bytes) || 0;

  if (safeBytes < 1024) {
    return `${safeBytes} B`;
  }

  if (safeBytes < 1024 * 1024) {
    return `${(safeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

module.exports = {
  slugify,
  parseJson,
  serializeJson,
  formatBytes,
  normalizeList,
};
