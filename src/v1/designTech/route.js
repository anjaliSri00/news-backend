const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/designTechValidations");

/* ══════════════════════════════════════════════════════════
 * PUBLIC — no auth required
 * ══════════════════════════════════════════════════════════ */
router.get("/", validate(v.listDesignTech), controller.list);
router.get(
  "/slug/:slug",
  validate(v.designTechSlugParam),
  controller.getBySlug,
);
router.get("/:id", validate(v.designTechIdParam), controller.getById);
router.post(
  "/:id/views",
  validate(v.designTechIdParam),
  controller.incrementViews,
);

module.exports = router;
