const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ["draft", "published", "archived"];

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createDesignTech = [
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

  body("content")
    .optional({ nullable: true })
    .isString()
    .withMessage("Content must be a string"),

  body("read_time")
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage("Read time must be 1–300 minutes")
    .toInt(),

  body("category")
    .optional()
    .isArray()
    .withMessage("Category must be an array"),

  body("category.*")
    .optional()
    .isString()
    .withMessage("Each category must be a string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Category must be 1–100 characters"),

  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Featured image URL must be valid"),

  body("layout_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 })
    .withMessage("Layout type max 20 characters"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
    .toBoolean(),

  body("status").optional().isIn(STATUSES).withMessage("Invalid status"),

  body("extra").optional().isObject().withMessage("extra must be an object"),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateDesignTech = [
  param("id").isUUID().withMessage("Invalid design tech id"),
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
  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL(),
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
const listDesignTech = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("layout_type").optional().isString().trim().isLength({ max: 20 }),
  query("category").optional().isString().trim().isLength({ max: 100 }),
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
      "-read_time",
      "read_time",
      "title",
      "-title",
    ]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateDesignTechStatus = [
  param("id").isUUID().withMessage("Invalid design tech id"),
  body("status")
    .optional()
    .isIn(STATUSES)
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
const designTechIdParam = [
  param("id").isUUID().withMessage("Invalid design tech id"),
];
const designTechSlugParam = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 220 })
    .withMessage("Invalid slug"),
];

module.exports = {
  createDesignTech,
  updateDesignTech,
  listDesignTech,
  updateDesignTechStatus,
  designTechIdParam,
  designTechSlugParam,
};
