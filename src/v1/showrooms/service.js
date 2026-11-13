const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { isUUID } = require("../../utils/contentHelper");

const PUBLIC_SELECT = [
  "id",
  "code",
  "title",
  "slug",
  "excerpt",
  "content",
  "read_time",
  "category",
  "tags",
  "brand",
  "address",
  "city",
  "country",
  "contact_phone",
  "contact_email",
  "website_url",
  "opening_hours",
  "coordinates",
  "featured_image_url",
  "gallery",
  "layout_type",
  "is_featured",
  "published_at",
  "views",
  "extra",
];

const listShowrooms = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("showroom_showcases")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.tag) qb.whereRaw("? = ANY(tags)", [query.tag]);
    if (query.brand) qb.where("brand", "ilike", `%${query.brand}%`);
    if (query.city) qb.where({ city: query.city });
    if (query.country) qb.where({ country: query.country });
    if (query.is_featured !== undefined)
      qb.where({ is_featured: query.is_featured });

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) =>
        b
          .where("title", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("brand", "ilike", term),
      );
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
        showrooms: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    logger.error("public listShowrooms error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch showrooms.",
    };
  }
};

const getShowroomById = async (id) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const row = await knex("showroom_showcases")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
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

const getShowroomBySlug = async (slug) => {
  try {
    const row = await knex("showroom_showcases")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
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

const incrementViews = async (id) => {
  try {
    if (!isUUID(id))
      return { success: false, code: "INVALID_INPUT", message: "Invalid id." };
    const updated = await knex("showroom_showcases")
      .where({ id, status: "published", is_active: true })
      .increment("views", 1);
    if (!updated)
      return {
        success: false,
        code: "SHOWROOM_NOT_FOUND",
        message: "Showroom not found.",
      };
    return {
      success: true,
      data: await knex("showroom_showcases")
        .where({ id })
        .select("views")
        .first(),
    };
  } catch (error) {
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to increment views.",
    };
  }
};

module.exports = {
  listShowrooms,
  getShowroomById,
  getShowroomBySlug,
  incrementViews,
};
