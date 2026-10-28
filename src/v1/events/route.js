const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const validationArray = require("../../validations/eventValidations");

/* ══════════════════════════════════════════════════════════
 * PUBLIC — no authentication, no access check
 * ══════════════════════════════════════════════════════════ */
router.get("/", validate(validationArray.listEvents), controller.list);

router.get(
  "/slug/:slug",
  validate(validationArray.eventSlugParam),
  controller.getBySlug,
);

router.get("/:id", validate(validationArray.eventIdParam), controller.getById);

router.post(
  "/:id/views",
  validate(validationArray.eventIdParam),
  controller.incrementViews,
);

router.post(
  "/:id/likes",
  validate(validationArray.eventIdParam),
  controller.incrementLikes,
);

module.exports = router;
