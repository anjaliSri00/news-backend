/**
 * Public designers service — read-only for visitors.
 * Filters: status='published' AND is_active=true AND deleted_at IS NULL.
 */
const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { isUUID } = require("../../utils/contentHelper");

/* Columns exposed publicly — no author_id, no status internals */
const PUBLIC_SELECT = [
  "id",
  "code",
  "name",
  "slug",
  "email",
  "excerpt",
  "read_time",
  "city",
  "country",
  "specialization",
  "portfolio_url",
  "featured_image_url",
  "avatar_url",
  "gallery",
  "awards",
  "layout_type",
  "published_at",
];

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listDesigners = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("designers")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.city) qb.where({ city: query.city });
    if (query.country) qb.where({ country: query.country });
    if (query.specialization) {
      qb.where("specialization", "ilike", `%${query.specialization}%`);
    }
    if (query.award) qb.whereRaw("? = ANY(awards)", [query.award]);
    if (query.from_date) qb.where("published_at", ">=", query.from_date);
    if (query.to_date) qb.where("published_at", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("name", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("bio", "ilike", term)
          .orWhere("specialization", "ilike", term);
      });
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select(PUBLIC_SELECT)
        .orderBy(sortField, sortDir)
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    const total = parseInt(countRow.count, 10) || 0;

    return {
      success: true,
      data: {
        designers: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    logger.error("public listDesigners error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch designers.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getDesignerById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid designer id.",
      };
    }
    const row = await knex("designers")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();

    if (!row) {
      return {
        success: false,
        code: "DESIGNER_NOT_FOUND",
        message: "Designer not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getDesignerById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch designer.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug
 * ══════════════════════════════════════════════════════════ */
const getDesignerBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }
    const row = await knex("designers")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();

    if (!row) {
      return {
        success: false,
        code: "DESIGNER_NOT_FOUND",
        message: "Designer not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getDesignerBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch designer.",
    };
  }
};

module.exports = { listDesigners, getDesignerById, getDesignerBySlug };
