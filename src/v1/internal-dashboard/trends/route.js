const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/trendValidations");

//router.use(Auth.authenticateInternal, requireAccess);

/* READ */
router.get(
  "/",
  validate(v.listTrends),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.trendIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);

/* WRITE */
router.post(
  "/add",
  validate(v.createTrend),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateTrend),
  Auth.authenticateInternal,
  controller.update,
);

/* LIFECYCLE */
router.patch(
  "/:id/status",
  validate(v.updateTrendStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

/* DELETE (soft) */
router.delete("/:id", validate(v.trendIdParam), Auth.authenticateInternal, controller.remove);

module.exports = router;
