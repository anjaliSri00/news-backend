const express = require("express");
const router = express.Router();

const controller = require("./controller");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/newsValidations");

/* ══════════════════════════════════════════════════════════
 * PUBLIC — no auth
 * ══════════════════════════════════════════════════════════ */
router.get("/", validate(v.listNews), controller.list);
router.get("/slug/:slug", validate(v.newsSlugParam), controller.getBySlug);
router.get("/:id", validate(v.newsIdParam), controller.getById);
router.post("/:id/views", validate(v.newsIdParam), controller.incrementViews);

module.exports = router;
