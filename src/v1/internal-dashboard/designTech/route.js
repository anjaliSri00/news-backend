const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/designTechValidations");

/* ══════════════════════════════════════════════════════════
 * DASHBOARD — auth + access on every route.
 *
 * Frontend sends:
 *   ?flow_id=<design_tech-flow>&page_id=<design_tech-*-page>
 * ══════════════════════════════════════════════════════════ */
// router.use(Auth.authenticateInternal, requireAccess);

/* READ */
router.get(
  "/",
  validate(v.listDesignTech),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.designTechIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);

/* WRITE */
router.post(
  "/add",
  validate(v.createDesignTech),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateDesignTech),
  Auth.authenticateInternal,
  controller.update,
);

/* LIFECYCLE */
router.patch(
  "/:id/status",
  validate(v.updateDesignTechStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

/* DELETE (soft) — last */
router.delete(
  "/:id",
  validate(v.designTechIdParam),
  Auth.authenticateInternal,
  controller.remove,
);

module.exports = router;
