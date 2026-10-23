const express = require("express");
const router = express.Router();

const { login, logout, me, create, list, revoke } = require("./controller"); // ← import all 6

const Auth = require("../../../middlewares/auth");
const validate = require("../../../middlewares/validatorError");
const validationArray = require("../../../validations/userValidations");

// ─── Public ───────────────────────────────────────────────
router.post("/login", validate(validationArray.login), login);
router.post("/logout", logout);

// ─── Authenticated (any internal user) ────────────────────
router.get("/me", Auth.authenticateInternal, me);

// ─── Authenticated (admin only — manage internal users) ───
router.get("/list", Auth.authenticateInternal, list); // ← auth added
router.post("/add", Auth.authenticateInternal, create); // ← auth added
router.delete("/:id", Auth.authenticateInternal, revoke); // ← auth added

module.exports = router;
