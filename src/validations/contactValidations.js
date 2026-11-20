const { body, param, query } = require("express-validator");

const STATUSES = ["unread", "read", "archived"];

/* ══════════════════════════════════════════════════════════
 * PUBLIC SUBMIT
 * ══════════════════════════════════════════════════════════ */
const submitContact = [
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ max: 150 })
    .withMessage("Name is too long"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("mobile")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("Mobile number is too long"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be between 10 and 5000 characters"),
];

/* ══════════════════════════════════════════════════════════
 * INTERNAL LIST
 * ══════════════════════════════════════════════════════════ */
const listContacts = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(STATUSES),
  query("search").optional().isString().trim(),
];

/* ══════════════════════════════════════════════════════════
 * INTERNAL UPDATE STATUS
 * ══════════════════════════════════════════════════════════ */
const updateContactStatus = [
  param("id").isUUID().withMessage("Invalid contact id"),
  body("status").notEmpty().withMessage("Status is required").isIn(STATUSES),
];

const idParam = [param("id").isUUID().withMessage("Invalid contact id")];

module.exports = {
  submitContact,
  listContacts,
  updateContactStatus,
  idParam,
};
