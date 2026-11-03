/**
 * Public news service — read-only for visitors.
 * Filters: status='published' AND is_active=true AND deleted_at IS NULL.
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
  "read_time",
  "category",
  "news_type",
  "featured_image_url",
  "source",
  "source_url",
  "layout_type",
  "published_at",
  "views",
];

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listNews = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("news")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.news_type) qb.where({ news_type: query.news_type });
    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.author_id) qb.where({ author_id: query.author_id });
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
        news: rows,
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
    logger.error("public listNews error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch news.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getNewsById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid news id.",
      };
    }
    const row = await knex("news")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "NEWS_NOT_FOUND",
        message: "News item not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getNewsById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch news.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug
 * ══════════════════════════════════════════════════════════ */
const getNewsBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }
    const row = await knex("news")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "NEWS_NOT_FOUND",
        message: "News item not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getNewsBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch news.",
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
        message: "Invalid news id.",
      };
    }
    const updated = await knex("news")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .increment("views", 1);
    if (!updated) {
      return {
        success: false,
        code: "NEWS_NOT_FOUND",
        message: "News item not found.",
      };
    }
    const row = await knex("news").where({ id }).select("views").first();
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

module.exports = { listNews, getNewsById, getNewsBySlug, incrementViews };
