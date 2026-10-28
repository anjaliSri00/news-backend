const { body, param, query } = require("express-validator");

/* ──────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────── */
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ──────────────────────────────────────────────────────
 * CREATE
 * ────────────────────────────────────────────────────── */
const createEvent = [
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
    .isLength({ max: 120 })
    .withMessage("Category max 120 characters"),

  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid status"),

  body("event_type")
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage("Event type max 60 characters"),

  body("start_date")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Start date must be ISO8601"),

  body("end_date")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("End date must be ISO8601")
    .custom((value, { req }) => {
      if (!value || !req.body.start_date) return true;
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("venue")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 }),

  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 120 }),

  body("country")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 120 }),

  body("organizer")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 }),

  body("registration_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Registration URL must be valid"),

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

  body("gallery").optional().isArray().withMessage("Gallery must be an array"),

  body("gallery.*.url")
    .optional()
    .isURL()
    .withMessage("Each gallery item must have a valid URL"),

  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),

  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),

  body("seo").optional().isObject().withMessage("SEO must be an object"),

  body("extra").optional().isObject().withMessage("Extra must be an object"),
];

/* ──────────────────────────────────────────────────────
 * UPDATE — same rules, all optional
 * ────────────────────────────────────────────────────── */
const updateEvent = [
  param("id").isUUID().withMessage("Invalid event id"),

  body("title").optional().trim().isLength({ min: 3, max: 200 }),

  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 220 })
    .matches(slugPattern)
    .withMessage("Slug must be lowercase alphanumeric with hyphens"),

  body("excerpt").optional({ nullable: true }).isLength({ max: 500 }),
  body("content").optional().notEmpty(),
  body("featured_image").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("category")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 120 }),
  body("status").optional().isIn(["draft", "published", "archived"]),
  body("event_type").optional().trim().isLength({ max: 60 }),
  body("start_date").optional({ nullable: true }).isISO8601(),
  body("end_date")
    .optional({ nullable: true })
    .isISO8601()
    .custom((value, { req }) => {
      if (!value || !req.body.start_date) return true;
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("venue")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 }),
  body("city")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 120 }),
  body("country")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 120 }),
  body("organizer")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 }),
  body("registration_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL(),
  body("article_url").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("tags").optional().isArray(),
  body("tags.*").optional().isString().isLength({ min: 1, max: 50 }),
  body("gallery").optional().isArray(),
  body("gallery.*.url").optional().isURL(),
  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),
  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),
  body("seo").optional().isObject(),
  body("extra").optional().isObject(),
];

/* ──────────────────────────────────────────────────────
 * LIST — query
 * ────────────────────────────────────────────────────── */
const listEvents = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["draft", "published", "archived"]),
  query("category").optional().isString().trim().isLength({ max: 120 }),
  query("event_type").optional().isString().trim().isLength({ max: 60 }),
  query("search").optional().isString().trim().isLength({ max: 200 }),
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
      "title",
      "-title",
    ]),
];

/* ──────────────────────────────────────────────────────
 * PARAM
 * ────────────────────────────────────────────────────── */
const eventIdParam = [param("id").isUUID().withMessage("Invalid event id")];

const eventSlugParam = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 220 })
    .withMessage("Invalid slug"),
];

const updateEventStatus = [
  param("id").isUUID().withMessage("Invalid event id"),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Status must be draft, published, or archived"),
  body("restore")
    .optional()
    .isBoolean().withMessage("Restore must be boolean"),
  // At least one of status or restore must be present
  body().custom((_, { req }) => {
    if (!req.body.status && req.body.restore !== true) {
      throw new Error("Either status or restore:true must be provided.");
    }
    return true;
  }),
];

module.exports = {
  createEvent,
  updateEvent,
  listEvents,
  eventIdParam,
  eventSlugParam,
  updateEventStatus,
};
