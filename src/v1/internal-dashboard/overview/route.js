const express = require("express");
const router = express.Router();
const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");

// Protect the route
//router.use(Auth.authenticateInternal, requireAccess);

router.post("/", Auth.authenticateInternal, controller.create);

module.exports = router;
