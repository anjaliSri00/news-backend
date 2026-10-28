/**
 * Public events service — read-only for visitors.
 * Only published, non-deleted events are ever visible.
 */
const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { isUUID } = require("../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * List — published only, paginated, filterable
 * ══════════════════════════════════════════════════════════ */
const listEvents = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("events")
      .where({ status: "published" })
      .whereNull("deleted_at");

    if (query.category) qb.where({ category: query.category });
    if (query.event_type) qb.where({ event_type: query.event_type });
    if (query.from_date) qb.where("start_date", ">=", query.from_date);
    if (query.to_date) qb.where("start_date", "<=", query.to_date);

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
          "article_url",
          "featured_image",
          "category",
          "tags",
          "published_at",
          "event_type",
          "start_date",
          "end_date",
          "venue",
          "city",
          "country",
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
        events: rows,
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
    logger.error("public listEvents error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch events.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID — published only
 * ══════════════════════════════════════════════════════════ */
const getEventById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid event id.",
      };
    }

    const event = await knex("events")
      .where({ id, status: "published" })
      .whereNull("deleted_at")
      .first();

    if (!event) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      };
    }

    return { success: true, data: event };
  } catch (error) {
    logger.error("public getEventById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch event.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug — published only
 * ══════════════════════════════════════════════════════════ */
const getEventBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }

    const event = await knex("events")
      .where({ slug, status: "published" })
      .whereNull("deleted_at")
      .first();

    if (!event) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      };
    }

    return { success: true, data: event };
  } catch (error) {
    logger.error("public getEventBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch event.",
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
        message: "Invalid event id.",
      };
    }

    const updated = await knex("events")
      .where({ id, status: "published" })
      .whereNull("deleted_at")
      .increment("views", 1);

    if (!updated) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      };
    }

    const row = await knex("events").where({ id }).select("views").first();
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
        message: "Invalid event id.",
      };
    }

    const updated = await knex("events")
      .where({ id, status: "published" })
      .whereNull("deleted_at")
      .increment("likes", 1);

    if (!updated) {
      return {
        success: false,
        code: "EVENT_NOT_FOUND",
        message: "Event not found.",
      };
    }

    const row = await knex("events").where({ id }).select("likes").first();
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
  listEvents,
  getEventById,
  getEventBySlug,
  incrementViews,
  incrementLikes,
};
