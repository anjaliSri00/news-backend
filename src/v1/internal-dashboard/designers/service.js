/**
 * Dashboard designers service — full CRUD.
 * Access enforced by middleware (requireAccess).
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateDesignerCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
  calculateReadTime,
} = require("../../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * Clean text[] arrays — dedupe, trim, drop empties
 * ══════════════════════════════════════════════════════════ */
const cleanStringArray = (arr, maxLen = 200) => {
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
const listDesigners = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("designers").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.layout_type) qb.where({ layout_type: query.layout_type });
    if (query.city) qb.where({ city: query.city });
    if (query.country) qb.where({ country: query.country });
    if (query.specialization) {
      qb.where("specialization", "ilike", `%${query.specialization}%`);
    }
    if (query.award) qb.whereRaw("? = ANY(awards)", [query.award]);
    if (query.author_id) qb.where({ author_id: query.author_id });
    if (query.from_date) qb.where("created_at", ">=", query.from_date);
    if (query.to_date) qb.where("created_at", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("name", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("bio", "ilike", term)
          .orWhere("specialization", "ilike", term)
          .orWhere("email", "ilike", term);
      });
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select(
          "id",
          "code",
          "name",
          "slug",
          "email",
          "excerpt",
          "read_time",
          "city",
          "country",
          "specialization",
          "portfolio_url",
          "featured_image_url",
          "avatar_url",
          "gallery",
          "awards",
          "status",
          "is_active",
          "layout_type",
          "published_at",
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
        designers: rows,
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
    logger.error("internal listDesigners error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch designers.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getDesignerById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid designer id.",
      };
    }
    const qb = knex("designers").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row) {
      return {
        success: false,
        code: "DESIGNER_NOT_FOUND",
        message: "Designer not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal getDesignerById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch designer.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createDesigner = async (payload, userId) => {
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
        const baseSlug = payload.slug || payload.name;
        const slug = await generateUniqueSlug(knex, "designers", baseSlug);
        const code = generateDesignerCode();

        const cleanedAwards = cleanStringArray(payload.awards, 200);
        const readTime =
          payload.read_time !== undefined
            ? payload.read_time
            : calculateReadTime(payload.bio);

        const isPublished = payload.status === "published";

        const insertData = {
          code,
          slug,
          name: payload.name,
          email: payload.email ?? null,
          excerpt: payload.excerpt ?? null,
          bio: payload.bio ?? null,
          read_time: readTime,
          city: payload.city ?? null,
          country: payload.country ?? null,
          specialization: payload.specialization ?? null,
          portfolio_url: payload.portfolio_url ?? null,
          featured_image_url: payload.featured_image_url ?? null,
          avatar_url: payload.avatar_url ?? null,
          gallery: serializeJsonb(payload.gallery, []),
          awards: knex.raw("?::text[]", [cleanedAwards]),
          status: payload.status ?? "draft",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          layout_type: payload.layout_type ?? "card",
          published_at: isPublished ? knex.fn.now() : null,
          author_id: userId,
        };

        const [row] = await knex("designers").insert(insertData).returning("*");
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
    logger.error("internal createDesigner error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create designer.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateDesigner = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid designer id.",
      };
    }
    const existing = await knex("designers")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "DESIGNER_NOT_FOUND",
        message: "Designer not found.",
      };
    }

    const allowed = [
      "name",
      "email",
      "excerpt",
      "bio",
      "read_time",
      "city",
      "country",
      "specialization",
      "portfolio_url",
      "featured_image_url",
      "avatar_url",
      "status",
      "is_active",
      "layout_type",
    ];
    const updates = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) updates[key] = payload[key];
    }

    if (payload.gallery !== undefined) {
      updates.gallery = serializeJsonb(payload.gallery, []);
    }

    if (payload.awards !== undefined) {
      updates.awards = knex.raw("?::text[]", [
        cleanStringArray(payload.awards, 200),
      ]);
    }

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      updates.slug = await generateUniqueSlug(
        knex,
        "designers",
        payload.slug,
        id,
      );
    }

    // Auto-recalc read_time if bio changed and read_time wasn't explicitly passed
    if (
      payload.bio !== undefined &&
      payload.read_time === undefined &&
      payload.bio !== existing.bio
    ) {
      updates.read_time = calculateReadTime(payload.bio);
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

    const [row] = await knex("designers")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "A designer with this slug already exists.",
      };
    }
    logger.error("internal updateDesigner error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update designer.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteDesigner = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid designer id.",
      };
    }
    const [row] = await knex("designers")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "name");

    if (!row) {
      return {
        success: false,
        code: "DESIGNER_NOT_FOUND",
        message: "Designer not found or already deleted.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteDesigner error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete designer.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status (publish / unpublish / archive / restore)
 * ══════════════════════════════════════════════════════════ */
const updateDesignerStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid designer id.",
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

    const qb = knex("designers").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();

    if (!existing) {
      return {
        success: false,
        code: "DESIGNER_NOT_FOUND",
        message: "Designer not found.",
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

    const [row] = await knex("designers")
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
    logger.error("updateDesignerStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update designer status.",
    };
  }
};

module.exports = {
  listDesigners,
  getDesignerById,
  createDesigner,
  updateDesigner,
  deleteDesigner,
  updateDesignerStatus,
};
