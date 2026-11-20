const express = require("express");
const router = express.Router();
const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/contactValidations");

// Protect all dashboard routes
//router.use(Auth.authenticateInternal, requireAccess);

router.get(
  "/",
  validate(v.listContacts),
  Auth.authenticateInternal,
  controller.list,
);

router.patch(
  "/:id/status",
  validate(v.updateContactStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

router.delete(
  "/:id",
  validate(v.idParam),
  Auth.authenticateInternal,
  controller.remove,
);

module.exports = router;
