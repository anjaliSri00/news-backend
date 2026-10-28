const eventService = require("./service");
const customResponse = require("../../utils/responseHandler");
const responseMessages = require("../../utils/responseMessages");
const logger = require("../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  EVENT_NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.EVENT_INVALID_ID,
  EVENT_NOT_FOUND: responseMessages.EVENT_NOT_FOUND,
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
    const result = await eventService.listEvents(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.EVENTS_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

const getById = async (req, res) => {
  try {
    const result = await eventService.getEventById(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EVENT_FETCHED, {
      event: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getById", error);
  }
};

const getBySlug = async (req, res) => {
  try {
    const result = await eventService.getEventBySlug(req.params.slug);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EVENT_FETCHED, {
      event: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getBySlug", error);
  }
};

const incrementViews = async (req, res) => {
  try {
    const result = await eventService.incrementViews(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.VIEWS_INCREMENTED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "incrementViews", error);
  }
};

const incrementLikes = async (req, res) => {
  try {
    const result = await eventService.incrementLikes(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.LIKES_INCREMENTED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "incrementLikes", error);
  }
};

module.exports = {
  list,
  getById,
  getBySlug,
  incrementViews,
  incrementLikes,
};
