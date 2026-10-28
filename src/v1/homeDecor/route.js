const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const validationArray = require("../../validations/homeDecorValidation");

/* ══════════════════════════════════════════════════════════
 * PUBLIC — no auth
 * ══════════════════════════════════════════════════════════ */
router.get("/", validate(validationArray.listHomeDecor), controller.list);

router.get(
  "/slug/:slug",
  validate(validationArray.homeDecorSlugParam),
  controller.getBySlug,
);

router.get(
  "/:id",
  validate(validationArray.homeDecorIdParam),
  controller.getById,
);

router.post(
  "/:id/views",
  validate(validationArray.homeDecorIdParam),
  controller.incrementViews,
);

router.post(
  "/:id/likes",
  validate(validationArray.homeDecorIdParam),
  controller.incrementLikes,
);

module.exports = router;
