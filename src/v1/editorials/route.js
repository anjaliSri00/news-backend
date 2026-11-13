const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/editorialValidations");

router.get("/", validate(v.listEditorials), controller.list);
router.get("/slug/:slug", validate(v.editorialSlugParam), controller.getBySlug);
router.get("/:id", validate(v.editorialIdParam), controller.getById);
router.post(
  "/:id/views",
  validate(v.editorialIdParam),
  controller.incrementViews,
);

module.exports = router;
