const eventService = require("./service");
const customResponse = require("../../../utils/responseHandler");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  EVENT_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  ALREADY_PUBLISHED: 409,
  ALREADY_ARCHIVED: 409,
  CODE_GEN_FAILED: 500,
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

const getOne = async (req, res) => {
  const result = await eventService.getEventById(req.params.id, {
    includeDeleted: req.query.include_deleted === "true",
  });
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event fetched.", { event: result.data });
};

const create = async (req, res) => {
  const result = await eventService.createEvent(req.body, req.user.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 201, "Event created.", { event: result.data });
};

const update = async (req, res) => {
  const result = await eventService.updateEvent(req.params.id, req.body);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event updated.", { event: result.data });
};

const remove = async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event deleted.", { event: result.data });
};

const restore = async (req, res) => {
  const result = await eventService.restoreEvent(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event restored.", { event: result.data });
};

const publish = async (req, res) => {
  const result = await eventService.publishEvent(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event published.", { event: result.data });
};

const archive = async (req, res) => {
  const result = await eventService.archiveEvent(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Event archived.", { event: result.data });
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  restore,
  publish,
  archive,
};
