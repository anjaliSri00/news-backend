/**
 * Public home_decor service — read-only for visitors.
 * Only published, non-deleted items are visible.
 */
const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { isUUID } = require("../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listHomeDecor = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("home_decor")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.category) qb.where({ category: query.category });
    if (query.room_type) qb.where({ room_type: query.room_type });
    if (query.style) qb.where({ style: query.style });

    // Also add layout_type filter:
    if (query.layout_type) qb.where({ layout_type: query.layout_type });

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
        .select(
          "id",
          "code",
          "title",
          "slug",
          "excerpt",
          "featured_image",
          "category",
          "tags",
          "published_at",
          "room_type",
          "style",
          "room_type",
          "style",
          "layout_type",
          "products_used",
          "views",
          "likes",
        )
        .orderBy(sortField, sortDir)
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    const total = parseInt(countRow.count, 10) || 0;

    return {
      success: true,
      data: {
        home_decor: rows,
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
    logger.error("public listHomeDecor error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch home decor items.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getHomeDecorById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid home decor id.",
      };
    }

    const row = await knex("home_decor")
      .where({ id, status: "published" ,  is_active: true })
      .whereNull("deleted_at")
      .first();

    if (!row) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("public getHomeDecorById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch home decor.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug
 * ══════════════════════════════════════════════════════════ */
const getHomeDecorBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }

    const row = await knex("home_decor")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();

    if (!row) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("public getHomeDecorBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch home decor.",
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
        message: "Invalid home decor id.",
      };
    }

    const updated = await knex("home_decor")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .increment("views", 1);

    if (!updated) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found.",
      };
    }

    const row = await knex("home_decor").where({ id }).select("views").first();
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

/* ══════════════════════════════════════════════════════════
 * Increment likes
 * ══════════════════════════════════════════════════════════ */
const incrementLikes = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid home decor id.",
      };
    }

    const updated = await knex("home_decor")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .increment("likes", 1);

    if (!updated) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found.",
      };
    }

    const row = await knex("home_decor").where({ id }).select("likes").first();
    return { success: true, data: row };
  } catch (error) {
    logger.error("public incrementLikes error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to increment likes.",
    };
  }
};

module.exports = {
  listHomeDecor,
  getHomeDecorById,
  getHomeDecorBySlug,
  incrementViews,
  incrementLikes,
};
