/**
 * Dashboard design_tech service — full CRUD.
 * Access enforced by middleware (requireAccess).
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateDesignTechCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
  calculateReadTime,
} = require("../../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * Clean string[] — dedupe, trim, drop empties
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
 * List
 * ══════════════════════════════════════════════════════════ */
const listDesignTech = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("design_tech").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.layout_type) qb.where({ layout_type: query.layout_type });
    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.author_id) qb.where({ author_id: query.author_id });
    if (query.from_date) qb.where("created_at", ">=", query.from_date);
    if (query.to_date) qb.where("created_at", "<=", query.to_date);

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
          "content",
          "read_time",
          "category",
          "featured_image_url",
          "layout_type",
          "status",
          "is_active",
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
    logger.error("internal listDesignTech error", { error: error.message });
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
const getDesignTechById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid design tech id.",
      };
    }
    const qb = knex("design_tech").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row) {
      return {
        success: false,
        code: "DESIGN_TECH_NOT_FOUND",
        message: "Design tech entry not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal getDesignTechById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch design tech entry.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createDesignTech = async (payload, userId) => {
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
        const slug = await generateUniqueSlug(knex, "design_tech", baseSlug);
        const code = generateDesignTechCode();

        const cleanedCategory = cleanStringArray(payload.category, 100);
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
          category: knex.raw("?::text[]", [cleanedCategory]),
          featured_image_url: payload.featured_image_url ?? null,
          layout_type: payload.layout_type ?? "card",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          status: payload.status ?? "draft",
          published_at: isPublished ? knex.fn.now() : null,
          extra: serializeJsonb(payload.extra, {}),
          author_id: userId,
        };

        const [row] = await knex("design_tech")
          .insert(insertData)
          .returning("*");
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
    logger.error("internal createDesignTech error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create design tech entry.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateDesignTech = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid design tech id.",
      };
    }
    const existing = await knex("design_tech")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "DESIGN_TECH_NOT_FOUND",
        message: "Design tech entry not found.",
      };
    }

    const allowed = [
      "title",
      "excerpt",
      "content",
      "read_time",
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
    if (payload.extra !== undefined) {
      updates.extra = serializeJsonb(payload.extra, {});
    }

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      updates.slug = await generateUniqueSlug(
        knex,
        "design_tech",
        payload.slug,
        id,
      );
    }

    // Auto-recalc read_time if content changed and not explicitly passed
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

    const [row] = await knex("design_tech")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "A design tech entry with this slug already exists.",
      };
    }
    logger.error("internal updateDesignTech error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update design tech entry.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteDesignTech = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid design tech id.",
      };
    }
    const [row] = await knex("design_tech")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");

    if (!row) {
      return {
        success: false,
        code: "DESIGN_TECH_NOT_FOUND",
        message: "Design tech entry not found or already deleted.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteDesignTech error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete design tech entry.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status (publish / unpublish / archive / restore)
 * ══════════════════════════════════════════════════════════ */
const updateDesignTechStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid design tech id.",
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

    const qb = knex("design_tech").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();

    if (!existing) {
      return {
        success: false,
        code: "DESIGN_TECH_NOT_FOUND",
        message: "Design tech entry not found.",
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

    const [row] = await knex("design_tech")
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
    logger.error("updateDesignTechStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update design tech status.",
    };
  }
};

module.exports = {
  listDesignTech,
  getDesignTechById,
  createDesignTech,
  updateDesignTech,
  deleteDesignTech,
  updateDesignTechStatus,
};
