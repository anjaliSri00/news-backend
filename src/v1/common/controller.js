//const { uploadImageToMinIO } = require('../../common/minio');
const { uploadImageToS3 } = require("../../common/s3");
const customResponse = require('../../utils/responseHandler');
const responseMessages = require('../../utils/responseMessage');
const sendEmail = require('../../common/emailService');
const sgMail = require('@sendgrid/mail');

const uploadImage = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return customResponse(res, 400, responseMessages.TYPE_IS_MISSING, {});
    }

    if (!req.file) {
      return customResponse(
        res,
        400,
        responseMessages.IMAGE_FILE_IS_MISSING,
        {},
      );
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;

    const imageUrl = await uploadImageToS3({
      folder: type,
      fileName,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    return customResponse(
      res,
      200,
      responseMessages.IMAGE_SUCCESSFULLY_UPLOADED,
      { image_url: imageUrl },
    );
  } catch (err) {
    console.error('Image upload error:', err);
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
};

const notifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const message = `Query from ${email} on coming soon page of our website`;
    const to = "zuhouzofficial@gmail.com";
    const subject = "Coming Soon";
    await sendEmail(
        to,
        subject,
        `<p>${message}</p>`
      );

    return customResponse(res, 200, "Email sent successfully", {});
  } catch (error) {
    console.error("Error sending email:", error);
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
};


module.exports = {
  uploadImage,
  notifyEmail,
};
