const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/productValidations");

router.get("/", validate(v.listProducts), controller.list);
router.get("/slug/:slug", validate(v.productSlugParam), controller.getBySlug);
router.get("/:id", validate(v.productIdParam), controller.getById);
router.post(
  "/:id/views",
  validate(v.productIdParam),
  controller.incrementViews,
);

module.exports = router;
