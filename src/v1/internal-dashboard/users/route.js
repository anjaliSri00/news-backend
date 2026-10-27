const express = require("express");
const router = express.Router();

const {
  login,
  logout,
  me,
  create,
  list,
  revoke,
  accessTree,
  grantAccess,
  revokeAccess,
  userAccess,
} = require("./controller");

const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const validationArray = require("../../../validations/userValidations");

/* ══════════════════════════════════════════════════════════
 * PUBLIC — no auth required
 * ══════════════════════════════════════════════════════════ */
router.post("/login", validate(validationArray.login), login);
router.post("/logout", logout);

/* ══════════════════════════════════════════════════════════
 * AUTH — any internal user can see their own profile
 * and the full access tree (read-only)
 * ══════════════════════════════════════════════════════════ */
router.get("/me", Auth.authenticateInternal, me);
router.get("/access/tree", Auth.authenticateInternal, accessTree);

/* ══════════════════════════════════════════════════════════
 * USER MANAGEMENT — requires users flow/page access
 * (superadmin bypasses automatically)
 *
 * Frontend must send query:
 *   GET    /internal/auth/list?flow_id=<users-flow>&page_id=<users-list-page>
 *   POST   /internal/auth/add?flow_id=<users-flow>&page_id=<users-add-page>
 *   DELETE /internal/auth/:id?flow_id=<users-flow>&page_id=<users-list-page>
 * ══════════════════════════════════════════════════════════ */
router.get("/list", Auth.authenticateInternal, requireAccess, list);
router.post("/add", Auth.authenticateInternal, requireAccess, create);
router.delete("/:id", Auth.authenticateInternal, requireAccess, revoke);

/* ══════════════════════════════════════════════════════════
 * ACCESS MANAGEMENT — requires users flow/page access
 *
 * Frontend must send query:
 *   POST /internal/auth/access/grant?flow_id=<users-flow>&page_id=<users-access-page>
 *   POST /internal/auth/access/revoke?flow_id=<users-flow>&page_id=<users-access-page>
 *   GET  /internal/auth/access/user/:userId?flow_id=<users-flow>&page_id=<users-access-page>
 * ══════════════════════════════════════════════════════════ */
router.post(
  "/access/grant",
  Auth.authenticateInternal,
  requireAccess,
  grantAccess,
);
router.post(
  "/access/revoke",
  Auth.authenticateInternal,
  requireAccess,
  revokeAccess,
);
router.get(
  "/access/user/:userId",
  Auth.authenticateInternal,
  requireAccess,
  userAccess,
);

module.exports = router;
