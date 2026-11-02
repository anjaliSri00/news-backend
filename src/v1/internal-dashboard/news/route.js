const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
//const { requireAccess } = require("../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/newsValidations");

//router.use(Auth.authenticateInternal, requireAccess);

/* READ */
router.get("/list", validate(v.listNews), controller.list);
router.get("/:id", validate(v.newsIdParam), controller.getOne);

/* WRITE */
router.post("/add", validate(v.createNews), controller.create);
router.put("/:id", validate(v.updateNews), controller.update);

/* LIFECYCLE */
router.patch(
  "/:id/status",
  validate(v.updateNewsStatus),
  controller.updateStatus,
);

/* DELETE (last) */
router.delete("/:id", validate(v.newsIdParam), controller.remove);

module.exports = router;
