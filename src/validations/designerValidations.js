const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ["draft", "published", "archived"];

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createDesigner = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Name must be 2–200 characters"),

  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 220 })
    .withMessage("Slug max 220 characters")
    .matches(slugPattern)
    .withMessage("Slug must be lowercase alphanumeric with hyphens"),

  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Email must be valid")
    .isLength({ max: 255 })
    .withMessage("Email max 255 characters")
    .normalizeEmail(),

  body("excerpt")
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage("Excerpt max 500 characters"),

  body("bio")
    .optional({ nullable: true })
    .isString()
    .withMessage("Bio must be a string"),

  body("read_time")
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage("Read time must be 1–300 minutes")
    .toInt(),

  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),

  body("country")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),

  body("specialization")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Specialization max 200 characters"),

  body("portfolio_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Portfolio URL must be valid"),

  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Featured image URL must be valid"),

  body("avatar_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Avatar URL must be valid"),

  body("gallery").optional().isArray().withMessage("Gallery must be an array"),

  body("gallery.*.url")
    .optional()
    .isURL()
    .withMessage("Each gallery item must have a valid URL"),

  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),

  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),

  body("awards").optional().isArray().withMessage("Awards must be an array"),

  body("awards.*")
    .optional()
    .isString()
    .withMessage("Each award must be a string")
    .isLength({ min: 1, max: 200 })
    .withMessage("Award must be 1–200 characters"),

  body("status").optional().isIn(STATUSES).withMessage("Invalid status"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
    .toBoolean(),

  body("layout_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 })
    .withMessage("Layout type max 20 characters"),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateDesigner = [
  param("id").isUUID().withMessage("Invalid designer id"),

  body("name").optional().trim().isLength({ min: 2, max: 200 }),
  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 220 })
    .matches(slugPattern),
  body("email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .isLength({ max: 255 })
    .normalizeEmail(),
  body("excerpt").optional({ nullable: true }).isLength({ max: 500 }),
  body("bio").optional({ nullable: true }).isString(),
  body("read_time").optional().isInt({ min: 1, max: 300 }).toInt(),
  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),
  body("country")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),
  body("specialization")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
  body("portfolio_url").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL(),
  body("avatar_url").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("gallery").optional().isArray(),
  body("gallery.*.url").optional().isURL(),
  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),
  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),
  body("awards").optional().isArray(),
  body("awards.*").optional().isString().isLength({ min: 1, max: 200 }),
  body("status").optional().isIn(STATUSES),
  body("is_active").optional().isBoolean().toBoolean(),
  body("layout_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 }),
];

/* ══════════════════════════════════════════════════════════
 * LIST
 * ══════════════════════════════════════════════════════════ */
const listDesigners = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("search").optional().isString().trim().isLength({ max: 200 }),
  query("city").optional().isString().trim().isLength({ max: 120 }),
  query("country").optional().isString().trim().isLength({ max: 120 }),
  query("specialization").optional().isString().trim().isLength({ max: 200 }),
  query("award").optional().isString().trim().isLength({ max: 200 }),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("layout_type").optional().isString().trim().isLength({ max: 20 }),
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
      "name",
      "-name",
    ]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateDesignerStatus = [
  param("id").isUUID().withMessage("Invalid designer id"),
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
const designerIdParam = [
  param("id").isUUID().withMessage("Invalid designer id"),
];
const designerSlugParam = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 220 })
    .withMessage("Invalid slug"),
];

module.exports = {
  createDesigner,
  updateDesigner,
  listDesigners,
  updateDesignerStatus,
  designerIdParam,
  designerSlugParam,
};
