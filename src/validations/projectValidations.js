const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ["draft", "published", "archived"];
const PROJECT_TYPES = [
  "residential",
  "commercial",
  "hospitality",
  "public",
  "industrial",
  "mixed_use",
  "other",
];
const PROJECT_STATUSES = [
  "concept",
  "in_progress",
  "completed",
  "on_hold",
  "cancelled",
];
const AREA_UNITS = ["sqm", "sqft", "sqkm", "sqmi", "acre", "hectare"];
const CURRENT_YEAR = new Date().getFullYear();

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createProject = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 }),
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

  body("project_type")
    .optional()
    .isIn(PROJECT_TYPES)
    .withMessage("Invalid project type"),
  body("project_status")
    .optional()
    .isIn(PROJECT_STATUSES)
    .withMessage("Invalid project status"),
  body("location")
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

  body("area").optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
  body("area_unit")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isIn(AREA_UNITS),
  body("year")
    .optional({ nullable: true })
    .isInt({ min: 1900, max: CURRENT_YEAR + 10 })
    .toInt(),
  body("completion_date").optional({ nullable: true }).isISO8601(),

  body("architect")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
  body("client")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
  body("style")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body("materials").optional().isArray(),
  body("materials.*").optional().isString().isLength({ min: 1, max: 100 }),
  body("awards").optional().isArray(),
  body("awards.*").optional().isString().isLength({ min: 1, max: 200 }),

  body("floor_plans").optional().isArray(),
  body("floor_plans.*.url").optional().isURL(),
  body("floor_plans.*.title").optional({ nullable: true }).isString(),
  body("floor_plans.*.level").optional({ nullable: true }).isString(),

  body("team_size").optional({ nullable: true }).isInt({ min: 0 }).toInt(),
  body("budget_range")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),
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
const updateProject = [
  param("id").isUUID().withMessage("Invalid project id"),
  ...createProject.map((validator) => validator.optional()), // Make all create rules optional for update
];

/* ══════════════════════════════════════════════════════════
 * LIST
 * ══════════════════════════════════════════════════════════ */
const listProjects = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("category").optional().isString().trim(),
  query("tag").optional().isString().trim(),
  query("material").optional().isString().trim(),
  query("award").optional().isString().trim(),
  query("project_type").optional().isIn(PROJECT_TYPES),
  query("project_status").optional().isIn(PROJECT_STATUSES),
  query("city").optional().isString().trim(),
  query("country").optional().isString().trim(),
  query("architect").optional().isString().trim(),
  query("year").optional().isInt().toInt(),
  query("min_area").optional().isFloat({ min: 0 }).toFloat(),
  query("max_area").optional().isFloat({ min: 0 }).toFloat(),
  query("search").optional().isString().trim(),
  query("author_id").optional().isUUID(),
  query("sort")
    .optional()
    .isIn(["-published_at", "published_at", "-created_at", "-views", "title"]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS & PARAMS
 * ══════════════════════════════════════════════════════════ */
const updateProjectStatus = [
  param("id").isUUID().withMessage("Invalid project id"),
  body("status").optional().isIn(STATUSES),
  body("restore").optional().isBoolean(),
  body().custom((_, { req }) => {
    if (!req.body.status && req.body.restore !== true)
      throw new Error("Either status or restore:true must be provided.");
    return true;
  }),
];

const projectIdParam = [param("id").isUUID().withMessage("Invalid project id")];
const projectSlugParam = [param("slug").trim().isLength({ min: 1, max: 220 })];

module.exports = {
  createProject,
  updateProject,
  listProjects,
  updateProjectStatus,
  projectIdParam,
  projectSlugParam,
};
