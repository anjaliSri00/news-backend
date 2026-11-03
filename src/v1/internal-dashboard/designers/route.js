const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
//const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/designerValidations");

/* ══════════════════════════════════════════════════════════
 * DASHBOARD — auth + access enforced on every route.
 *
 * Frontend must send:
 *   ?flow_id=<designers-flow>&page_id=<designers-*-page>
 *
 * page_id mapping:
 *   GET    /               → designers.list
 *   GET    /:id            → designers.detail
 *   POST   /               → designers.create
 *   PUT    /:id            → designers.edit
 *   PATCH  /:id/status     → designers.list
 *   DELETE /:id            → designers.list + component_id + component_value_id
 * ══════════════════════════════════════════════════════════ */
//router.use(Auth.authenticateInternal, requireAccess);

/* ── READ ─────────────────────────────────────────────── */
router.get(
  "/",
  validate(v.listDesigners),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.designerIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);

/* ── WRITE ────────────────────────────────────────────── */
router.post(
  "/add",
  validate(v.createDesigner),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateDesigner),
  Auth.authenticateInternal,
  controller.update,
);

/* ── LIFECYCLE (publish/unpublish/archive/restore) ────── */
router.patch(
  "/:id/status",
  validate(v.updateDesignerStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

/* ── DELETE (soft) — must be last ─────────────────────── */
router.delete("/:id", validate(v.designerIdParam), Auth.authenticateInternal, controller.remove);

module.exports = router;
