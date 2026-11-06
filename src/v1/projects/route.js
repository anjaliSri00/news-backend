const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/projectValidations");

router.get("/highlights", controller.getHighlights);
router.get("/", validate(v.listProjects), controller.list);
router.get("/slug/:slug", validate(v.projectSlugParam), controller.getBySlug);
router.get("/:id", validate(v.projectIdParam), controller.getById);
router.post(
  "/:id/views",
  validate(v.projectIdParam),
  controller.incrementViews,
);

module.exports = router;
