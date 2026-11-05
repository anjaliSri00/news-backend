const express = require("express");
const router = express.Router();

const controller = require("./controller");
const Auth = require("../../../middlewares/auth");
const { requireAccess } = require("../../../middlewares/access");
const validate = require("../../../middlewares/validatorError");
const v = require("../../../validations/productValidations");

//router.use(Auth.authenticateInternal, requireAccess);

/* READ */
router.get(
  "/",
  validate(v.listProducts),
  Auth.authenticateInternal,
  controller.list,
);
router.get(
  "/:id",
  validate(v.productIdParam),
  Auth.authenticateInternal,
  controller.getOne,
);

/* WRITE */
router.post(
  "/add",
  validate(v.createProduct),
  Auth.authenticateInternal,
  controller.create,
);
router.put(
  "/:id",
  validate(v.updateProduct),
  Auth.authenticateInternal,
  controller.update,
);

/* LIFECYCLE */
router.patch(
  "/:id/status",
  validate(v.updateProductStatus),
  Auth.authenticateInternal,
  controller.updateStatus,
);

/* DELETE (soft) */
router.delete(
  "/:id",
  validate(v.productIdParam),
  Auth.authenticateInternal,
  controller.remove,
);

module.exports = router;
