const eventService = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

/* ══════════════════════════════════════════════════════════
 * Service code → HTTP status
 * ══════════════════════════════════════════════════════════ */
const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  INVALID_STATUS: 400,
  EVENT_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  CODE_GEN_FAILED: 500,
  SERVER_ERROR: 500,
};

/* ══════════════════════════════════════════════════════════
 * Service code → user-facing message
 * ══════════════════════════════════════════════════════════ */
const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.EVENT_INVALID_ID,
  INVALID_STATUS: responseMessages.EVENT_INVALID_STATUS,
  EVENT_NOT_FOUND: responseMessages.EVENT_NOT_FOUND,
  SLUG_EXISTS: responseMessages.EVENT_SLUG_EXISTS,
  NO_CHANGES: responseMessages.EVENT_NO_CHANGES,
  CODE_GEN_FAILED: responseMessages.EVENT_CODE_GEN_FAILED,
  SERVER_ERROR: responseMessages.INTERNAL_SERVER_ERROR,
};

/* ──────────────────────────────────────────────────────
 * Expected failure
 * ────────────────────────────────────────────────────── */
const respondFailure = (res, result) => {
  const status = CODE_STATUS_MAP[result.code] || 500;
  const message =
    CODE_MESSAGE_MAP[result.code] ||
    result.message ||
    responseMessages.INTERNAL_SERVER_ERROR;
  return customResponse(res, status, message, {});
};

/* ──────────────────────────────────────────────────────
 * Unexpected failure
 * ────────────────────────────────────────────────────── */
const respondUnexpected = (res, fnName, error) => {
  logger.error(`${fnName} controller error`, {
    error: error.message,
    stack: error.stack,
  });
  return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
};

/* ══════════════════════════════════════════════════════════
 * GET /internal/events — list
 * ══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
 * GET /internal/events/:id — get one
 * ══════════════════════════════════════════════════════════ */
const getOne = async (req, res) => {
  try {
    const result = await eventService.getEventById(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EVENT_FETCHED, {
      event: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * POST /internal/events — create
 * ══════════════════════════════════════════════════════════ */
const create = async (req, res) => {
  try {
    const result = await eventService.createEvent(req.body, req.user.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, responseMessages.EVENT_CREATED, {
      event: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * PUT /internal/events/:id — update
 * ══════════════════════════════════════════════════════════ */
const update = async (req, res) => {
  try {
    const result = await eventService.updateEvent(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EVENT_UPDATED, {
      event: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * DELETE /internal/events/:id — soft delete
 * ══════════════════════════════════════════════════════════ */
const remove = async (req, res) => {
  try {
    const result = await eventService.deleteEvent(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.EVENT_DELETED, {
      event: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * PATCH /internal/events/:id/status
 * ══════════════════════════════════════════════════════════ */
const updateStatus = async (req, res) => {
  try {
    const { status, restore } = req.body;

    const result = await eventService.updateEventStatus(req.params.id, {
      status,
      restore: restore === true,
    });

    if (!result.success) return respondFailure(res, result);

    const message = result.unchanged
      ? responseMessages.EVENT_STATUS_UNCHANGED
      : responseMessages.EVENT_STATUS_UPDATED;

    return customResponse(res, 200, message, {
      event: result.data,
      unchanged: result.unchanged || false,
      transitions: result.transitions || null,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  updateStatus,
};
