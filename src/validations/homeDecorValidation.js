const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createHomeDecor = [
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
    .withMessage("Slug max 220 characters")
    .matches(slugPattern)
    .withMessage("Slug must be lowercase alphanumeric with hyphens"),

  body("excerpt")
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage("Excerpt max 500 characters"),

  body("content").notEmpty().withMessage("Content is required"),

  body("featured_image")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Featured image must be a valid URL"),

  body("category")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),

  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid status"),

  body("room_type")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 60 })
    .withMessage("Room type max 60 characters"),

  body("style")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Style max 100 characters"),

  body("article_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Article URL must be valid"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*")
    .optional()
    .isString()
    .withMessage("Each tag must be a string")
    .isLength({ min: 1, max: 50 })
    .withMessage("Tag must be 1–50 characters"),

  body("layout_type")
    .optional()
    .isIn(["featured", "compact", "medium"])
    .withMessage("Layout type must be featured, compact, or medium"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
    .toBoolean(),

  body("gallery").optional().isArray().withMessage("Gallery must be an array"),

  body("gallery.*.url")
    .optional()
    .isURL()
    .withMessage("Each gallery item must have a valid URL"),

  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),

  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),

  body("products_used")
    .optional()
    .isArray()
    .withMessage("products_used must be an array"),

  body("products_used.*.product_id")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Each products_used item must have a valid product_id"),

  body("products_used.*.note")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 300 }),

  body("seo").optional().isObject().withMessage("SEO must be an object"),

  body("extra").optional().isObject().withMessage("Extra must be an object"),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateHomeDecor = [
  param("id").isUUID().withMessage("Invalid home decor id"),

  body("title").optional().trim().isLength({ min: 3, max: 200 }),
  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 220 })
    .matches(slugPattern),
  body("excerpt").optional({ nullable: true }).isLength({ max: 500 }),
  body("content").optional().notEmpty(),
  body("featured_image").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("category")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 120 }),
  body("status").optional().isIn(["draft", "published", "archived"]),
  body("room_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 60 }),
  body("style")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 }),
  body("article_url").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("layout_type")
    .optional()
    .isIn(["featured", "compact", "medium"])
    .withMessage("Layout type must be featured, compact, or medium"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
    .toBoolean(),
  body("tags").optional().isArray(),
  body("tags.*").optional().isString().isLength({ min: 1, max: 50 }),
  body("gallery").optional().isArray(),
  body("gallery.*.url").optional().isURL(),
  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),
  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),
  body("products_used").optional().isArray(),
  body("products_used.*.product_id").optional({ nullable: true }).isUUID(),
  body("products_used.*.note")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 300 }),
  body("seo").optional().isObject(),
  body("extra").optional().isObject(),
];

/* ══════════════════════════════════════════════════════════
 * LIST
 * ══════════════════════════════════════════════════════════ */
const listHomeDecor = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["draft", "published", "archived"]),
  query("category").optional().isString().trim().isLength({ max: 120 }),
  query("room_type").optional().isString().trim().isLength({ max: 60 }),
  query("style").optional().isString().trim().isLength({ max: 100 }),
  query("layout_type").optional().isIn(["featured", "compact", "medium"]),
  query("search").optional().isString().trim().isLength({ max: 200 }),
  query("sort")
    .optional()
    .isIn([
      "-published_at",
      "published_at",
      "-created_at",
      "created_at",
      "-views",
      "views",
      "-likes",
      "likes",
      "title",
      "-title",
    ]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateHomeDecorStatus = [
  param("id").isUUID().withMessage("Invalid home decor id"),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Status must be draft, published, or archived"),
  body("restore").optional().isBoolean().withMessage("Restore must be boolean"),
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
const homeDecorIdParam = [
  param("id").isUUID().withMessage("Invalid home decor id"),
];
const homeDecorSlugParam = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 220 })
    .withMessage("Invalid slug"),
];

module.exports = {
  createHomeDecor,
  updateHomeDecor,
  listHomeDecor,
  updateHomeDecorStatus,
  homeDecorIdParam,
  homeDecorSlugParam,
};
