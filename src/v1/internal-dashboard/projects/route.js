const express = require("express");
const router = express.Router();
const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/projectValidations");

//router.use(Auth.authenticateInternal, requireAccess);

router.get("/", validate(v.listProjects), Auth.authenticateInternal, controller.list);
router.get("/:id", validate(v.projectIdParam), Auth.authenticateInternal, controller.getOne);
router.post("/add", validate(v.createProject), Auth.authenticateInternal, controller.create);
router.put("/:id", validate(v.updateProject), Auth.authenticateInternal, controller.update);
router.patch(
  "/:id/status",
  validate(v.updateProjectStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);
router.delete("/:id", validate(v.projectIdParam), Auth.authenticateInternal, controller.remove);

module.exports = router;
