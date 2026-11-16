const express = require("express");
const router = express.Router();
const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/homeOverviewValidations");

// Protect all routes
//router.use(Auth.authenticateInternal, requireAccess);

router.get(
  "/",
  validate(v.listLayouts),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.idParam),
  Auth.authenticateInternal,
  controller.getOne,
);
router.post(
  "/",
  validate(v.createLayout),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateLayout),
  Auth.authenticateInternal,
  controller.update,
);
router.patch(
  "/:id/status",
  validate(v.updateStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);
router.delete(
  "/:id",
  validate(v.idParam),
  Auth.authenticateInternal,
  controller.remove,
);

// Must be placed BEFORE /:id so "available" isn't treated as an ID
router.get(
  "/available/:type",
  validate(v.getAvailableContent),
  Auth.authenticateInternal,
  controller.getAvailable,
);

module.exports = router;
