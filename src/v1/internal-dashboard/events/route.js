const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const validationArray = require("../../../validations/eventValidations");

/* ══════════════════════════════════════════════════════════
 * DASHBOARD — auth + access check on EVERY route
 *
 * Frontend sends: ?flow_id=<events-flow>&page_id=<events-*-page>
 *   list     → page_id = events.list
 *   getOne   → page_id = events.detail
 *   create   → page_id = events.create
 *   update   → page_id = events.edit
 *   remove   → page_id = events.list + component_id + component_value_id
 *   publish  → page_id = events.list
 *   archive  → page_id = events.edit
 *   restore  → page_id = events.list
 * ══════════════════════════════════════════════════════════ */
// router.use(Auth.authenticateInternal, requireAccess);

/* ── READ ─────────────────────────────────────────────── */
router.get("/", validate(validationArray.listEvents), controller.list);
router.get("/:id", validate(validationArray.eventIdParam), controller.getOne);

/* ── WRITE ────────────────────────────────────────────── */
router.post("/add", validate(validationArray.createEvent), Auth.authenticateInternal, controller.create);
router.put("/:id", validate(validationArray.updateEvent), controller.update);

/* ── LIFECYCLE ────────────────────────────────────────── */
router.post(
  "/:id/publish",
  validate(validationArray.eventIdParam),
  controller.publish,
);
router.post(
  "/:id/archive",
  validate(validationArray.eventIdParam),
  controller.archive,
);
router.post(
  "/:id/restore",
  validate(validationArray.eventIdParam),
  controller.restore,
);

/* ── DELETE (soft) — must be last so /:id/publish etc. match first ── */
router.delete(
  "/:id",
  validate(validationArray.eventIdParam),
  controller.remove,
);

module.exports = router;
