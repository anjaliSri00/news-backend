const { body, param, query } = require("express-validator");

const STATUSES = ["draft", "published", "archived"];

// Master list of all allowed types
const ALLOWED_TYPES = [
  "home_decor",
  "news",
  "designer",
  "design_tech",
  "furniture",
  "project",
  "product",
  "trend",
  "showroom",
  "editorial",
  "event",
];

const layoutPayloadRules = [
  body("badge").optional({ nullable: true }).trim().isLength({ max: 150 }),
  body("subtitle").optional({ nullable: true }).trim().isLength({ max: 300 }),
  body("status").optional().isIn(STATUSES),

  // Hero Left
  body("hero_left_type").optional({ nullable: true }).isIn(ALLOWED_TYPES),
  body("hero_left_id").optional({ nullable: true }).isUUID(),

  // Middle Top
  body("middle_top_type").optional({ nullable: true }).isIn(ALLOWED_TYPES),
  body("middle_top_id").optional({ nullable: true }).isUUID(),

  // Middle Bottom
  body("middle_bottom_type").optional({ nullable: true }).isIn(ALLOWED_TYPES),
  body("middle_bottom_id").optional({ nullable: true }).isUUID(),

  // Radar 1
  body("radar_1_type").optional({ nullable: true }).isIn(ALLOWED_TYPES),
  body("radar_1_id").optional({ nullable: true }).isUUID(),

  // Radar 2
  body("radar_2_type").optional({ nullable: true }).isIn(ALLOWED_TYPES),
  body("radar_2_id").optional({ nullable: true }).isUUID(),

  // Radar 3
  body("radar_3_type").optional({ nullable: true }).isIn(ALLOWED_TYPES),
  body("radar_3_id").optional({ nullable: true }).isUUID(),

  // Editor Note
  body("editor_note_type").optional({ nullable: true }).isIn(ALLOWED_TYPES),
  body("editor_note_id").optional({ nullable: true }).isUUID(),
];

const createLayout = [...layoutPayloadRules];
const updateLayout = [
  param("id").isUUID(),
  ...layoutPayloadRules.map((v) => v.optional()),
];

const updateStatus = [
  param("id").isUUID(),
  body("status").optional().isIn(STATUSES),
  body("restore").optional().isBoolean(),
  body().custom((_, { req }) => {
    if (!req.body.status && req.body.restore !== true)
      throw new Error("Either status or restore:true must be provided.");
    return true;
  }),
];

const listLayouts = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("status").optional().isIn(STATUSES),
];

const idParam = [param("id").isUUID()];

const getAvailableContent = [
  param("type").isIn(ALLOWED_TYPES).withMessage("Invalid content type."),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("search").optional().isString().trim().isLength({ max: 100 }),
];

module.exports = {
  createLayout,
  updateLayout,
  updateStatus,
  listLayouts,
  idParam,
  getAvailableContent,
};
