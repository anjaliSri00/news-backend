const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validate = require("../../middlewares/validatorError");
const v = require("../../validations/contactValidations");

// Public Route (No Auth)
router.post("/submit", validate(v.submitContact), controller.submit);

module.exports = router;
