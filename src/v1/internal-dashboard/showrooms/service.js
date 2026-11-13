const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateShowroomCode } = require("../../../utils/codeGenerator");
const {
  isUUID,
  generateUniqueSlug,
  serializeJsonb,
  calculateReadTime,
} = require("../../../utils/contentHelpers");

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

const listShowrooms = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("showroom_showcases").whereNull("deleted_at");
    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.is_featured !== undefined)
      qb.where({ is_featured: query.is_featured });
    if (query.brand) qb.where("brand", "ilike", `%${query.brand}%`);
    if (query.city) qb.where({ city: query.city });

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) =>
        b.where("title", "ilike", term).orWhere("brand", "ilike", term),
      );
    }

    const [rows, countRow] = await Promise.all([
      qb
        .clone()
        .select("*")
        .orderBy(sortField, sortDir)
        .offset(skip)
        .limit(limit),
      qb.clone().count("* as count").first(),
    ]);

    return {
      success: true,
      data: {
        showrooms: rows,
        pagination: {
          page,
          limit,
          total: parseInt(countRow.count, 10),
          totalPages: Math.ceil(parseInt(countRow.count, 10) / limit),
        },
      },
    };
  } catch (error) {
    logger.error("internal listShowrooms error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch showrooms.",
    };
  }
};

const getShowroomById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const qb = knex("showroom_showcases").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row)
      return {
        success: false,
        code: "SHOWROOM_NOT_FOUND",
        message: "Showroom not found.",
      };
    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch showroom.",
    };
  }
};

const createShowroom = async (payload, userId) => {
  const MAX_RETRIES = 3;
  try {
    if (!isUUID(userId))
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid author id.",
      };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const slug = await generateUniqueSlug(
          knex,
          "showroom_showcases",
          payload.slug || payload.title,
        );
        const readTime =
          payload.read_time !== undefined
            ? payload.read_time
            : calculateReadTime(payload.content);

        const insertData = {
          code: generateShowroomCode(),
          slug,
          title: payload.title,
          excerpt: payload.excerpt ?? null,
          content: payload.content ?? null,
          read_time: readTime,
          category: knex.raw("?::text[]", [
            cleanStringArray(payload.category, 100),
          ]),
          tags: knex.raw("?::text[]", [cleanStringArray(payload.tags, 50)]),
          brand: payload.brand ?? null,
          address: payload.address ?? null,
          city: payload.city ?? null,
          country: payload.country ?? null,
          contact_phone: payload.contact_phone ?? null,
          contact_email: payload.contact_email ?? null,
          website_url: payload.website_url ?? null,
          opening_hours: serializeJsonb(payload.opening_hours, {}),
          coordinates: serializeJsonb(payload.coordinates, {}),
          featured_image_url: payload.featured_image_url ?? null,
          gallery: serializeJsonb(payload.gallery, []),
          layout_type: payload.layout_type ?? "card",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          is_featured:
            payload.is_featured !== undefined ? payload.is_featured : false,
          status: payload.status ?? "draft",
          published_at: payload.status === "published" ? knex.fn.now() : null,
          extra: serializeJsonb(payload.extra, {}),
          author_id: userId,
        };

        const [row] = await knex("showroom_showcases")
          .insert(insertData)
          .returning("*");
        return { success: true, data: row };
      } catch (err) {
        if (err.code === "23505" && attempt < MAX_RETRIES - 1) continue;
        throw err;
      }
    }
    return {
      success: false,
      code: "CODE_GEN_FAILED",
      message: "Could not generate unique code/slug.",
    };
  } catch (error) {
    logger.error("internal createShowroom error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create showroom.",
    };
  }
};

const updateShowroom = async (id, payload) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const existing = await knex("showroom_showcases")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing)
      return {
        success: false,
        code: "SHOWROOM_NOT_FOUND",
        message: "Showroom not found.",
      };

    const allowed = [
      "title",
      "excerpt",
      "content",
      "read_time",
      "brand",
      "address",
      "city",
      "country",
      "contact_phone",
      "contact_email",
      "website_url",
      "featured_image_url",
      "layout_type",
      "is_active",
      "is_featured",
      "status",
    ];
    const updates = {};
    for (const key of allowed)
      if (payload[key] !== undefined) updates[key] = payload[key];

    if (payload.category !== undefined)
      updates.category = knex.raw("?::text[]", [
        cleanStringArray(payload.category, 100),
      ]);
    if (payload.tags !== undefined)
      updates.tags = knex.raw("?::text[]", [
        cleanStringArray(payload.tags, 50),
      ]);
    if (payload.opening_hours !== undefined)
      updates.opening_hours = serializeJsonb(payload.opening_hours, {});
    if (payload.coordinates !== undefined)
      updates.coordinates = serializeJsonb(payload.coordinates, {});
    if (payload.gallery !== undefined)
      updates.gallery = serializeJsonb(payload.gallery, []);
    if (payload.extra !== undefined)
      updates.extra = serializeJsonb(payload.extra, {});

    if (payload.slug !== undefined && payload.slug !== existing.slug)
      updates.slug = await generateUniqueSlug(
        knex,
        "showroom_showcases",
        payload.slug,
        id,
      );
    if (payload.content !== undefined && payload.read_time === undefined)
      updates.read_time = calculateReadTime(payload.content);
    if (payload.status === "published" && existing.status !== "published")
      updates.published_at = existing.published_at || knex.fn.now();

    if (Object.keys(updates).length === 0)
      return {
        success: false,
        code: "NO_CHANGES",
        message: "No valid fields to update.",
      };
    updates.updated_at = knex.fn.now();

    const [row] = await knex("showroom_showcases")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505")
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "Slug already exists.",
      };
    logger.error("internal updateShowroom error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update showroom.",
    };
  }
};

const deleteShowroom = async (id) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const [row] = await knex("showroom_showcases")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");
    if (!row)
      return {
        success: false,
        code: "SHOWROOM_NOT_FOUND",
        message: "Showroom not found or deleted.",
      };
    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete showroom.",
    };
  }
};

const updateShowroomStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const qb = knex("showroom_showcases").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();
    if (!existing)
      return {
        success: false,
        code: "SHOWROOM_NOT_FOUND",
        message: "Showroom not found.",
      };

    const newStatus = status !== undefined ? status : existing.status;
    if (
      existing.status === newStatus &&
      (!restore || existing.deleted_at === null)
    )
      return { success: true, data: existing, unchanged: true };

    const updates = { status: newStatus, updated_at: knex.fn.now() };
    if (newStatus === "published" && !existing.published_at)
      updates.published_at = knex.fn.now();
    if (restore && existing.deleted_at) updates.deleted_at = null;

    const [row] = await knex("showroom_showcases")
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
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update status.",
    };
  }
};

module.exports = {
  listShowrooms,
  getShowroomById,
  createShowroom,
  updateShowroom,
  deleteShowroom,
  updateShowroomStatus,
};
