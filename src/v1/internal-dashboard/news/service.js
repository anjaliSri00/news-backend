/**
 * Dashboard news service — full CRUD for all news_types.
 * Access enforced by middleware (requireAccess).
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateNewsCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  calculateReadTime,
} = require("../../../utils/contentHelpers");

/**
 * Clean + validate a category array.
 * Returns:
 *   valid: true  → cleaned array (deduped, trimmed, all in allowlist)
 *   valid: false → { invalid: [bad values] }
 */
const cleanCategory = (arr) => {
  if (!Array.isArray(arr)) return { valid: true, cleaned: [] };

  const trimmed = arr.map((c) => String(c).trim()).filter((c) => c.length > 0);

  const invalid = trimmed.filter((c) => !NEWS_CATEGORIES.includes(c));
  if (invalid.length > 0) {
    return { valid: false, invalid };
  }

  return { valid: true, cleaned: [...new Set(trimmed)] };
};

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listNews = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("news").whereNull("deleted_at");

    if (query.news_type) qb.where({ news_type: query.news_type });
    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.author_id) qb.where({ author_id: query.author_id });
    if (query.from_date) qb.where("created_at", ">=", query.from_date);
    if (query.to_date) qb.where("created_at", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("title", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("content", "ilike", term)
          .orWhere("source", "ilike", term);
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
          "read_time",
          "category",
          "news_type",
          "featured_image_url",
          "source",
          "source_url",
          "layout_type",
          "is_active",
          "status",
          "author_id",
          "published_at",
          "views",
          "created_at",
          "updated_at",
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
    logger.error("internal listNews error", { error: error.message });
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
const getNewsById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid news id.",
      };
    }
    const qb = knex("news").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row) {
      return {
        success: false,
        code: "NEWS_NOT_FOUND",
        message: "News item not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal getNewsById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch news.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createNews = async (payload, userId) => {
  const MAX_RETRIES = 3;

  try {
    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid author id.",
      };
    }

    // Validate categories
    const catResult = cleanCategory(payload.category);
    if (!catResult.valid) {
      return {
        success: false,
        code: "INVALID_CATEGORY",
        message: `Invalid category value(s): ${catResult.invalid.join(", ")}. Allowed: ${NEWS_CATEGORIES.join(", ")}`,
      };
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const baseSlug = payload.slug || payload.title;
        const slug = await generateUniqueSlug(knex, "news", baseSlug);
        const code = generateNewsCode();

        const readTime =
          payload.read_time !== undefined
            ? payload.read_time
            : calculateReadTime(payload.content);

        const isPublished = payload.status === "published";

        const insertData = {
          code,
          slug,
          title: payload.title,
          excerpt: payload.excerpt ?? null,
          content: payload.content ?? null,
          read_time: readTime,
          category: knex.raw("?::text[]", [catResult.cleaned]), // ← cleaned array
          news_type: payload.news_type ?? "latest",
          featured_image_url: payload.featured_image_url ?? null,
          source: payload.source ?? null,
          source_url: payload.source_url ?? null,
          author_id: userId,
          layout_type: payload.layout_type ?? "card",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          status: payload.status ?? "draft",
          published_at: isPublished ? knex.fn.now() : null,
        };

        const [row] = await knex("news").insert(insertData).returning("*");
        return { success: true, data: row };
      } catch (err) {
        if (err.code === "23505") {
          const detail = err.detail || "";
          if (
            (detail.includes("code") || detail.includes("slug")) &&
            attempt < MAX_RETRIES - 1
          ) {
            continue;
          }
        }
        throw err;
      }
    }

    return {
      success: false,
      code: "CODE_GEN_FAILED",
      message: "Could not generate unique code/slug. Please try again.",
    };
  } catch (error) {
    logger.error("internal createNews error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create news.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateNews = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid news id.",
      };
    }
    const existing = await knex("news")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "NEWS_NOT_FOUND",
        message: "News item not found.",
      };
    }

    const allowed = [
      "title",
      "excerpt",
      "content",
      "read_time",
      "news_type",
      "featured_image_url",
      "source",
      "source_url",
      "layout_type",
      "is_active",
      "status",
    ];
    const updates = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }

    // Category — clean + replace whole array
    if (payload.category !== undefined) {
      const catResult = cleanCategory(payload.category);
      if (!catResult.valid) {
        return {
          success: false,
          code: "INVALID_CATEGORY",
          message: `Invalid category value(s): ${catResult.invalid.join(", ")}. Allowed: ${NEWS_CATEGORIES.join(", ")}`,
        };
      }
      updates.category = knex.raw("?::text[]", [catResult.cleaned]);
    }

    // Slug — regenerate if provided and different
    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      updates.slug = await generateUniqueSlug(knex, "news", payload.slug, id);
    }

    // Auto read_time recalc if content changed and read_time not explicitly passed
    if (
      payload.content !== undefined &&
      payload.read_time === undefined &&
      payload.content !== existing.content
    ) {
      updates.read_time = calculateReadTime(payload.content);
    }

    // Publish timestamp
    if (payload.status === "published" && existing.status !== "published") {
      updates.published_at = existing.published_at || knex.fn.now();
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        code: "NO_CHANGES",
        message: "No valid fields to update.",
      };
    }

    updates.updated_at = knex.fn.now();

    const [row] = await knex("news")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "A news item with this slug already exists.",
      };
    }
    logger.error("internal updateNews error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update news.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteNews = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid news id.",
      };
    }
    const [row] = await knex("news")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title", "news_type");

    if (!row) {
      return {
        success: false,
        code: "NEWS_NOT_FOUND",
        message: "News item not found or already deleted.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteNews error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete news.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status (unified)
 * ══════════════════════════════════════════════════════════ */
const updateNewsStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid news id.",
      };
    }
    const ALLOWED = ["draft", "published", "archived"];
    if (status !== undefined && !ALLOWED.includes(status)) {
      return {
        success: false,
        code: "INVALID_STATUS",
        message: `Status must be one of: ${ALLOWED.join(", ")}.`,
      };
    }

    const qb = knex("news").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();

    if (!existing) {
      return {
        success: false,
        code: "NEWS_NOT_FOUND",
        message: "News item not found.",
      };
    }

    const newStatus = status !== undefined ? status : existing.status;
    const statusUnchanged = existing.status === newStatus;
    const alreadyActive = !restore || existing.deleted_at === null;

    if (statusUnchanged && alreadyActive) {
      return { success: true, data: existing, unchanged: true };
    }

    const updates = { status: newStatus, updated_at: knex.fn.now() };
    if (newStatus === "published" && !existing.published_at)
      updates.published_at = knex.fn.now();
    if (restore && existing.deleted_at) updates.deleted_at = null;

    const [row] = await knex("news")
      .where({ id })
      .update(updates)
      .returning("*");

    return {
      success: true,
      data: row,
      transitions: {
        from_status: existing.status,
        to_status: newStatus,
        was_deleted: existing.deleted_at !== null,
      },
    };
  } catch (error) {
    logger.error("updateNewsStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update news status.",
    };
  }
};

module.exports = {
  listNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  updateNewsStatus,
};
