const service = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  INVALID_STATUS: 400,
  SHOWROOM_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  CODE_GEN_FAILED: 500,
  SERVER_ERROR: 500,
};
const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.SHOWROOM_INVALID_ID,
  INVALID_STATUS: responseMessages.SHOWROOM_INVALID_STATUS,
  SHOWROOM_NOT_FOUND: responseMessages.SHOWROOM_NOT_FOUND,
  SLUG_EXISTS: responseMessages.SHOWROOM_SLUG_EXISTS,
  NO_CHANGES: responseMessages.SHOWROOM_NO_CHANGES,
  CODE_GEN_FAILED: responseMessages.SHOWROOM_CODE_GEN_FAILED,
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
    const result = await service.listShowrooms(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.SHOWROOMS_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const getOne = async (req, res) => {
  try {
    const result = await service.getShowroomById(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.SHOWROOM_FETCHED, {
      showroom: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

const create = async (req, res) => {
  try {
    const result = await service.createShowroom(req.body, req.user.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, responseMessages.SHOWROOM_CREATED, {
      showroom: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

const update = async (req, res) => {
  try {
    const result = await service.updateShowroom(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.SHOWROOM_UPDATED, {
      showroom: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

const remove = async (req, res) => {
  try {
    const result = await service.deleteShowroom(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.SHOWROOM_DELETED, {
      showroom: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, restore } = req.body;
    const result = await service.updateShowroomStatus(req.params.id, {
      status,
      restore: restore === true,
    });
    if (!result.success) return respondFailure(res, result);
    const message = result.unchanged
      ? responseMessages.SHOWROOM_STATUS_UNCHANGED
      : responseMessages.SHOWROOM_STATUS_UPDATED;
    return customResponse(res, 200, message, {
      showroom: result.data,
      unchanged: result.unchanged || false,
      transitions: result.transitions || null,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

module.exports = { list, getOne, create, update, remove, updateStatus };
