/**
 * Dashboard home_decor service — full CRUD, all statuses.
 * Access enforced by middleware (requireAccess).
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateHomeDecorCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
} = require("../../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listHomeDecor = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("home_decor").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    //if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.category) qb.where({ category: query.category });
    if (query.room_type) qb.where({ room_type: query.room_type });
    if (query.style) qb.where({ style: query.style });
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
          "status",
          "published_at",
          "room_type",
          "style",
          "layout_type",
          "products_used",
          "author_id",
          "is_active",
          "views",
          "likes",
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
    logger.error("internal listHomeDecor error", { error: error.message });
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
const getHomeDecorById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid home decor id.",
      };
    }

    const qb = knex("home_decor").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");

    const row = await qb.first();

    if (!row) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("internal getHomeDecorById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch home decor.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createHomeDecor = async (payload, userId) => {
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
        const slug = await generateUniqueSlug(knex, "home_decor", baseSlug);
        const code = generateHomeDecorCode();

        const isPublished = payload.status === "published";

        const insertData = {
          code,
          slug,
          title: payload.title,
          excerpt: payload.excerpt ?? null,
          content: payload.content,
          featured_image: payload.featured_image ?? null,
          category: payload.category ?? null,
          tags: serializeJsonb(payload.tags, []),
          gallery: serializeJsonb(payload.gallery, []),
          author_id: userId,
          status: payload.status ?? "draft",
          published_at: isPublished ? knex.fn.now() : null,
          seo: serializeJsonb(payload.seo, {}),
          room_type: payload.room_type ?? null,
          style: payload.style ?? null,
          is_active: payload.is_active !== undefined ? payload.is_active : true, // ← added
          layout_type: payload.layout_type ?? "medium",
          article_url: payload.article_url ?? null,
          extra: serializeJsonb(payload.extra, {}),
        };

        const [row] = await knex("home_decor")
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
    logger.error("internal createHomeDecor error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create home decor.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateHomeDecor = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid home decor id.",
      };
    }

    const existing = await knex("home_decor")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found.",
      };
    }

    const allowed = [
      "title",
      "excerpt",
      "content",
      "featured_image",
      "category",
      "status",
      "layout_type",
      "is_active",
      "room_type",
      "style",
      "article_url",
      "layout_type",
      "is_active",
    ];

    const updates = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }

    if (payload.tags !== undefined)
      updates.tags = serializeJsonb(payload.tags, []);
    if (payload.gallery !== undefined)
      updates.gallery = serializeJsonb(payload.gallery, []);
    if (payload.seo !== undefined)
      updates.seo = serializeJsonb(payload.seo, {});
    if (payload.extra !== undefined)
      updates.extra = serializeJsonb(payload.extra, {});
    if (payload.products_used !== undefined) {
      updates.products_used = serializeJsonb(payload.products_used, []);
    }

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      updates.slug = await generateUniqueSlug(
        knex,
        "home_decor",
        payload.slug,
        id,
      );
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

    const [row] = await knex("home_decor")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "A home decor item with this slug already exists.",
      };
    }
    logger.error("internal updateHomeDecor error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update home decor.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteHomeDecor = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid home decor id.",
      };
    }

    const [row] = await knex("home_decor")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");

    if (!row) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found or already deleted.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteHomeDecor error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete home decor.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status (publish / unpublish / archive / restore)
 * ══════════════════════════════════════════════════════════ */
const updateHomeDecorStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid home decor id.",
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

    const qb = knex("home_decor").where({ id });
    if (!restore) qb.whereNull("deleted_at");

    const existing = await qb.first();
    if (!existing) {
      return {
        success: false,
        code: "HOME_DECOR_NOT_FOUND",
        message: "Home decor not found.",
      };
    }

    const newStatus = status !== undefined ? status : existing.status;

    const statusUnchanged = existing.status === newStatus;
    const alreadyActive = !restore || existing.deleted_at === null;
    if (statusUnchanged && alreadyActive) {
      return { success: true, data: existing, unchanged: true };
    }

    const updates = {
      status: newStatus,
      updated_at: knex.fn.now(),
    };

    if (newStatus === "published" && !existing.published_at) {
      updates.published_at = knex.fn.now();
    }

    if (restore && existing.deleted_at) {
      updates.deleted_at = null;
    }

    const [row] = await knex("home_decor")
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
    logger.error("updateHomeDecorStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update home decor status.",
    };
  }
};

module.exports = {
  listHomeDecor,
  getHomeDecorById,
  createHomeDecor,
  updateHomeDecor,
  deleteHomeDecor,
  updateHomeDecorStatus,
};
