const eventService = require("./service");
const customResponse = require("../../utils/responseHandler");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  EVENT_NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const respondFailure = (res, result) => {
  const status = CODE_STATUS_MAP[result.code] || 500;
  return customResponse(res, status, result.message, {});
};

const list = async (req, res) => {
  const result = await eventService.listEvents(req.query);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Events fetched.", result.data);
};

const getById = async (req, res) => {
  const result = await eventService.getEventById(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event fetched.", { event: result.data });
};

const getBySlug = async (req, res) => {
  const result = await eventService.getEventBySlug(req.params.slug);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event fetched.", { event: result.data });
};

const incrementViews = async (req, res) => {
  const result = await eventService.incrementViews(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Views incremented.", result.data);
};

const incrementLikes = async (req, res) => {
  const result = await eventService.incrementLikes(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Likes incremented.", result.data);
};

module.exports = {
  list,
  getById,
  getBySlug,
  incrementViews,
  incrementLikes,
};
