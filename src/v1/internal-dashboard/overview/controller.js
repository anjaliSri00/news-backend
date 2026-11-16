const service = require("./service");
const customResponse = require("../../../utils/responseHandler");

const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  NOT_FOUND: 404,
  INVALID_DATA: 400,
  SERVER_ERROR: 500,
};
const respondFailure = (res, result) =>
  customResponse(res, CODE_STATUS_MAP[result.code] || 500, result.message, {});
const respondUnexpected = (res, fnName, error) => {
  logger.error(`${fnName} error`, { error: error.message, stack: error.stack });
  return customResponse(res, 500, "Something went wrong.", {});
};

const list = async (req, res) => {
  try {
    const result = await service.listLayouts(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, "Layouts fetched.", result.data);
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const getOne = async (req, res) => {
  try {
    const result = await service.getLayoutById(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, "Layout fetched.", { layout: result.data });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

const create = async (req, res) => {
  try {
    const result = await service.createLayout(req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, "Layout created.", { layout: result.data });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

const update = async (req, res) => {
  try {
    const result = await service.updateLayout(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, "Layout updated.", { layout: result.data });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

const remove = async (req, res) => {
  try {
    const result = await service.deleteLayout(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, "Layout deleted.", { layout: result.data });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const result = await service.updateLayoutStatus(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, "Status updated.", { layout: result.data });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

const getAvailable = async (req, res) => {
  try {
    const result = await service.getAvailableContent(
      req.params.type,
      req.query,
    );
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      `Available ${req.params.type}s fetched.`,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "getAvailable", error);
  }
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  updateStatus,
  getAvailable,
};
