const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ["draft", "published", "archived"];

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createShowroom = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 2, max: 200 }),
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
  body("address")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 300 }),
  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),
  body("country")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 120 }),

  body("contact_phone")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 }),
  body("contact_email")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .normalizeEmail(),
  body("website_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Website must be a valid URL"),

  body("opening_hours")
    .optional()
    .isObject()
    .withMessage("Opening hours must be an object"),
  body("coordinates")
    .optional()
    .isObject()
    .withMessage("Coordinates must be an object"),

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
  body("is_featured").optional().isBoolean().toBoolean(),
  body("status").optional().isIn(STATUSES),
  body("extra").optional().isObject(),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateShowroom = [
  param("id").isUUID().withMessage("Invalid showroom id"),
  ...createShowroom.map((validator) => validator.optional()), // Make all rules optional
];

/* ══════════════════════════════════════════════════════════
 * LIST
 * ══════════════════════════════════════════════════════════ */
const listShowrooms = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("is_featured").optional().isBoolean().toBoolean(),
  query("brand").optional().isString().trim(),
  query("city").optional().isString().trim(),
  query("country").optional().isString().trim(),
  query("category").optional().isString().trim(),
  query("tag").optional().isString().trim(),
  query("search").optional().isString().trim(),
  query("sort")
    .optional()
    .isIn(["-published_at", "published_at", "-created_at", "title", "-views"]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS & PARAMS
 * ══════════════════════════════════════════════════════════ */
const updateShowroomStatus = [
  param("id").isUUID().withMessage("Invalid showroom id"),
  body("status").optional().isIn(STATUSES),
  body("restore").optional().isBoolean(),
  body().custom((_, { req }) => {
    if (!req.body.status && req.body.restore !== true)
      throw new Error("Either status or restore:true must be provided.");
    return true;
  }),
];

const showroomIdParam = [
  param("id").isUUID().withMessage("Invalid showroom id"),
];
const showroomSlugParam = [param("slug").trim().isLength({ min: 1, max: 220 })];

module.exports = {
  createShowroom,
  updateShowroom,
  listShowrooms,
  updateShowroomStatus,
  showroomIdParam,
  showroomSlugParam,
};
