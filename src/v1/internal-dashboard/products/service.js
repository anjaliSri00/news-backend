/**
 * Dashboard products service — full CRUD.
 * Access enforced by middleware (requireAccess).
 */
const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger");
const { generateProductCode } = require("../../../utils/codeGenerator");
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
 * Clean dimensions — must be numbers, positive
 * ══════════════════════════════════════════════════════════ */
const cleanDimensions = (dim) => {
  if (!dim || typeof dim !== "object" || Array.isArray(dim)) return {};
  const out = {};
  for (const key of ["width", "height", "depth", "weight"]) {
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
 * Clean variants — each item normalized
 * ══════════════════════════════════════════════════════════ */
const cleanVariants = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const out = {};
      if (v.name && typeof v.name === "string") {
        out.name = v.name.trim().substring(0, 100);
      }
      if (v.sku && typeof v.sku === "string") {
        out.sku = v.sku.trim().substring(0, 100);
      }
      if (v.price !== undefined && v.price !== null) {
        const price = parseFloat(v.price);
        if (!isNaN(price) && price >= 0) out.price = price;
      }
      if (v.stock !== undefined && v.stock !== null) {
        const stock = parseInt(v.stock, 10);
        if (!isNaN(stock) && stock >= 0) out.stock = stock;
      }
      if (
        v.attributes &&
        typeof v.attributes === "object" &&
        !Array.isArray(v.attributes)
      ) {
        out.attributes = v.attributes;
      }
      return Object.keys(out).length > 0 ? out : null;
    })
    .filter((v) => v !== null);
};

/* ══════════════════════════════════════════════════════════
 * List
 * ══════════════════════════════════════════════════════════ */
const listProducts = async (query) => {
  try {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;
    const sort = query.sort || "-created_at";
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortDir = sort.startsWith("-") ? "desc" : "asc";

    const qb = knex("products").whereNull("deleted_at");

    if (query.status) qb.where({ status: query.status });
    if (query.is_active !== undefined) qb.where({ is_active: query.is_active });
    if (query.layout_type) qb.where({ layout_type: query.layout_type });
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
    if (query.author_id) qb.where({ author_id: query.author_id });
    if (query.from_date) qb.where("created_at", ">=", query.from_date);
    if (query.to_date) qb.where("created_at", "<=", query.to_date);

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
    logger.error("internal listProducts error", { error: error.message });
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
const getProductById = async (id, { includeDeleted = false } = {}) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid product id.",
      };
    }
    const qb = knex("products").where({ id });
    if (!includeDeleted) qb.whereNull("deleted_at");
    const row = await qb.first();
    if (!row) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal getProductById error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch product.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Create
 * ══════════════════════════════════════════════════════════ */
const createProduct = async (payload, userId) => {
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
        const slug = await generateUniqueSlug(knex, "products", baseSlug);
        const code = generateProductCode();

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
          brand: payload.brand ?? null,
          sku: payload.sku ?? null,
          price: payload.price ?? null,
          currency: payload.currency ?? "USD",
          availability: payload.availability ?? "in_stock",
          material: payload.material ?? null,
          color: payload.color ?? null,
          style: payload.style ?? null,
          dimensions: serializeJsonb(cleanDimensions(payload.dimensions), {}),
          specifications: serializeJsonb(payload.specifications, {}),
          variants: serializeJsonb(cleanVariants(payload.variants), []),
          launch_date: payload.launch_date ?? null,
          warranty: payload.warranty ?? null,
          featured_image_url: payload.featured_image_url ?? null,
          gallery: serializeJsonb(payload.gallery, []),
          layout_type: payload.layout_type ?? "card",
          is_active: payload.is_active !== undefined ? payload.is_active : true,
          status: payload.status ?? "draft",
          published_at: isPublished ? knex.fn.now() : null,
          extra: serializeJsonb(payload.extra, {}),
          author_id: userId,
        };

        const [row] = await knex("products").insert(insertData).returning("*");
        return { success: true, data: row };
      } catch (err) {
        if (err.code === "23505") {
          const detail = err.detail || "";
          if (detail.includes("sku")) {
            return {
              success: false,
              code: "SKU_EXISTS",
              message: "A product with this SKU already exists.",
            };
          }
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
    logger.error("internal createProduct error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create product.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update
 * ══════════════════════════════════════════════════════════ */
const updateProduct = async (id, payload) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid product id.",
      };
    }
    const existing = await knex("products")
      .where({ id })
      .whereNull("deleted_at")
      .first();
    if (!existing) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      };
    }

    const allowed = [
      "title",
      "excerpt",
      "content",
      "read_time",
      "brand",
      "sku",
      "price",
      "currency",
      "availability",
      "material",
      "color",
      "style",
      "launch_date",
      "warranty",
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
    if (payload.specifications !== undefined) {
      updates.specifications = serializeJsonb(payload.specifications, {});
    }
    if (payload.variants !== undefined) {
      updates.variants = serializeJsonb(cleanVariants(payload.variants), []);
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
        "products",
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

    const [row] = await knex("products")
      .where({ id })
      .update(updates)
      .returning("*");
    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      const detail = error.detail || "";
      if (detail.includes("sku")) {
        return {
          success: false,
          code: "SKU_EXISTS",
          message: "A product with this SKU already exists.",
        };
      }
      return {
        success: false,
        code: "SLUG_EXISTS",
        message: "A product with this slug already exists.",
      };
    }
    logger.error("internal updateProduct error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update product.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Soft delete
 * ══════════════════════════════════════════════════════════ */
const deleteProduct = async (id) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid product id.",
      };
    }
    const [row] = await knex("products")
      .where({ id })
      .whereNull("deleted_at")
      .update({ deleted_at: knex.fn.now(), updated_at: knex.fn.now() })
      .returning("id", "code", "slug", "title");

    if (!row) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found or already deleted.",
      };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error("internal deleteProduct error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to delete product.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Update status (unified)
 * ══════════════════════════════════════════════════════════ */
const updateProductStatus = async (id, { status, restore = false }) => {
  try {
    if (!isUUID(id)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid product id.",
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

    const qb = knex("products").where({ id });
    if (!restore) qb.whereNull("deleted_at");
    const existing = await qb.first();

    if (!existing) {
      return {
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
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

    const [row] = await knex("products")
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
    logger.error("updateProductStatus error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to update product status.",
    };
  }
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
};
