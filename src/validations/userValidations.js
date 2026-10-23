const { body } = require("express-validator");

// Simple international phone pattern: + and digits, 8–15 chars
const MOBILE_REGEX = /^\+?[0-9]{8,15}$/;

const signup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 120 })
    .withMessage("Name must be at most 120 characters"),
  body("mobile")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(MOBILE_REGEX)
    .withMessage("Mobile must be 8–15 digits, optionally starting with +"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain at least one letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

const login = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfile = [
  body("name").optional().trim().isLength({ max: 120 }),
  body("mobile")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(MOBILE_REGEX)
    .withMessage("Mobile must be 8–15 digits, optionally starting with +"),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
  body("bio").optional().isLength({ max: 500 }),
  body("job_title").optional().isLength({ max: 120 }),
];

const changePassword = [
  body("old_password").notEmpty().withMessage("Current password is required"),
  body("new_password")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("New password must contain at least one letter")
    .matches(/\d/)
    .withMessage("New password must contain at least one number"),
];

module.exports = {
  signup,
  login,
  updateProfile,
  changePassword,
};
