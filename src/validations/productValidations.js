const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ["draft", "published", "archived"];
const AVAILABILITY = ["in_stock", "out_of_stock", "preorder", "discontinued"];
const CURRENCY_REGEX = /^[A-Z]{3}$/;

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createProduct = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be 3–200 characters"),

  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 220 })
    .matches(slugPattern)
    .withMessage("Slug must be lowercase alphanumeric with hyphens"),

  body("excerpt").optional({ nullable: true }).isLength({ max: 500 }),

  body("content").optional({ nullable: true }).isString(),

  body("read_time").optional().isInt({ min: 1, max: 300 }).toInt(),

  body("category")
    .optional()
    .isArray()
    .withMessage("Category must be an array"),
  body("category.*").optional().isString().isLength({ min: 1, max: 100 }),

  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().isLength({ min: 1, max: 50 }),

  body("brand")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),

  body("sku")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("SKU must be 2–100 characters")
    .matches(/^[A-Za-z0-9\-_]+$/)
    .withMessage("SKU can only contain letters, numbers, - and _"),

  body("price")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number")
    .toFloat(),

  body("currency")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toUpperCase()
    .matches(CURRENCY_REGEX)
    .withMessage("Currency must be 3 uppercase letters (e.g. USD)"),

  body("availability")
    .optional()
    .isIn(AVAILABILITY)
    .withMessage(
      "Availability must be: in_stock, out_of_stock, preorder, or discontinued",
    ),

  body("material")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),

  body("color")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body("style")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body("dimensions")
    .optional()
    .isObject()
    .withMessage("Dimensions must be an object"),
  body("dimensions.width").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.height").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.depth").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.weight").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.unit")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 20 }),

  body("specifications")
    .optional()
    .isObject()
    .withMessage("Specifications must be an object"),

  body("variants")
    .optional()
    .isArray()
    .withMessage("Variants must be an array"),
  body("variants.*.name").optional().isString().isLength({ min: 1, max: 100 }),
  body("variants.*.sku").optional().isString().isLength({ min: 2, max: 100 }),
  body("variants.*.price")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .toFloat(),
  body("variants.*.stock")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .toInt(),
  body("variants.*.attributes").optional().isObject(),

  body("launch_date").optional({ nullable: true }).isISO8601(),

  body("warranty")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),

  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL(),

  body("gallery").optional().isArray(),
  body("gallery.*.url").optional().isURL(),
  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),
  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),

  body("layout_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 }),

  body("is_active").optional().isBoolean().toBoolean(),

  body("status").optional().isIn(STATUSES).withMessage("Invalid status"),

  body("extra").optional().isObject(),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateProduct = [
  param("id").isUUID().withMessage("Invalid product id"),
  body("title").optional().trim().isLength({ min: 3, max: 200 }),
  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 220 })
    .matches(slugPattern),
  body("excerpt").optional({ nullable: true }).isLength({ max: 500 }),
  body("content").optional({ nullable: true }).isString(),
  body("read_time").optional().isInt({ min: 1, max: 300 }).toInt(),
  body("category").optional().isArray(),
  body("category.*").optional().isString().isLength({ min: 1, max: 100 }),
  body("tags").optional().isArray(),
  body("tags.*").optional().isString().isLength({ min: 1, max: 50 }),
  body("brand")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
  body("sku")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[A-Za-z0-9\-_]+$/),
  body("price").optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
  body("currency")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .toUpperCase()
    .matches(CURRENCY_REGEX),
  body("availability").optional().isIn(AVAILABILITY),
  body("material")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
  body("color")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),
  body("style")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),
  body("dimensions").optional().isObject(),
  body("dimensions.width").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.height").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.depth").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.weight").optional({ nullable: true }).isFloat({ min: 0 }),
  body("dimensions.unit")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 20 }),
  body("specifications").optional().isObject(),
  body("variants").optional().isArray(),
  body("variants.*.name").optional().isString().isLength({ min: 1, max: 100 }),
  body("variants.*.sku").optional().isString().isLength({ min: 2, max: 100 }),
  body("variants.*.price")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .toFloat(),
  body("variants.*.stock")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .toInt(),
  body("variants.*.attributes").optional().isObject(),
  body("launch_date").optional({ nullable: true }).isISO8601(),
  body("warranty")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL(),
  body("gallery").optional().isArray(),
  body("gallery.*.url").optional().isURL(),
  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),
  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),
  body("layout_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 }),
  body("is_active").optional().isBoolean().toBoolean(),
  body("status").optional().isIn(STATUSES),
  body("extra").optional().isObject(),
];

/* ══════════════════════════════════════════════════════════
 * LIST
 * ══════════════════════════════════════════════════════════ */
const listProducts = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("layout_type").optional().isString().trim().isLength({ max: 20 }),
  query("category").optional().isString().trim().isLength({ max: 100 }),
  query("tag").optional().isString().trim().isLength({ max: 50 }),
  query("brand").optional().isString().trim().isLength({ max: 200 }),
  query("style").optional().isString().trim().isLength({ max: 100 }),
  query("material").optional().isString().trim().isLength({ max: 200 }),
  query("color").optional().isString().trim().isLength({ max: 100 }),
  query("availability").optional().isIn(AVAILABILITY),
  query("min_price").optional().isFloat({ min: 0 }).toFloat(),
  query("max_price").optional().isFloat({ min: 0 }).toFloat(),
  query("currency").optional().trim().toUpperCase().matches(CURRENCY_REGEX),
  query("search").optional().isString().trim().isLength({ max: 200 }),
  query("author_id").optional().isUUID(),
  query("from_date").optional().isISO8601(),
  query("to_date").optional().isISO8601(),
  query("sort")
    .optional()
    .isIn([
      "-published_at",
      "published_at",
      "-created_at",
      "created_at",
      "-views",
      "views",
      "-price",
      "price",
      "title",
      "-title",
      "-launch_date",
      "launch_date",
    ]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateProductStatus = [
  param("id").isUUID().withMessage("Invalid product id"),
  body("status").optional().isIn(STATUSES),
  body("restore").optional().isBoolean(),
  body().custom((_, { req }) => {
    if (!req.body.status && req.body.restore !== true) {
      throw new Error("Either status or restore:true must be provided.");
    }
    return true;
  }),
];

/* ══════════════════════════════════════════════════════════
 * PARAMS
 * ══════════════════════════════════════════════════════════ */
const productIdParam = [param("id").isUUID().withMessage("Invalid product id")];
const productSlugParam = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 220 })
    .withMessage("Invalid slug"),
];

module.exports = {
  createProduct,
  updateProduct,
  listProducts,
  updateProductStatus,
  productIdParam,
  productSlugParam,
};
