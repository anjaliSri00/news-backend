const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
} = require("./controller");

const Auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validatorError");
const validationArray = require("../../validations/userValidations");

// ─── Public ───────────────────────────────────────────────
router.post("/signup", validate(validationArray.signup), signup);
router.post("/login", validate(validationArray.login), login);
router.post("/logout", logout);

// ─── Authenticated ────────────────────────────────────────
router.post("/refresh", Auth.authenticateWebsite, refresh);
router.get("/me", Auth.authenticateWebsite, me);
router.patch(
  "/me",
  Auth.authenticateWebsite,
  validate(validationArray.updateProfile),
  updateProfile,
);
router.post(
  "/change-password",
  Auth.authenticateWebsite,
  validate(validationArray.changePassword),
  changePassword,
);

module.exports = router;
