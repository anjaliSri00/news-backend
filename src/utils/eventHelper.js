const crypto = require("crypto");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v) => typeof v === "string" && UUID_REGEX.test(v);

const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Generate a slug that doesn't collide with existing events.
 * Pass excludeId when updating an existing row.
 */
const generateUniqueSlug = async (knex, baseSlug, excludeId = null) => {
  const base = slugify(baseSlug) || "event";
  let candidate = base;
  let counter = 1;

  while (counter <= 100) {
    const q = knex("events").where({ slug: candidate });
    if (excludeId) q.whereNot({ id: excludeId });
    const existing = await q.first();
    if (!existing) return candidate;
    counter++;
    candidate = `${base}-${counter}`;
  }
  return `${base}-${crypto.randomBytes(4).toString("hex")}`;
};

/**
 * Serialize a JS value to a JSONB-safe string.
 * Postgres accepts plain objects too, but explicit stringify avoids
 * driver quirks when the value is already a string.
 */
const serializeJsonb = (value, fallback) => {
  if (value === undefined || value === null) return JSON.stringify(fallback);
  if (typeof value === "string") {
    try {
      JSON.parse(value); // validate
      return value;
    } catch {
      return JSON.stringify(fallback);
    }
  }
  return JSON.stringify(value);
};

module.exports = { isUUID, slugify, generateUniqueSlug, serializeJsonb };