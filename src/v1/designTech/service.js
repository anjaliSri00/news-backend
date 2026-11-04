/**
 * Public design_tech service — read-only for visitors.
 * Only published + is_active + not-deleted entries visible.
 */
const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { isUUID } = require("../../utils/contentHelper");

const PUBLIC_SELECT = [
  "id",
  "code",
  "title",
  "slug",
  "excerpt",
  "content",
  "read_time",
  "category",
  "featured_image_url",
  "layout_type",
  "published_at",
  "views",
  "extra",
];

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listDesignTech = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("design_tech")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.layout_type) qb.where({ layout_type: query.layout_type });
    if (query.from_date) qb.where("published_at", ">=", query.from_date);
    if (query.to_date) qb.where("published_at", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("title", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("content", "ilike", term);
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
        design_tech: rows,
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
    logger.error("public listDesignTech error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch design tech entries.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getDesignTechById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid design tech id.",
      };
    }
    const row = await knex("design_tech")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "DESIGN_TECH_NOT_FOUND",
        message: "Design tech entry not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getDesignTechById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch design tech entry.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug
 * ══════════════════════════════════════════════════════════ */
const getDesignTechBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }
    const row = await knex("design_tech")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "DESIGN_TECH_NOT_FOUND",
        message: "Design tech entry not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getDesignTechBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch design tech entry.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Increment views
 * ══════════════════════════════════════════════════════════ */
const incrementViews = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid design tech id.",
      };
    }
    const updated = await knex("design_tech")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .increment("views", 1);
    if (!updated) {
      return {
        success: false,
        code: "DESIGN_TECH_NOT_FOUND",
        message: "Design tech entry not found.",
      };
    }
    const row = await knex("design_tech").where({ id }).select("views").first();
    return { success: true, data: row };
  } catch (error) {
    logger.error("public incrementViews error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to increment views.",
    };
  }
};

module.exports = {
  listDesignTech,
  getDesignTechById,
  getDesignTechBySlug,
  incrementViews,
};
