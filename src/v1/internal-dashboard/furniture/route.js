const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/furnitureValidations");

/* ══════════════════════════════════════════════════════════
 * DASHBOARD — auth + access on every route.
 *
 * Frontend sends:
 *   ?flow_id=<furniture-flow>&page_id=<furniture-*-page>
 * ══════════════════════════════════════════════════════════ */
//router.use(Auth.authenticateInternal, requireAccess);

/* READ */
router.get(
  "/",
  validate(v.listFurniture),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.furnitureIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);

/* WRITE */
router.post(
  "/add",
  validate(v.createFurniture),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateFurniture),
  Auth.authenticateInternal,
  controller.update,
);

/* LIFECYCLE */
router.patch(
  "/:id/status",
  validate(v.updateFurnitureStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

/* DELETE (soft) — last */
router.delete(
  "/:id",
  validate(v.furnitureIdParam),
  Auth.authenticateInternal,
  controller.remove,
);

module.exports = router;
