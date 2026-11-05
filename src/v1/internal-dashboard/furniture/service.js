/**
 * Dashboard furniture service — full CRUD.
 * Access enforced by middleware (requireAccess).
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateFurnitureCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
  calculateReadTime,
} = require("../../../utils/contentHelper");

/* ══════════════════════════════════════════════════════════
 * Clean text[] — dedupe, trim, drop empties, cap length
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
 * Validate dimensions object — must be numbers, positive
 * ══════════════════════════════════════════════════════════ */
const cleanDimensions = (dim) => {
  if (!dim || typeof dim !== "object" || Array.isArray(dim)) return {};
  const out = {};
  for (const key of ["width", "height", "depth"]) {
    if (dim[key] !== undefined && dim[key] !== null) {
      const num = parseFloat(dim[key]);
      if (!isNaN(num) && num >= 0) out[key] = num;
    }
  }
  if (dim.unit && typeof dim.unit === "string" && dim.unit.trim().length > 0) {
    out.unit = dim.unit.trim().substring(0, 20);
  }
  return out;
};

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listFurniture = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("furniture").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.layout_type) qb.where({ layout_type: query.layout_type });
    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.tag) qb.whereRaw("? = ANY(tags)", [query.tag]);
    if (query.designer) qb.where("designer", "ilike", `%${query.designer}%`);
    if (query.brand) qb.where({ brand: query.brand });
    if (query.style) qb.where({ style: query.style });
    if (query.material) qb.where("material", "ilike", `%${query.material}%`);
    if (query.color) qb.where("color", "ilike", `%${query.color}%`);
    if (query.year) qb.where({ year: query.year });
    if (query.author_id) qb.where({ author_id: query.author_id });
    if (query.from_date) qb.where("created_at", ">=", query.from_date);
    if (query.to_date) qb.where("created_at", "<=", query.to_date);

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
        .select(
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
    logger.error("internal listFurniture error", { error: error.message });
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
const getFurnitureById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid furniture id.",
      };
    }
    const qb = knex("furniture").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row) {
      return {
        success: false,
        code: "FURNITURE_NOT_FOUND",
        message: "Furniture item not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal getFurnitureById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch furniture item.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createFurniture = async (payload, userId) => {
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
        const slug = await generateUniqueSlug(knex, "furniture", baseSlug);
        const code = generateFurnitureCode();

        const cleanedCategory = cleanStringArray(payload.category, 100);
        const cleanedTags = cleanStringArray(payload.tags, 50);
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
          tags: knex.raw("?::text[]", [cleanedTags]),
          designer: payload.designer ?? null,
          brand: payload.brand ?? null,
          material: payload.material ?? null,
          color: payload.color ?? null,
          style: payload.style ?? null,
          dimensions: serializeJsonb(cleanDimensions(payload.dimensions), {}),
          price_range: payload.price_range ?? null,
          year: payload.year ?? null,
          featured_image_url: payload.featured_image_url ?? null,
          gallery: serializeJsonb(payload.gallery, []),
          layout_type: payload.layout_type ?? "card",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          status: payload.status ?? "draft",
          published_at: isPublished ? knex.fn.now() : null,
          extra: serializeJsonb(payload.extra, {}),
          author_id: userId,
        };

        const [row] = await knex("furniture").insert(insertData).returning("*");
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
    logger.error("internal createFurniture error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create furniture item.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateFurniture = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid furniture id.",
      };
    }
    const existing = await knex("furniture")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "FURNITURE_NOT_FOUND",
        message: "Furniture item not found.",
      };
    }

    const allowed = [
      "title",
      "excerpt",
      "content",
      "read_time",
      "designer",
      "brand",
      "material",
      "color",
      "style",
      "price_range",
      "year",
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
    if (payload.dimensions !== undefined) {
      updates.dimensions = serializeJsonb(
        cleanDimensions(payload.dimensions),
        {},
      );
    }
    if (payload.gallery !== undefined) {
      updates.gallery = serializeJsonb(payload.gallery, []);
    }
    if (payload.extra !== undefined) {
      updates.extra = serializeJsonb(payload.extra, {});
    }

    if (payload.slug !== undefined && payload.slug !== existing.slug) {
      updates.slug = await generateUniqueSlug(
        knex,
        "furniture",
        payload.slug,
        id,
      );
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

    const [row] = await knex("furniture")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "A furniture item with this slug already exists.",
      };
    }
    logger.error("internal updateFurniture error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update furniture item.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteFurniture = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid furniture id.",
      };
    }
    const [row] = await knex("furniture")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");

    if (!row) {
      return {
        success: false,
        code: "FURNITURE_NOT_FOUND",
        message: "Furniture item not found or already deleted.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteFurniture error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete furniture item.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status (publish / unpublish / archive / restore)
 * ══════════════════════════════════════════════════════════ */
const updateFurnitureStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid furniture id.",
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

    const qb = knex("furniture").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();

    if (!existing) {
      return {
        success: false,
        code: "FURNITURE_NOT_FOUND",
        message: "Furniture item not found.",
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

    const [row] = await knex("furniture")
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
    logger.error("updateFurnitureStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update furniture status.",
    };
  }
};

module.exports = {
  listFurniture,
  getFurnitureById,
  createFurniture,
  updateFurniture,
  deleteFurniture,
  updateFurnitureStatus,
};
