const { body, param, query } = require("express-validator");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ["draft", "published", "archived"];
const CURRENT_YEAR = new Date().getFullYear();

/* ══════════════════════════════════════════════════════════
 * CREATE
 * ══════════════════════════════════════════════════════════ */
const createFurniture = [
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

  body("designer")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),

  body("brand")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),

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
  body("dimensions.unit")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 20 }),

  body("price_range")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body("year")
    .optional({ nullable: true })
    .isInt({ min: 1900, max: CURRENT_YEAR + 1 })
    .withMessage(`Year must be 1900–${CURRENT_YEAR + 1}`)
    .toInt(),

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

  body("extra").optional().isObject().withMessage("extra must be an object"),
];

/* ══════════════════════════════════════════════════════════
 * UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateFurniture = [
  param("id").isUUID().withMessage("Invalid furniture id"),
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
  body("designer")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
  body("brand")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
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
  body("dimensions.unit")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 20 }),
  body("price_range")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),
  body("year")
    .optional({ nullable: true })
    .isInt({ min: 1900, max: CURRENT_YEAR + 1 })
    .toInt(),
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
const listFurniture = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(STATUSES),
  query("is_active").optional().isBoolean().toBoolean(),
  query("layout_type").optional().isString().trim().isLength({ max: 20 }),
  query("category").optional().isString().trim().isLength({ max: 100 }),
  query("tag").optional().isString().trim().isLength({ max: 50 }),
  query("designer").optional().isString().trim().isLength({ max: 200 }),
  query("brand").optional().isString().trim().isLength({ max: 200 }),
  query("style").optional().isString().trim().isLength({ max: 100 }),
  query("material").optional().isString().trim().isLength({ max: 200 }),
  query("color").optional().isString().trim().isLength({ max: 100 }),
  query("year").optional().isInt({ min: 1900 }).toInt(),
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
      "-year",
      "year",
      "title",
      "-title",
    ]),
];

/* ══════════════════════════════════════════════════════════
 * STATUS UPDATE
 * ══════════════════════════════════════════════════════════ */
const updateFurnitureStatus = [
  param("id").isUUID().withMessage("Invalid furniture id"),
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
const furnitureIdParam = [
  param("id").isUUID().withMessage("Invalid furniture id"),
];
const furnitureSlugParam = [
  param("slug")
    .trim()
    .isLength({ min: 1, max: 220 })
    .withMessage("Invalid slug"),
];

module.exports = {
  createFurniture,
  updateFurniture,
  listFurniture,
  updateFurnitureStatus,
  furnitureIdParam,
  furnitureSlugParam,
};
