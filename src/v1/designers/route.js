const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/designerValidations");

/* ══════════════════════════════════════════════════════════
 * PUBLIC — no authentication required.
 * Only published + is_active + not-deleted designers visible.
 * ══════════════════════════════════════════════════════════ */

// List with filters, search, pagination
router.get("/", validate(v.listDesigners), controller.list);

// Get by slug (SEO-friendly URL: /designers/zaha-hadid)
router.get("/slug/:slug", validate(v.designerSlugParam), controller.getBySlug);

// Get by UUID
router.get("/:id", validate(v.designerIdParam), controller.getById);

module.exports = router;
