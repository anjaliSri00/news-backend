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
router.get("/", validate(validationArray.listHomeDecor), controller.list);
router.get(
  "/:id",
  validate(validationArray.homeDecorIdParam),
  controller.getOne,
);

/* WRITE */
router.post("/add", validate(validationArray.createHomeDecor), Auth.authenticateInternal,controller.create);
router.put(
  "/:id",
  validate(validationArray.updateHomeDecor),
  controller.update,
);

/* LIFECYCLE — one endpoint */
router.patch(
  "/:id/status",
  validate(validationArray.updateHomeDecorStatus),
  controller.updateStatus,
);

/* DELETE (soft) — last */
router.delete(
  "/:id",
  validate(validationArray.homeDecorIdParam),
  controller.remove,
);

module.exports = router;
