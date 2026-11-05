const service = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  INVALID_STATUS: 400,
  FURNITURE_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  CODE_GEN_FAILED: 500,
  SERVER_ERROR: 500,
};

const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.FURNITURE_INVALID_ID,
  INVALID_STATUS: responseMessages.FURNITURE_INVALID_STATUS,
  FURNITURE_NOT_FOUND: responseMessages.FURNITURE_NOT_FOUND,
  SLUG_EXISTS: responseMessages.FURNITURE_SLUG_EXISTS,
  NO_CHANGES: responseMessages.FURNITURE_NO_CHANGES,
  CODE_GEN_FAILED: responseMessages.FURNITURE_CODE_GEN_FAILED,
  SERVER_ERROR: responseMessages.INTERNAL_SERVER_ERROR,
};

const respondFailure = (res, result) => {
  const status = CODE_STATUS_MAP[result.code] || 500;
  const message =
    CODE_MESSAGE_MAP[result.code] ||
    result.message ||
    responseMessages.INTERNAL_SERVER_ERROR;
  return customResponse(res, status, message, {});
};

const respondUnexpected = (res, fnName, error) => {
  logger.error(`${fnName} controller error`, {
    error: error.message,
    stack: error.stack,
  });
  return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
};

const list = async (req, res) => {
  try {
    const result = await service.listFurniture(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.FURNITURE_LIST_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const getOne = async (req, res) => {
  try {
    const result = await service.getFurnitureById(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.FURNITURE_FETCHED, {
      furniture: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

const create = async (req, res) => {
  try {
    const result = await service.createFurniture(req.body, req.user.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, responseMessages.FURNITURE_CREATED, {
      furniture: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

const update = async (req, res) => {
  try {
    const result = await service.updateFurniture(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.FURNITURE_UPDATED, {
      furniture: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

const remove = async (req, res) => {
  try {
    const result = await service.deleteFurniture(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.FURNITURE_DELETED, {
      furniture: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, restore } = req.body;
    const result = await service.updateFurnitureStatus(req.params.id, {
      status,
      restore: restore === true,
    });
    if (!result.success) return respondFailure(res, result);
    const message = result.unchanged
      ? responseMessages.FURNITURE_STATUS_UNCHANGED
      : responseMessages.FURNITURE_STATUS_UPDATED;
    return customResponse(res, 200, message, {
      furniture: result.data,
      unchanged: result.unchanged || false,
      transitions: result.transitions || null,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

module.exports = { list, getOne, create, update, remove, updateStatus };
