/**
 * Dashboard trends service — full CRUD.
 * Access enforced by middleware (requireAccess).
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateTrendCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
  calculateReadTime,
} = require("../../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * Clean text[] arrays
 * ══════════════════════════════════════════════════════════ */
const cleanStringArray = (arr, maxLen = 100) => {
  if (!Array.isArray(arr)) return [];
  return [
    ...new Set(
      arr
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0 && v.length <= maxLen),
    ),
  ];
};

/* ══════════════════════════════════════════════════════════
 * Clean colors — validate hex codes
 * ══════════════════════════════════════════════════════════ */
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
const cleanColors = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [
    ...new Set(
      arr
        .map((c) => String(c).trim())
        .filter((c) => c.length > 0 && HEX_COLOR_REGEX.test(c)),
    ),
  ];
};

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listTrends = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("trends").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.layout_type) qb.where({ layout_type: query.layout_type });
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
    if (query.author_id) qb.where({ author_id: query.author_id });
    if (query.from_date) qb.where("created_at", ">=", query.from_date);
    if (query.to_date) qb.where("created_at", "<=", query.to_date);

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
        .select(
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
          "is_active",
          "status",
          "published_at",
          "views",
          "extra",
          "author_id",
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
    logger.error("internal listTrends error", { error: error.message });
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
const getTrendById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid trend id.",
      };
    }
    const qb = knex("trends").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row) {
      return {
        success: false,
        code: "TREND_NOT_FOUND",
        message: "Trend not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal getTrendById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch trend.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createTrend = async (payload, userId) => {
  const MAX_RETRIES = 3;

  try {
    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid author id.",
      };
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const baseSlug = payload.slug || payload.title;
        const slug = await generateUniqueSlug(knex, "trends", baseSlug);
        const code = generateTrendCode();

        const cleanedCategory = cleanStringArray(payload.category, 100);
        const cleanedTags = cleanStringArray(payload.tags, 50);
        const cleanedColors = cleanColors(payload.colors);
        const cleanedMaterials = cleanStringArray(payload.materials, 100);
        const cleanedStyles = cleanStringArray(payload.styles, 100);
        const cleanedSources = cleanStringArray(payload.sources, 500);
        const cleanedRelatedIds = cleanStringArray(
          payload.related_trend_ids,
          50,
        );

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
          forecast: payload.forecast ?? null,
          read_time: readTime,
          category: knex.raw("?::text[]", [cleanedCategory]),
          tags: knex.raw("?::text[]", [cleanedTags]),
          trend_category: payload.trend_category ?? "general",
          season: payload.season ?? "all_year",
          year: payload.year ?? null,
          confidence_level: payload.confidence_level ?? "medium",
          region: payload.region ?? "global",
          colors: knex.raw("?::text[]", [cleanedColors]),
          materials: knex.raw("?::text[]", [cleanedMaterials]),
          styles: knex.raw("?::text[]", [cleanedStyles]),
          sources: knex.raw("?::text[]", [cleanedSources]),
          related_trend_ids: knex.raw("?::text[]", [cleanedRelatedIds]),
          featured_image_url: payload.featured_image_url ?? null,
          gallery: serializeJsonb(payload.gallery, []),
          layout_type: payload.layout_type ?? "card",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          status: payload.status ?? "draft",
          published_at: isPublished ? knex.fn.now() : null,
          extra: serializeJsonb(payload.extra, {}),
          author_id: userId,
        };

        const [row] = await knex("trends").insert(insertData).returning("*");
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
    logger.error("internal createTrend error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create trend.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateTrend = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid trend id.",
      };
    }
    const existing = await knex("trends")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "TREND_NOT_FOUND",
        message: "Trend not found.",
      };
    }

    const allowed = [
      "title",
      "excerpt",
      "content",
      "forecast",
      "read_time",
      "trend_category",
      "season",
      "year",
      "confidence_level",
      "region",
      "featured_image_url",
      "layout_type",
      "is_active",
      "status",
    ];
    const updates = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }

    if (payload.category !== undefined) {
      updates.category = knex.raw("?::text[]", [
        cleanStringArray(payload.category, 100),
      ]);
    }
    if (payload.tags !== undefined) {
      updates.tags = knex.raw("?::text[]", [
        cleanStringArray(payload.tags, 50),
      ]);
    }
    if (payload.colors !== undefined) {
      updates.colors = knex.raw("?::text[]", [cleanColors(payload.colors)]);
    }
    if (payload.materials !== undefined) {
      updates.materials = knex.raw("?::text[]", [
        cleanStringArray(payload.materials, 100),
      ]);
    }
    if (payload.styles !== undefined) {
      updates.styles = knex.raw("?::text[]", [
        cleanStringArray(payload.styles, 100),
      ]);
    }
    if (payload.sources !== undefined) {
      updates.sources = knex.raw("?::text[]", [
        cleanStringArray(payload.sources, 500),
      ]);
    }
    if (payload.related_trend_ids !== undefined) {
      updates.related_trend_ids = knex.raw("?::text[]", [
        cleanStringArray(payload.related_trend_ids, 50),
      ]);
    }
    if (payload.gallery !== undefined) {
      updates.gallery = serializeJsonb(payload.gallery, []);
    }
    if (payload.extra !== undefined) {
      updates.extra = serializeJsonb(payload.extra, {});
    }

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      updates.slug = await generateUniqueSlug(knex, "trends", payload.slug, id);
    }

    if (
      payload.content !== undefined &&
      payload.read_time === undefined &&
      payload.content !== existing.content
    ) {
      updates.read_time = calculateReadTime(payload.content);
    }

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

    const [row] = await knex("trends")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "A trend with this slug already exists.",
      };
    }
    logger.error("internal updateTrend error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update trend.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteTrend = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid trend id.",
      };
    }
    const [row] = await knex("trends")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");

    if (!row) {
      return {
        success: false,
        code: "TREND_NOT_FOUND",
        message: "Trend not found or already deleted.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteTrend error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete trend.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status (unified)
 * ══════════════════════════════════════════════════════════ */
const updateTrendStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid trend id.",
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

    const qb = knex("trends").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();

    if (!existing) {
      return {
        success: false,
        code: "TREND_NOT_FOUND",
        message: "Trend not found.",
      };
    }

    const newStatus = status !== undefined ? status : existing.status;
    const statusUnchanged = existing.status === newStatus;
    const alreadyActive = !restore || existing.deleted_at === null;

    if (statusUnchanged && alreadyActive) {
      return { success: true, data: existing, unchanged: true };
    }

    const updates = { status: newStatus, updated_at: knex.fn.now() };
    if (newStatus === "published" && !existing.published_at) {
      updates.published_at = knex.fn.now();
    }
    if (restore && existing.deleted_at) {
      updates.deleted_at = null;
    }

    const [row] = await knex("trends")
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
    logger.error("updateTrendStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update trend status.",
    };
  }
};

module.exports = {
  listTrends,
  getTrendById,
  createTrend,
  updateTrend,
  deleteTrend,
  updateTrendStatus,
};
