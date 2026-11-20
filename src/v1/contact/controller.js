const service = require("./service");
const customResponse = require("../../utils/responseHandler");
const responseMessages = require("../../utils/responseMessages");
const logger = require("../../utils/logger");

const submit = async (req, res) => {
  try {
    const result = await service.submitContact(req.body);
    if (!result.success) {
      return customResponse(res, 500, result.message, {});
    }
    return customResponse(
      res,
      201,
      responseMessages.CONTACT_SUBMITTED,
      result.data,
    );
  } catch (error) {
    logger.error("submitContact controller error", {
      error: error.message,
      stack: error.stack,
    });
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
};

module.exports = { submit };
