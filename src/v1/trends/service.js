/**
 * Public trends service — read-only for visitors.
 * Only published + is_active + not-deleted trends visible.
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
  "forecast",
  "read_time",
  "category",
  "tags",
  "trend_category",
  "season",
  "year",
  "confidence_level",
  "region",
  "colors",
  "materials",
  "styles",
  "sources",
  "related_trend_ids",
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
const listTrends = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("trends")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.tag) qb.whereRaw("? = ANY(tags)", [query.tag]);
    if (query.color) qb.whereRaw("? = ANY(colors)", [query.color]);
    if (query.material) qb.whereRaw("? = ANY(materials)", [query.material]);
    if (query.style) qb.whereRaw("? = ANY(styles)", [query.style]);
    if (query.trend_category)
      qb.where({ trend_category: query.trend_category });
    if (query.season) qb.where({ season: query.season });
    if (query.year) qb.where({ year: query.year });
    if (query.confidence_level)
      qb.where({ confidence_level: query.confidence_level });
    if (query.region) qb.where({ region: query.region });
    if (query.from_date) qb.where("published_at", ">=", query.from_date);
    if (query.to_date) qb.where("published_at", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("title", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("content", "ilike", term)
          .orWhere("forecast", "ilike", term);
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
        trends: rows,
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
    logger.error("public listTrends error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch trends.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getTrendById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid trend id.",
      };
    }
    const row = await knex("trends")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "TREND_NOT_FOUND",
        message: "Trend not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getTrendById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch trend.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug
 * ══════════════════════════════════════════════════════════ */
const getTrendBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }
    const row = await knex("trends")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "TREND_NOT_FOUND",
        message: "Trend not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getTrendBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch trend.",
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
        message: "Invalid trend id.",
      };
    }
    const updated = await knex("trends")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .increment("views", 1);
    if (!updated) {
      return {
        success: false,
        code: "TREND_NOT_FOUND",
        message: "Trend not found.",
      };
    }
    const row = await knex("trends").where({ id }).select("views").first();
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
  listTrends,
  getTrendById,
  getTrendBySlug,
  incrementViews,
};
