const express = require("express");
const router = express.Router();
const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/editorialValidations");

//router.use(Auth.authenticateInternal, requireAccess);

router.get(
  "/",
  validate(v.listEditorials),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.editorialIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);
router.post(
  "/",
  validate(v.createEditorial),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateEditorial),
  Auth.authenticateInternal,
  controller.update,
);
router.patch(
  "/:id/status",
  validate(v.updateEditorialStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);
router.delete(
  "/:id",
  validate(v.editorialIdParam),
  Auth.authenticateInternal,
  controller.remove,
);

module.exports = router;
