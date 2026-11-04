const service = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  INVALID_STATUS: 400,
  DESIGN_TECH_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  CODE_GEN_FAILED: 500,
  SERVER_ERROR: 500,
};

const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.DESIGN_TECH_INVALID_ID,
  INVALID_STATUS: responseMessages.DESIGN_TECH_INVALID_STATUS,
  DESIGN_TECH_NOT_FOUND: responseMessages.DESIGN_TECH_NOT_FOUND,
  SLUG_EXISTS: responseMessages.DESIGN_TECH_SLUG_EXISTS,
  NO_CHANGES: responseMessages.DESIGN_TECH_NO_CHANGES,
  CODE_GEN_FAILED: responseMessages.DESIGN_TECH_CODE_GEN_FAILED,
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
    const result = await service.listDesignTech(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.DESIGN_TECH_LIST_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const getOne = async (req, res) => {
  try {
    const result = await service.getDesignTechById(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGN_TECH_FETCHED, {
      design_tech: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

const create = async (req, res) => {
  try {
    const result = await service.createDesignTech(req.body, req.user.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, responseMessages.DESIGN_TECH_CREATED, {
      design_tech: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

const update = async (req, res) => {
  try {
    const result = await service.updateDesignTech(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGN_TECH_UPDATED, {
      design_tech: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

const remove = async (req, res) => {
  try {
    const result = await service.deleteDesignTech(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGN_TECH_DELETED, {
      design_tech: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, restore } = req.body;
    const result = await service.updateDesignTechStatus(req.params.id, {
      status,
      restore: restore === true,
    });
    if (!result.success) return respondFailure(res, result);
    const message = result.unchanged
      ? responseMessages.DESIGN_TECH_STATUS_UNCHANGED
      : responseMessages.DESIGN_TECH_STATUS_UPDATED;
    return customResponse(res, 200, message, {
      design_tech: result.data,
      unchanged: result.unchanged || false,
      transitions: result.transitions || null,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

module.exports = { list, getOne, create, update, remove, updateStatus };
