const express = require("express"); // Import express
const router = express.Router();
//const Auth = require("../../middlewares/auth");
//const validationArray = require("../../validations/commonRouteValidations");
//const userValidations = require("../../validations/userValidations");
//const validate = require("../../middlewares/validatorError");
const { uploadImage, notifyEmail } = require("./controller");
const { upload } = require("../../middlewares/uploadFile");
//const { mobileOtpVerification } = require("../../common/otpService");

// Route to add new page meta data
router.post(
  "/upload-image",
  //Auth.authenticateUser,
  upload.single("image"),
  //validate(validationArray.validateImageUpload),
  uploadImage
);

//To generate nad verify otp
//router.post("/otp", mobileOtpVerification);

//To get mail on mail
// router.post(
//   "/send-email",
//   validate(userValidations.emailValidator),
//   notifyEmail
// );

module.exports = router;
