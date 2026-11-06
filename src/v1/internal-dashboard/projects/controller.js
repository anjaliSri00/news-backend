const service = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  INVALID_STATUS: 400,
  PROJECT_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  CODE_GEN_FAILED: 500,
  SERVER_ERROR: 500,
};
const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.PROJECT_INVALID_ID,
  INVALID_STATUS: responseMessages.PROJECT_INVALID_STATUS,
  PROJECT_NOT_FOUND: responseMessages.PROJECT_NOT_FOUND,
  SLUG_EXISTS: responseMessages.PROJECT_SLUG_EXISTS,
  NO_CHANGES: responseMessages.PROJECT_NO_CHANGES,
  CODE_GEN_FAILED: responseMessages.PROJECT_CODE_GEN_FAILED,
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
  logger.error(`${fnName} error`, { error: error.message, stack: error.stack });
  return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
};

const list = async (req, res) => {
  try {
    const result = await service.listProjects(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.PROJECTS_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const getOne = async (req, res) => {
  try {
    const result = await service.getProjectById(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.PROJECT_FETCHED, {
      project: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

const create = async (req, res) => {
  try {
    const result = await service.createProject(req.body, req.user.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, responseMessages.PROJECT_CREATED, {
      project: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

const update = async (req, res) => {
  try {
    const result = await service.updateProject(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.PROJECT_UPDATED, {
      project: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

const remove = async (req, res) => {
  try {
    const result = await service.deleteProject(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.PROJECT_DELETED, {
      project: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, restore } = req.body;
    const result = await service.updateProjectStatus(req.params.id, {
      status,
      restore: restore === true,
    });
    if (!result.success) return respondFailure(res, result);
    const message = result.unchanged
      ? responseMessages.PROJECT_STATUS_UNCHANGED
      : responseMessages.PROJECT_STATUS_UPDATED;
    return customResponse(res, 200, message, {
      project: result.data,
      unchanged: result.unchanged || false,
      transitions: result.transitions || null,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

module.exports = { list, getOne, create, update, remove, updateStatus };
