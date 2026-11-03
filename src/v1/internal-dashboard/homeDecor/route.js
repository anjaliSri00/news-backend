const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const validationArray = require("../../../validations/homeDecorValidation");

/* ══════════════════════════════════════════════════════════
 * DASHBOARD — auth + access on every route
 *
 * Frontend sends:
 *   ?flow_id=<home-decor-flow>&page_id=<home-decor-*-page>
 * ══════════════════════════════════════════════════════════ */

/* READ */
router.get("/", validate(validationArray.listHomeDecor), Auth.authenticateInternal, controller.list);
router.get(
  "/:id",
  validate(validationArray.homeDecorIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);

/* WRITE */
router.post("/add", validate(validationArray.createHomeDecor), Auth.authenticateInternal,controller.create);
router.put(
  "/:id",
  validate(validationArray.updateHomeDecor),
  Auth.authenticateInternal,
  controller.update,
);

/* LIFECYCLE — one endpoint */
router.patch(
  "/:id/status",
  validate(validationArray.updateHomeDecorStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

/* DELETE (soft) — last */
router.delete(
  "/:id",
  validate(validationArray.homeDecorIdParam),
  Auth.authenticateInternal,
  controller.remove,
);

module.exports = router;
