const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NEWS_TYPES = ["trending", "special", "latest"];
const STATUSES = ["draft", "published", "archived"];
const { NEWS_CATEGORIES } = require("../common/constants");

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createNews = [
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
    .isIn(NEWS_CATEGORIES)
    .withMessage(`Each category must be one of: ${NEWS_CATEGORIES.join(", ")}`),

  body("news_type")
    .optional()
    .isIn(NEWS_TYPES)
    .withMessage("News type must be trending, special, or latest"),

  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Featured image URL must be valid"),

  body("source")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 }),

  body("source_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage("Source URL must be valid"),

  body("layout_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 }),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
    .toBoolean(),

  body("status").optional().isIn(STATUSES).withMessage("Invalid status"),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateNews = [
  param("id").isUUID().withMessage("Invalid news id"),
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
  body("category.*")
    .optional()
    .isString()
    .withMessage("Each category must be a string")
    .isIn(NEWS_CATEGORIES)
    .withMessage(`Each category must be one of: ${NEWS_CATEGORIES.join(", ")}`),
  body("news_type").optional().isIn(NEWS_TYPES),
  body("featured_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .isURL(),
  body("source")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 }),
  body("source_url").optional({ nullable: true, checkFalsy: true }).isURL(),
  body("layout_type")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 20 }),
  body("is_active").optional().isBoolean().toBoolean(),
  body("status").optional().isIn(STATUSES),
];

/* ══════════════════════════════════════════════════════════
 * LIST
 * ══════════════════════════════════════════════════════════ */
const listNews = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("news_type")
    .optional()
    .isIn(NEWS_TYPES)
    .withMessage("news_type must be trending, special, or latest"),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("category").optional().isString().trim().isLength({ max: 100 }),
  query("search").optional().isString().trim().isLength({ max: 200 }),
  query("category")
    .optional()
    .isIn(NEWS_CATEGORIES)
    .withMessage(`category must be one of: ${NEWS_CATEGORIES.join(", ")}`),
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
      "title",
      "-title",
    ]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateNewsStatus = [
  param("id").isUUID().withMessage("Invalid news id"),
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
const newsIdParam = [param("id").isUUID().withMessage("Invalid news id")];
const newsSlugParam = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 220 })
    .withMessage("Invalid slug"),
];

module.exports = {
  createNews,
  updateNews,
  listNews,
  updateNewsStatus,
  newsIdParam,
  newsSlugParam,
};
