const { body, param } = require("express-validator");

const updateUserInternal = [
  param("id").isUUID().withMessage("Invalid user id"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 120 })
    .withMessage("Name max 120 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Valid email required")
    .normalizeEmail(),

  body("mobile")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage("Mobile must be 8–20 digits"),

  body("user_type")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Invalid user type ID"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be boolean")
    .toBoolean(),

  body("is_superadmin")
    .optional()
    .isBoolean()
    .withMessage("is_superadmin must be boolean")
    .toBoolean(),

  body("job_title").optional({ nullable: true }).trim().isLength({ max: 120 }),

  body("bio").optional({ nullable: true }).trim().isLength({ max: 500 }),

  body("avatar")
    .optional({ nullable: true })
    .isString()
    .withMessage("Avatar must be a valid URL"),
];

const login = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { updateUserInternal, login };
