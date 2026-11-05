/**
 * Public furniture service — read-only for visitors.
 * Only published + is_active + not-deleted items visible.
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
  "tags",
  "designer",
  "brand",
  "material",
  "color",
  "style",
  "dimensions",
  "price_range",
  "year",
  "featured_image_url",
  "gallery",
  "layout_type",
  "published_at",
  "views",
  "extra",
];

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listFurniture = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("furniture")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.tag) qb.whereRaw("? = ANY(tags)", [query.tag]);
    if (query.designer) qb.where("designer", "ilike", `%${query.designer}%`);
    if (query.brand) qb.where({ brand: query.brand });
    if (query.style) qb.where({ style: query.style });
    if (query.material) qb.where("material", "ilike", `%${query.material}%`);
    if (query.color) qb.where("color", "ilike", `%${query.color}%`);
    if (query.year) qb.where({ year: query.year });
    if (query.from_date) qb.where("published_at", ">=", query.from_date);
    if (query.to_date) qb.where("published_at", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("title", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("content", "ilike", term)
          .orWhere("designer", "ilike", term)
          .orWhere("brand", "ilike", term);
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
        furniture: rows,
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
    logger.error("public listFurniture error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch furniture.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getFurnitureById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid furniture id.",
      };
    }
    const row = await knex("furniture")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "FURNITURE_NOT_FOUND",
        message: "Furniture item not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getFurnitureById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch furniture item.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug
 * ══════════════════════════════════════════════════════════ */
const getFurnitureBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }
    const row = await knex("furniture")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "FURNITURE_NOT_FOUND",
        message: "Furniture item not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getFurnitureBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch furniture item.",
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
        message: "Invalid furniture id.",
      };
    }
    const updated = await knex("furniture")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .increment("views", 1);
    if (!updated) {
      return {
        success: false,
        code: "FURNITURE_NOT_FOUND",
        message: "Furniture item not found.",
      };
    }
    const row = await knex("furniture").where({ id }).select("views").first();
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
  listFurniture,
  getFurnitureById,
  getFurnitureBySlug,
  incrementViews,
};
