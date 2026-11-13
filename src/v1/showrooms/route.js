const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/showroomValidations");

router.get("/", validate(v.listShowrooms), controller.list);
router.get("/slug/:slug", validate(v.showroomSlugParam), controller.getBySlug);
router.get("/:id", validate(v.showroomIdParam), controller.getById);
router.post(
  "/:id/views",
  validate(v.showroomIdParam),
  controller.incrementViews,
);

module.exports = router;
