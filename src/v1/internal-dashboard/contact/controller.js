const service = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const respondFailure = (res, result) => {
  const status = CODE_STATUS_MAP[result.code] || 500;
  return customResponse(res, status, result.message, {});
};

const respondUnexpected = (res, fnName, error) => {
  logger.error(`${fnName} error`, { error: error.message, stack: error.stack });
  return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
};

const list = async (req, res) => {
  try {
    const result = await service.listContacts(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.CONTACTS_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const result = await service.updateStatus(req.params.id, req.body.status);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.CONTACT_STATUS_UPDATED, {
      message: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

const remove = async (req, res) => {
  try {
    const result = await service.deleteContact(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.CONTACT_DELETED, {
      message: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

module.exports = { list, updateStatus, remove };
