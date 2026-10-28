/**
 * Generic helpers for all content features (events, home_decor, products, ...).
 * Replaces eventHelpers.js — usable by every feature.
 */
const crypto = require("crypto");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v) => typeof v === "string" && UUID_REGEX.test(v);

const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Generate a slug unique within a table.
 *   generateUniqueSlug(knex, "home_decor", "modern-bedroom")
 *   generateUniqueSlug(knex, "events", "milan-2025", existingId)
 */
const generateUniqueSlug = async (
  knex,
  tableName,
  baseSlug,
  excludeId = null,
) => {
  const base = slugify(baseSlug) || tableName;
  let candidate = base;
  let counter = 1;

  while (counter <= 100) {
    const q = knex(tableName).where({ slug: candidate });
    if (excludeId) q.whereNot({ id: excludeId });
    const existing = await q.first();
    if (!existing) return candidate;
    counter++;
    candidate = `${base}-${counter}`;
  }
  return `${base}-${crypto.randomBytes(4).toString("hex")}`;
};

const serializeJsonb = (value, fallback) => {
  if (value === undefined || value === null) return JSON.stringify(fallback);
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(fallback);
    }
  }
  return JSON.stringify(value);
};

module.exports = { isUUID, slugify, generateUniqueSlug, serializeJsonb };
