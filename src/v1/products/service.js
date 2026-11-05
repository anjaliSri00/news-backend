/**
 * Public products service — read-only for visitors.
 * Only published + is_active + not-deleted products visible.
 */
const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { isUUID } = require("../../utils/contentHelpers");

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
  "sku",
  "price",
  "currency",
  "availability",
  "material",
  "color",
  "style",
  "dimensions",
  "specifications",
  "variants",
  "launch_date",
  "warranty",
  "featured_image_url",
  "gallery",
  "layout_type",
  "published_at",
  "views",
  "extra",
];

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listProducts = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-published_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("products")
      .where({ status: "published", is_active: true })
      .whereNull("deleted_at");

    if (query.category) qb.whereRaw("? = ANY(category)", [query.category]);
    if (query.tag) qb.whereRaw("? = ANY(tags)", [query.tag]);
    if (query.brand) qb.where({ brand: query.brand });
    if (query.style) qb.where({ style: query.style });
    if (query.material) qb.where("material", "ilike", `%${query.material}%`);
    if (query.color) qb.where("color", "ilike", `%${query.color}%`);
    if (query.availability) qb.where({ availability: query.availability });
    if (query.currency) qb.where({ currency: query.currency });
    if (query.min_price !== undefined) qb.where("price", ">=", query.min_price);
    if (query.max_price !== undefined) qb.where("price", "<=", query.max_price);
    if (query.from_date) qb.where("published_at", ">=", query.from_date);
    if (query.to_date) qb.where("published_at", "<=", query.to_date);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.where((b) => {
        b.where("title", "ilike", term)
          .orWhere("excerpt", "ilike", term)
          .orWhere("content", "ilike", term)
          .orWhere("brand", "ilike", term)
          .orWhere("sku", "ilike", term);
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
        products: rows,
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
    logger.error("public listProducts error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch products.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by ID
 * ══════════════════════════════════════════════════════════ */
const getProductById = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid product id.",
      };
    }
    const row = await knex("products")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getProductById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch product.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Get by slug
 * ══════════════════════════════════════════════════════════ */
const getProductBySlug = async (slug) => {
  try {
    if (!slug || typeof slug !== "string") {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid slug.",
      };
    }
    const row = await knex("products")
      .where({ slug, status: "published", is_active: true })
      .whereNull("deleted_at")
      .first();
    if (!row) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("public getProductBySlug error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch product.",
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
        message: "Invalid product id.",
      };
    }
    const updated = await knex("products")
      .where({ id, status: "published", is_active: true })
      .whereNull("deleted_at")
      .increment("views", 1);
    if (!updated) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      };
    }
    const row = await knex("products").where({ id }).select("views").first();
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

module.exports = {
  listProducts,
  getProductById,
  getProductBySlug,
  incrementViews,
};
