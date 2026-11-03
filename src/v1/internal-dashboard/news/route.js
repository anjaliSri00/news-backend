const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
//const { requireAccess } = require("../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/newsValidations");

//router.use(Auth.authenticateInternal, requireAccess);

/* READ */
router.get("/list", validate(v.listNews), Auth.authenticateInternal, controller.list);
router.get("/:id", validate(v.newsIdParam), Auth.authenticateInternal, controller.getOne);

/* WRITE */
router.post("/add", validate(v.createNews), Auth.authenticateInternal, controller.create);
router.put("/:id", validate(v.updateNews), Auth.authenticateInternal, controller.update);

/* LIFECYCLE */
router.patch(
  "/:id/status",
  validate(v.updateNewsStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

/* DELETE (last) */
router.delete("/:id", validate(v.newsIdParam), Auth.authenticateInternal, controller.remove);

module.exports = router;
