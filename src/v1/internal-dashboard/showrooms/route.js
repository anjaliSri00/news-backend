const express = require("express");
const router = express.Router();
const controller = require("./controller");
const Auth = require("../../.../middlewares/auth");
const { requireAccess } = require("../../middlewares/access");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/showroomValidations");

//router.use(Auth.authenticateInternal, requireAccess);

router.get(
  "/",
  validate(v.listShowrooms),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.showroomIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);
router.post(
  "/",
  validate(v.createShowroom),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateShowroom),
  Auth.authenticateInternal,
  controller.update,
);
router.patch(
  "/:id/status",
  validate(v.updateShowroomStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);
router.delete(
  "/:id",
  validate(v.showroomIdParam),
  Auth.authenticateInternal,
  controller.remove,
);

module.exports = router;
