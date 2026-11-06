const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/trendValidations");

router.get("/", validate(v.listTrends), controller.list);
router.get("/slug/:slug", validate(v.trendSlugParam), controller.getBySlug);
router.get("/:id", validate(v.trendIdParam), controller.getById);
router.post("/:id/views", validate(v.trendIdParam), controller.incrementViews);

module.exports = router;
