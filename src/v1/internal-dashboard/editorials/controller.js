const service = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  INVALID_STATUS: 400,
  EDITORIAL_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  CODE_GEN_FAILED: 500,
  SERVER_ERROR: 500,
};
const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.EDITORIAL_INVALID_ID,
  INVALID_STATUS: responseMessages.EDITORIAL_INVALID_STATUS,
  EDITORIAL_NOT_FOUND: responseMessages.EDITORIAL_NOT_FOUND,
  SLUG_EXISTS: responseMessages.EDITORIAL_SLUG_EXISTS,
  NO_CHANGES: responseMessages.EDITORIAL_NO_CHANGES,
  CODE_GEN_FAILED: responseMessages.EDITORIAL_CODE_GEN_FAILED,
  SERVER_ERROR: responseMessages.INTERNAL_SERVER_ERROR,
};

const respondFailure = (res, result) =>
  customResponse(
    res,
    CODE_STATUS_MAP[result.code] || 500,
    CODE_MESSAGE_MAP[result.code] || result.message,
    {},
  );
const respondUnexpected = (res, fnName, error) => {
  logger.error(`${fnName} controller error`, {
    error: error.message,
    stack: error.stack,
  });
  return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
};

const list = async (req, res) => {
  try {
    const result = await service.listEditorials(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.EDITORIALS_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const getOne = async (req, res) => {
  try {
    const result = await service.getEditorialById(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EDITORIAL_FETCHED, {
      editorial: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

const create = async (req, res) => {
  try {
    const result = await service.createEditorial(req.body, req.user.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, responseMessages.EDITORIAL_CREATED, {
      editorial: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

const update = async (req, res) => {
  try {
    const result = await service.updateEditorial(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EDITORIAL_UPDATED, {
      editorial: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

const remove = async (req, res) => {
  try {
    const result = await service.deleteEditorial(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EDITORIAL_DELETED, {
      editorial: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, restore } = req.body;
    const result = await service.updateEditorialStatus(req.params.id, {
      status,
      restore: restore === true,
    });
    if (!result.success) return respondFailure(res, result);
    const message = result.unchanged
      ? responseMessages.EDITORIAL_STATUS_UNCHANGED
      : responseMessages.EDITORIAL_STATUS_UPDATED;
    return customResponse(res, 200, message, {
      editorial: result.data,
      unchanged: result.unchanged || false,
      transitions: result.transitions || null,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

module.exports = { list, getOne, create, update, remove, updateStatus };
