const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

const STATUSES = ["draft", "published", "archived"];
const TREND_CATEGORIES = [
  "color",
  "material",
  "style",
  "technology",
  "lifestyle",
  "furniture",
  "interior",
  "general",
];
const SEASONS = ["spring", "summer", "autumn", "winter", "all_year"];
const CONFIDENCE_LEVELS = ["low", "medium", "high"];


const CURRENT_YEAR = new Date().getFullYear();

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createTrend = [
  body("title")
    .trim().notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 200 }).withMessage("Title must be 3–200 characters"),

  body("slug")
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 220 }).matches(slugPattern)
    .withMessage("Slug must be lowercase alphanumeric with hyphens"),

  body("excerpt")
    .optional({ nullable: true }).isLength({ max: 500 }),

  body("content")
    .optional({ nullable: true }).isString(),

  body("forecast")
    .optional({ nullable: true }).isString(),

  body("read_time")
    .optional().isInt({ min: 1, max: 300 }).toInt(),

  body("category").optional().isArray().withMessage("Category must be an array"),
  body("category.*").optional().isString().isLength({ min: 1, max: 100 }),

  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().isLength({ min: 1, max: 50 }),

  body("trend_category")
    .optional()
    .isIn(TREND_CATEGORIES)
    .withMessage(
      "Trend category must be: color, material, style, technology, lifestyle, furniture, interior, or general"
    ),

  body("season")
    .optional()
    .isIn(SEASONS).withMessage("Season must be: spring, summer, autumn, winter, or all_year"),

  body("year")
    .optional({ nullable: true })
    .isInt({ min: 2000, max: 2100 }).withMessage("Year must be between 2000 and 2100")
    .toInt(),

  body("confidence_level")
    .optional()
    .isIn(CONFIDENCE_LEVELS).withMessage("Confidence level must be: low, medium, or high"),

  body("region")
    .optional()
    .isString()
    .withMessage(
      "Region must be a valid string"
    ),

  body("colors").optional().isArray().withMessage("Colors must be an array"),
  body("colors.*")
    .optional()
    .isString()
    .matches(hexColorPattern)
    .withMessage("Each color must be a valid hex code (#RRGGBB)"),

  body("materials").optional().isArray().withMessage("Materials must be an array"),
  body("materials.*").optional().isString().isLength({ min: 1, max: 100 }),

  body("styles").optional().isArray().withMessage("Styles must be an array"),
  body("styles.*").optional().isString().isLength({ min: 1, max: 100 }),

  body("sources").optional().isArray().withMessage("Sources must be an array"),
  body("sources.*").optional().isString().isLength({ min: 1, max: 500 }),

  body("related_trend_ids").optional().isArray().withMessage("related_trend_ids must be an array"),
  body("related_trend_ids.*").optional().isUUID().withMessage("Each related_trend_id must be a valid UUID"),

  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true }).isURL(),

  body("gallery").optional().isArray(),
  body("gallery.*.url").optional().isURL(),
  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),
  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),

  body("layout_type").optional({ nullable: true, checkFalsy: true }).isLength({ max: 20 }),

  body("is_active").optional().isBoolean().toBoolean(),

  body("status").optional().isIn(STATUSES).withMessage("Invalid status"),

  body("extra").optional().isObject(),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateTrend = [
  param("id").isUUID().withMessage("Invalid trend id"),
  body("title").optional().trim().isLength({ min: 3, max: 200 }),
  body("slug").optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 220 }).matches(slugPattern),
  body("excerpt").optional({ nullable: true }).isLength({ max: 500 }),
  body("content").optional({ nullable: true }).isString(),
  body("forecast").optional({ nullable: true }).isString(),
  body("read_time").optional().isInt({ min: 1, max: 300 }).toInt(),
  body("category").optional().isArray(),
  body("category.*").optional().isString().isLength({ min: 1, max: 100 }),
  body("tags").optional().isArray(),
  body("tags.*").optional().isString().isLength({ min: 1, max: 50 }),
  body("trend_category").optional().isIn(TREND_CATEGORIES),
  body("season").optional().isIn(SEASONS),
  body("year").optional({ nullable: true }).isInt({ min: 2000, max: 2100 }).toInt(),
  body("confidence_level").optional().isIn(CONFIDENCE_LEVELS),
  body("region").optional().isString() ,
  body("colors").optional().isArray(),
  body("colors.*").optional().isString().matches(hexColorPattern),
  body("materials").optional().isArray(),
  body("materials.*").optional().isString().isLength({ min: 1, max: 100 }),
  body("styles").optional().isArray(),
  body("styles.*").optional().isString().isLength({ min: 1, max: 100 }),
  body("sources").optional().isArray(),
  body("sources.*").optional().isString().isLength({ min: 1, max: 500 }),
  body("related_trend_ids").optional().isArray(),
  body("related_trend_ids.*").optional().isUUID(),
  body("featured_image_url").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("gallery").optional().isArray(),
  body("gallery.*.url").optional().isURL(),
  body("gallery.*.alt").optional({ nullable: true }).isLength({ max: 300 }),
  body("gallery.*.caption").optional({ nullable: true }).isLength({ max: 500 }),
  body("layout_type").optional({ nullable: true, checkFalsy: true }).isLength({ max: 20 }),
  body("is_active").optional().isBoolean().toBoolean(),
  body("status").optional().isIn(STATUSES),
  body("extra").optional().isObject(),
];

/* ══════════════════════════════════════════════════════════
 * LIST
 * ══════════════════════════════════════════════════════════ */
const listTrends = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("layout_type").optional().isString().trim().isLength({ max: 20 }),
  query("category").optional().isString().trim().isLength({ max: 100 }),
  query("tag").optional().isString().trim().isLength({ max: 50 }),
  query("trend_category").optional().isIn(TREND_CATEGORIES),
  query("season").optional().isIn(SEASONS),
  query("year").optional().isInt({ min: 2000, max: 2100 }).toInt(),
  query("confidence_level").optional().isIn(CONFIDENCE_LEVELS),
  query("region").optional().isString().trim().isLength({ max: 30 }),
  query("color").optional().isString().trim(),
  query("material").optional().isString().trim().isLength({ max: 100 }),
  query("style").optional().isString().trim().isLength({ max: 100 }),
  query("search").optional().isString().trim().isLength({ max: 200 }),
  query("author_id").optional().isUUID(),
  query("from_date").optional().isISO8601(),
  query("to_date").optional().isISO8601(),
  query("sort").optional().isIn([
    "-published_at", "published_at",
    "-created_at", "created_at",
    "-views", "views",
    "-year", "year",
    "title", "-title",
  ]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateTrendStatus = [
  param("id").isUUID().withMessage("Invalid trend id"),
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
const trendIdParam = [param("id").isUUID().withMessage("Invalid trend id")];
const trendSlugParam = [
  param("slug").trim().isLength({ min: 1, max: 220 }).withMessage("Invalid slug"),
];

module.exports = {
  createTrend,
  updateTrend,
  listTrends,
  updateTrendStatus,
  trendIdParam,
  trendSlugParam,
};