const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/furnitureValidations");

/* ══════════════════════════════════════════════════════════
 * PUBLIC — no auth required
 * ══════════════════════════════════════════════════════════ */
router.get("/", validate(v.listFurniture), controller.list);
router.get("/slug/:slug", validate(v.furnitureSlugParam), controller.getBySlug);
router.get("/:id", validate(v.furnitureIdParam), controller.getById);
router.post(
  "/:id/views",
  validate(v.furnitureIdParam),
  controller.incrementViews,
);

module.exports = router;
