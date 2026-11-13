const service = require("./service");
const customResponse = require("../../utils/responseHandler");
const responseMessages = require("../../utils/responseMessages");
const logger = require("../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  EDITORIAL_NOT_FOUND: 404,
  SERVER_ERROR: 500,
};
const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.EDITORIAL_INVALID_ID,
  EDITORIAL_NOT_FOUND: responseMessages.EDITORIAL_NOT_FOUND,
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

const getById = async (req, res) => {
  try {
    const result = await service.getEditorialById(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EDITORIAL_FETCHED, {
      editorial: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getById", error);
  }
};

const getBySlug = async (req, res) => {
  try {
    const result = await service.getEditorialBySlug(req.params.slug);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EDITORIAL_FETCHED, {
      editorial: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getBySlug", error);
  }
};

const incrementViews = async (req, res) => {
  try {
    const result = await service.incrementViews(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.EDITORIAL_VIEWS_INCREMENTED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "incrementViews", error);
  }
};

module.exports = { list, getById, getBySlug, incrementViews };
